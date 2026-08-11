/**
 * @deprecated Prefer `dict.fulfillment` from `useDictionary()` / `getDictionary`.
 * Kept for pages not yet migrated to i18n dictionaries.
 */

export const fulfillment = {
  /** Typical door-to-door for SE/EU after payment clears. */
  etaShort: "7–18 arbetsdagar",
  etaDetail:
    "De flesta ordrar lämnar lagret inom 1–3 arbetsdagar efter betalning. Därefter tar leveransen vanligtvis 7–18 arbetsdagar till adresser i Sverige och EU. Internationellt utanför EU kan det ta längre tid.",
  tracking:
    "Du får spårning så snart transportören har skannat paketet.",
  returns:
    "14 dagars ångerrätt för oanvända varor i originalförpackning. Skadade eller felaktiga produkter ersätter vi.",
  guaranteeShort: "14 dagars ångerrätt · defekter ersätts",
  secureCheckout: "Säker kassa via Shopify",
} as const;
