"use client";

import Image from "next/image";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { ProductImage } from "@/lib/shopify/types";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const CLICK_SCALE = 2.45;
const ZOOM_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export type LightboxZoomState = "min" | "mid" | "max";

export type LightboxZoomHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
};

type View = {
  scale: number;
  x: number;
  y: number;
};

type Size = {
  viewW: number;
  viewH: number;
  fittedW: number;
  fittedH: number;
};

type PanGesture = {
  type: "pan";
  x: number;
  y: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type PinchGesture = {
  type: "pinch";
  dist: number;
  scale: number;
  lx: number;
  ly: number;
};

const REST: View = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function containedSize(
  viewW: number,
  viewH: number,
  imageW: number,
  imageH: number,
) {
  if (viewW <= 0 || viewH <= 0) return { w: 0, h: 0 };
  const aspect = imageW > 0 && imageH > 0 ? imageW / imageH : 4 / 5;
  const width = Math.min(viewW, viewH * aspect);
  return { w: width, h: width / aspect };
}

function bandOf(scale: number): LightboxZoomState {
  if (scale <= 1.02) return "min";
  if (scale >= MAX_SCALE - 0.05) return "max";
  return "mid";
}

function nearly(a: View, b: View) {
  return (
    Math.abs(a.scale - b.scale) < 0.001 &&
    Math.abs(a.x - b.x) < 0.4 &&
    Math.abs(a.y - b.y) < 0.4
  );
}

function resolve(next: View, size: Size): View {
  const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
  if (scale <= 1.001 || size.fittedW <= 0 || size.viewW <= 0) {
    return REST;
  }
  const maxX = Math.max(0, (size.fittedW * scale - size.viewW) / 2);
  const maxY = Math.max(0, (size.fittedH * scale - size.viewH) / 2);
  return {
    scale,
    x: clamp(next.x, -maxX, maxX),
    y: clamp(next.y, -maxY, maxY),
  };
}

export const LightboxZoomImage = forwardRef<
  LightboxZoomHandle,
  {
    image: ProductImage;
    productTitle: string;
    onZoomStateChange?: (state: LightboxZoomState) => void;
  }
>(function LightboxZoomImage({ image, productTitle, onZoomStateChange }, ref) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>(REST);
  const sizeRef = useRef<Size>({ viewW: 0, viewH: 0, fittedW: 0, fittedH: 0 });
  const motionRef = useRef<"smooth" | "direct">("smooth");
  const bandRef = useRef<LightboxZoomState>("min");
  const onZoomStateChangeRef = useRef(onZoomStateChange);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<PanGesture | PinchGesture | null>(null);
  const suppressSwipe = useRef(false);
  const lastToggle = useRef(0);
  const smoothFrame = useRef<number | null>(null);
  const zoomByRef = useRef<(direction: 1 | -1) => void>(() => {});
  const zoomTowardRef = useRef<
    (
      clientX: number,
      clientY: number,
      nextScale: number,
      nextMotion: "smooth" | "direct",
    ) => void
  >(() => {});

  const [view, setView] = useState<View>(REST);
  const [fitted, setFitted] = useState({ w: 0, h: 0 });
  const [motion, setMotion] = useState<"smooth" | "direct">("smooth");
  const [reduceMotion, setReduceMotion] = useState(false);

  onZoomStateChangeRef.current = onZoomStateChange;

  function commit(next: View, nextMotion: "smooth" | "direct") {
    const resolved = resolve(next, sizeRef.current);
    const previous = viewRef.current;
    viewRef.current = resolved;
    const band = bandOf(resolved.scale);
    if (band !== bandRef.current) {
      bandRef.current = band;
      onZoomStateChangeRef.current?.(band);
    }
    if (nearly(previous, resolved)) return;
    motionRef.current = nextMotion;
    setMotion(nextMotion);
    setView(resolved);
  }

  function pointFromClient(clientX: number, clientY: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2),
    };
  }

  function zoomToward(
    clientX: number,
    clientY: number,
    nextScale: number,
    nextMotion: "smooth" | "direct",
  ) {
    const current = viewRef.current;
    const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (scale <= 1.001) {
      commit(REST, nextMotion);
      return;
    }
    const point = pointFromClient(clientX, clientY);
    const ratio = scale / current.scale;
    commit(
      {
        scale,
        x: point.x - (point.x - current.x) * ratio,
        y: point.y - (point.y - current.y) * ratio,
      },
      nextMotion,
    );
  }

  function smoothZoomToward(clientX: number, clientY: number, nextScale: number) {
    if (motionRef.current === "smooth") {
      zoomToward(clientX, clientY, nextScale, "smooth");
      return;
    }
    motionRef.current = "smooth";
    setMotion("smooth");
    if (smoothFrame.current != null) cancelAnimationFrame(smoothFrame.current);
    smoothFrame.current = requestAnimationFrame(() => {
      smoothFrame.current = null;
      zoomToward(clientX, clientY, nextScale, "smooth");
    });
  }

  function zoomBy(direction: 1 | -1) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const current = viewRef.current.scale;
    if (direction > 0) {
      const next = current <= 1.02 ? CLICK_SCALE : Math.min(MAX_SCALE, current * 1.4);
      smoothZoomToward(cx, cy, next);
      return;
    }
    const next = current / 1.4;
    smoothZoomToward(cx, cy, next <= 1.08 ? 1 : next);
  }

  zoomByRef.current = zoomBy;
  zoomTowardRef.current = zoomToward;

  useImperativeHandle(ref, () => ({
    zoomIn() {
      zoomByRef.current(1);
    },
    zoomOut() {
      zoomByRef.current(-1);
    },
  }));

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    return () => {
      if (smoothFrame.current != null) cancelAnimationFrame(smoothFrame.current);
    };
  }, []);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const nextFitted = containedSize(
        rect.width,
        rect.height,
        image.width,
        image.height,
      );
      sizeRef.current = {
        viewW: rect.width,
        viewH: rect.height,
        fittedW: nextFitted.w,
        fittedH: nextFitted.h,
      };
      setFitted((current) =>
        Math.round(current.w) === Math.round(nextFitted.w) &&
        Math.round(current.h) === Math.round(nextFitted.h)
          ? current
          : nextFitted,
      );
      commit(viewRef.current, "direct");
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [image.width, image.height]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }
      event.preventDefault();
      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * element.clientHeight
            : event.deltaY;
      if (delta === 0) return;
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0018));
      zoomTowardRef.current(
        event.clientX,
        event.clientY,
        viewRef.current.scale * factor,
        "direct",
      );
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointers.current.size >= 2 || viewRef.current.scale > 1.02) {
      suppressSwipe.current = true;
    } else if (pointers.current.size === 1) {
      suppressSwipe.current = false;
    }

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1);
      const mid = pointFromClient((a.x + b.x) / 2, (a.y + b.y) / 2);
      const current = viewRef.current;
      gesture.current = {
        type: "pinch",
        dist,
        scale: current.scale,
        lx: (mid.x - current.x) / current.scale,
        ly: (mid.y - current.y) / current.scale,
      };
      return;
    }

    gesture.current = {
      type: "pan",
      x: event.clientX,
      y: event.clientY,
      originX: viewRef.current.x,
      originY: viewRef.current.y,
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const currentGesture = gesture.current;
    if (!currentGesture) return;

    if (currentGesture.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1);
      const mid = pointFromClient((a.x + b.x) / 2, (a.y + b.y) / 2);
      const scale = clamp(
        currentGesture.scale * (dist / currentGesture.dist),
        MIN_SCALE,
        MAX_SCALE,
      );
      commit(
        {
          scale,
          x: mid.x - currentGesture.lx * scale,
          y: mid.y - currentGesture.ly * scale,
        },
        "direct",
      );
      return;
    }

    if (currentGesture.type !== "pan") return;
    const dx = event.clientX - currentGesture.x;
    const dy = event.clientY - currentGesture.y;
    if (Math.hypot(dx, dy) > 5) currentGesture.moved = true;
    if (!currentGesture.moved || viewRef.current.scale <= 1.02) return;
    suppressSwipe.current = true;
    commit(
      {
        scale: viewRef.current.scale,
        x: currentGesture.originX + dx,
        y: currentGesture.originY + dy,
      },
      "direct",
    );
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      gesture.current = {
        type: "pan",
        x: remaining.x,
        y: remaining.y,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
        moved: true,
      };
      return;
    }

    const finished = gesture.current;
    gesture.current = null;
    if (event.type === "pointercancel") return;
    if (finished?.type !== "pan" || finished.moved) return;

    const now = performance.now();
    if (now - lastToggle.current < 320) return;
    lastToggle.current = now;

    if (viewRef.current.scale > 1.02) {
      smoothZoomToward(event.clientX, event.clientY, 1);
      return;
    }
    smoothZoomToward(event.clientX, event.clientY, CLICK_SCALE);
  }

  function onTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (
      suppressSwipe.current ||
      viewRef.current.scale > 1.02 ||
      event.touches.length > 0
    ) {
      event.stopPropagation();
    }
  }

  const zoomed = view.scale > 1.02;

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-hidden select-none ${
        zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
      }`}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchEnd={onTouchEnd}
      onDragStart={(event) => event.preventDefault()}
    >
      {fitted.w > 0 ? (
        <div
          className="absolute top-1/2 left-1/2 will-change-transform"
          style={{
            width: fitted.w,
            height: fitted.h,
            transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})`,
            transition:
              motion === "smooth" && !reduceMotion
                ? `transform 460ms ${ZOOM_EASING}`
                : "none",
          }}
        >
          <Image
            src={image.url}
            alt={image.altText || productTitle}
            fill
            preload
            quality={90}
            draggable={false}
            className="pointer-events-none animate-image-in object-contain"
            sizes="(max-width: 768px) 250vw, 2800px"
          />
        </div>
      ) : null}
    </div>
  );
});
