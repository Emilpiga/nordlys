"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type OptionSelectItem = {
  value: string;
  unavailable?: boolean;
};

type OptionSelectProps = {
  label: string;
  value: string;
  options: OptionSelectItem[];
  onChange: (value: string) => void;
};

const PANEL_MAX_HEIGHT = 280;

export function OptionSelect({
  label,
  value,
  options,
  onChange,
}: OptionSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(value);
  const [panel, setPanel] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setHighlight(value);
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) {
      setPanel(null);
      return;
    }

    function update() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
      const spaceAbove = rect.top - gap - 12;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(
        PANEL_MAX_HEIGHT,
        Math.max(120, openUp ? spaceAbove : spaceBelow),
      );

      setPanel({
        top: openUp ? undefined : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (options.length === 0) return;
      const currentIndex = Math.max(
        0,
        options.findIndex((option) => option.value === highlight),
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight(options[(currentIndex + 1) % options.length].value);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight(
          options[(currentIndex - 1 + options.length) % options.length].value,
        );
      } else if (event.key === "Home") {
        event.preventDefault();
        setHighlight(options[0].value);
      } else if (event.key === "End") {
        event.preventDefault();
        setHighlight(options[options.length - 1].value);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const next = options.find((option) => option.value === highlight);
        if (next) {
          onChange(next.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    };

    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      const panelNode = document.getElementById(listId);
      if (target && panelNode?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [open, highlight, options, onChange, listId]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 border bg-[color-mix(in_oklab,var(--frost)_88%,white)] px-3.5 py-2.5 text-left text-sm transition ${
          open
            ? "border-foreground/55"
            : "border-border/80 hover:border-foreground/40"
        }`}
      >
        <span className="min-w-0 truncate text-foreground">{value}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && panel
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              style={{
                top: panel.top,
                bottom: panel.bottom,
                left: panel.left,
                width: panel.width,
                maxHeight: panel.maxHeight,
              }}
              className="fixed z-[80] overflow-y-auto overscroll-contain border border-border/70 bg-[color-mix(in_oklab,var(--frost)_98%,white)] py-1.5 shadow-[0_18px_50px_rgba(20,28,34,0.16)]"
            >
              {options.map((option) => {
                const selected = option.value === value;
                const active = option.value === highlight;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={selected}
                  >
                    <button
                      ref={active ? activeRef : undefined}
                      type="button"
                      onMouseEnter={() => setHighlight(option.value)}
                      onClick={() => choose(option.value)}
                      className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition ${
                        option.unavailable
                          ? "text-muted/50 line-through hover:bg-[color-mix(in_oklab,var(--mist)_40%,white)]"
                          : active
                            ? "bg-[color-mix(in_oklab,var(--mist)_70%,white)] text-foreground"
                            : "text-foreground/85 hover:bg-[color-mix(in_oklab,var(--mist)_40%,white)]"
                      }`}
                    >
                      <span className="min-w-0 truncate">{option.value}</span>
                      {selected ? (
                        <span className="h-1.5 w-1.5 shrink-0 bg-foreground" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
