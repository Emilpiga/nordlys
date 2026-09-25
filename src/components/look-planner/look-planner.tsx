"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PlannerLook,
  PlannerView,
  PlannerWeek,
} from "@/lib/look-planner/view";

const PIECES = 3;

function formatKr(amount: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** App Bridge loads as a blocking script, but hydration can still win the race. */
async function appBridge(timeoutMs = 10_000) {
  const started = Date.now();
  while (typeof window.shopify?.idToken !== "function") {
    if (Date.now() - started > timeoutMs) {
      throw new Error("Öppna Veckans look från Appar i Shopify admin.");
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return window.shopify;
}

async function plannerFetch(path: string, body?: unknown): Promise<PlannerView> {
  const token = await (await appBridge()).idToken();
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? `Fel ${response.status}`);
  return json as PlannerView;
}

/** The weekly-look planner, embedded in Shopify admin. */
export function LookPlanner() {
  const [view, setView] = useState<PlannerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, request: () => Promise<PlannerView>, done?: string) => {
      setBusy(key);
      try {
        setView(await request());
        setError(null);
        if (done) shopify.toast.show(done);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        shopify.toast.show(message, { isError: true });
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    plannerFetch("/api/shopify-admin/state")
      .then((next) => {
        if (!cancelled) setView(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error && !view) {
    return (
      <s-page heading="Veckans look">
        <s-banner tone="critical" heading="Kunde inte ladda planeringen">
          <s-paragraph>{error}</s-paragraph>
        </s-banner>
      </s-page>
    );
  }

  if (!view) {
    return (
      <s-page heading="Veckans look">
        <s-section>
          <s-stack alignItems="center" padding="large">
            <s-spinner accessibilityLabel="Laddar" />
          </s-stack>
        </s-section>
      </s-page>
    );
  }

  function changeLook(week: PlannerWeek, look: PlannerLook, body: object, done: string) {
    return run(
      `${week.weekStart}:${look.slot}`,
      () =>
        plannerFetch("/api/shopify-admin/looks", {
          weekStart: week.weekStart,
          slot: look.slot,
          ...body,
        }),
      done,
    );
  }

  async function pickProducts(week: PlannerWeek, look: PlannerLook) {
    const selected = await shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: PIECES,
      selectionIds: look.products.flatMap((product) =>
        product ? [{ id: product.id }] : [],
      ),
    });
    if (!selected) return;
    if (selected.length !== PIECES) {
      shopify.toast.show(`Välj exakt ${PIECES} produkter`, { isError: true });
      return;
    }
    await changeLook(
      week,
      look,
      { action: "manual", productIds: selected.map((product) => product.id) },
      "Looken är sparad",
    );
  }

  return (
    <s-page heading="Veckans look" inlineSize="large">
      <s-link slot="secondary-actions" href={view.storefrontUrl} target="_blank">
        Visa butiken
      </s-link>

      <PublishStatus view={view} />

      {view.weeks.map((week) => (
        <s-section
          key={week.weekStart}
          heading={`Vecka ${week.weekNumber} · ${week.range}${week.isCurrent ? " · nu" : ""}`}
        >
          <s-grid
            gridTemplateColumns="repeat(auto-fill, minmax(240px, 1fr))"
            gap="base"
          >
            {week.looks.map((look) => (
              <LookCard
                key={look.slot}
                look={look}
                percent={view.settings.discountPercent}
                busy={busy === `${week.weekStart}:${look.slot}`}
                disabled={busy !== null}
                onPick={() => pickProducts(week, look)}
                onReroll={() =>
                  changeLook(week, look, { action: "reroll" }, "Nytt förslag")
                }
                onAuto={() =>
                  changeLook(week, look, { action: "auto" }, "Tillbaka till auto")
                }
              />
            ))}
          </s-grid>
        </s-section>
      ))}

      <SettingsSection
        view={view}
        busy={busy === "settings"}
        onSave={(settings) =>
          run(
            "settings",
            () => plannerFetch("/api/shopify-admin/settings", settings),
            "Inställningarna är sparade",
          )
        }
      />
    </s-page>
  );
}

function PublishStatus({ view }: { view: PlannerView }) {
  const { settings } = view;
  if (settings.lastPublishError) {
    return (
      <s-banner tone="critical" heading="Rabatten kunde inte uppdateras">
        <s-paragraph>{settings.lastPublishError}</s-paragraph>
      </s-banner>
    );
  }
  if (!settings.discountActive) {
    return (
      <s-banner tone="warning" heading="Rabatten är inte aktiv än">
        <s-paragraph>
          Looks visas i butiken, men rabatten på {settings.discountPercent} %
          aktiveras när rabattfunktionen är driftsatt.
        </s-paragraph>
      </s-banner>
    );
  }
  return (
    <s-banner tone="success" heading={`Hela looken ger ${settings.discountPercent} % rabatt`}>
      <s-paragraph>
        Rabatten gäller automatiskt när alla tre delarna i veckans look ligger
        i kassen.
        {settings.lastPublishedAt
          ? ` Senast uppdaterad ${new Date(settings.lastPublishedAt).toLocaleString("sv-SE")}.`
          : ""}
      </s-paragraph>
    </s-banner>
  );
}

function LookCard({
  look,
  percent,
  busy,
  disabled,
  onPick,
  onReroll,
  onAuto,
}: {
  look: PlannerLook;
  percent: number;
  busy: boolean;
  disabled: boolean;
  onPick: () => void;
  onReroll: () => void;
  onAuto: () => void;
}) {
  return (
    <s-box border="base" borderRadius="base" padding="base" background="base">
      <s-stack gap="small-200">
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <s-heading>{look.label}</s-heading>
          {look.mode === "manual" ? (
            <s-badge tone="info">Vald av dig</s-badge>
          ) : (
            <s-badge>Auto</s-badge>
          )}
        </s-stack>

        <s-grid gridTemplateColumns="2fr 1fr" gap="small-200">
          <Piece product={look.products[0]} tall />
          <s-stack gap="small-200">
            <Piece product={look.products[1]} />
            <Piece product={look.products[2]} />
          </s-stack>
        </s-grid>

        <s-stack gap="small-100">
          {look.products.map((product, index) => (
            <s-text key={product?.id ?? index} tone={product?.buyable === false ? "critical" : "auto"}>
              {index + 1}. {product?.title ?? "Produkten finns inte längre"}
              {product && !product.buyable ? " · slut" : ""}
            </s-text>
          ))}
        </s-stack>

        <s-stack direction="inline" gap="small-200" alignItems="baseline">
          <s-text type="strong">{formatKr(look.discounted)}</s-text>
          <s-text color="subdued">
            <s>{formatKr(look.total)}</s> · −{percent} %
          </s-text>
        </s-stack>

        {look.warning ? (
          <s-banner tone="warning">
            Något i looken går inte att köpa — välj om eller föreslå ny.
          </s-banner>
        ) : null}

        <s-stack direction="inline" gap="small-200">
          <s-button
            variant="primary"
            onClick={onPick}
            disabled={disabled}
            {...(busy ? { loading: true } : {})}
          >
            Välj produkter
          </s-button>
          <s-button onClick={onReroll} disabled={disabled} icon="refresh">
            Föreslå ny
          </s-button>
          {look.mode === "manual" ? (
            <s-button variant="tertiary" onClick={onAuto} disabled={disabled}>
              Tillbaka till auto
            </s-button>
          ) : null}
        </s-stack>
      </s-stack>
    </s-box>
  );
}

function Piece({
  product,
  tall = false,
}: {
  product: PlannerLook["products"][number];
  tall?: boolean;
}) {
  return (
    <s-box borderRadius="base" overflow="hidden" background="subdued">
      {product?.imageUrl ? (
        <s-image
          src={`${product.imageUrl}${product.imageUrl.includes("?") ? "&" : "?"}width=${tall ? 400 : 200}`}
          alt={product.title}
          aspectRatio={tall ? "3/4" : "1/1"}
          objectFit="cover"
          inlineSize="fill"
        />
      ) : (
        <s-box padding="large">
          <s-text color="subdued">Ingen bild</s-text>
        </s-box>
      )}
    </s-box>
  );
}

function SettingsSection({
  view,
  busy,
  onSave,
}: {
  view: PlannerView;
  busy: boolean;
  onSave: (settings: { discountPercent: number; varietyWeeks: number }) => void;
}) {
  const [discountPercent, setDiscountPercent] = useState(
    String(view.settings.discountPercent),
  );
  const [varietyWeeks, setVarietyWeeks] = useState(
    String(view.settings.varietyWeeks),
  );

  return (
    <s-section heading="Inställningar">
      <s-stack gap="base">
        <s-number-field
          label="Rabatt på hela looken"
          suffix="%"
          min={0}
          max={50}
          step={1}
          value={discountPercent}
          onInput={(event) => setDiscountPercent(event.currentTarget.value)}
        />
        <s-number-field
          label="Visa inte samma produkt igen inom"
          details="Gäller de automatiska förslagen. Dina egna val påverkas inte."
          suffix="veckor"
          min={1}
          max={26}
          step={1}
          value={varietyWeeks}
          onInput={(event) => setVarietyWeeks(event.currentTarget.value)}
        />
        <s-stack direction="inline">
          <s-button
            variant="primary"
            onClick={() =>
              onSave({
                discountPercent: Number(discountPercent),
                varietyWeeks: Number(varietyWeeks),
              })
            }
            {...(busy ? { loading: true } : {})}
          >
            Spara
          </s-button>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
