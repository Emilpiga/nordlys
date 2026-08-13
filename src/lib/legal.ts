import { shopifyConfig } from "@/lib/shopify/config";

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

/** Public company identity for legal pages, footer, and JSON-LD. */
export type LegalIdentity = {
  tradingName: string;
  legalName: string;
  address: string;
  orgNumber: string;
  vatNumber: string;
  email: string;
  returnsAddress: string;
};

export function getLegalIdentity(): LegalIdentity {
  return {
    tradingName: shopifyConfig.storeName,
    legalName: cleanEnv(process.env.NEXT_PUBLIC_LEGAL_NAME),
    address: cleanEnv(process.env.NEXT_PUBLIC_LEGAL_ADDRESS),
    orgNumber: cleanEnv(process.env.NEXT_PUBLIC_ORG_NUMBER),
    vatNumber: cleanEnv(process.env.NEXT_PUBLIC_VAT_NUMBER),
    email: shopifyConfig.supportEmail,
    returnsAddress: cleanEnv(process.env.NEXT_PUBLIC_RETURNS_ADDRESS),
  };
}

export function hasRegisteredEntity(identity: LegalIdentity) {
  return Boolean(
    identity.legalName ||
      identity.address ||
      identity.orgNumber ||
      identity.vatNumber,
  );
}

/** Placeholders used in legal dictionary strings. */
export function legalCopyVars(identity = getLegalIdentity()) {
  const seller = identity.legalName || identity.tradingName;
  return {
    brand: identity.tradingName,
    email: identity.email,
    legalName: seller,
    legalAddress: identity.address,
    orgNumber: identity.orgNumber,
    vatNumber: identity.vatNumber,
    returnsAddress: identity.returnsAddress,
    seller,
  };
}

export function identityFactItems(
  labels: {
    legalName: string;
    tradingName: string;
    legalAddress: string;
    orgNumber: string;
    vatNumber: string;
    legalEmail: string;
    returnsAddress: string;
  },
  identity = getLegalIdentity(),
  options?: { includeReturns?: boolean },
) {
  const items = [
    { label: labels.legalName, value: identity.legalName },
    {
      label: labels.tradingName,
      value:
        identity.tradingName && identity.tradingName !== identity.legalName
          ? identity.tradingName
          : "",
    },
    { label: labels.legalAddress, value: identity.address },
    { label: labels.orgNumber, value: identity.orgNumber },
    { label: labels.vatNumber, value: identity.vatNumber },
    { label: labels.legalEmail, value: identity.email },
  ];

  if (options?.includeReturns) {
    items.push({
      label: labels.returnsAddress,
      value: identity.returnsAddress,
    });
  }

  return items;
}
