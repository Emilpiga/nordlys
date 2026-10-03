#!/usr/bin/env node
/**
 * Register translations on a Shopify resource (product, option, option value).
 */

import { assertNoUserErrors } from "./shopify-admin.mjs";

/** `entries`: [{ locale, key, value }] — keys the resource doesn't have are skipped. */
export async function registerTranslations(admin, resourceId, entries) {
  const wanted = entries.filter((entry) => entry.value);
  if (!wanted.length) return 0;

  const data = await admin.graphql(
    `query($resourceId: ID!) {
      translatableResource(resourceId: $resourceId) {
        translatableContent { key digest locale }
      }
    }`,
    { resourceId },
  );
  const digests = new Map(
    (data.translatableResource?.translatableContent ?? []).map((field) => [
      field.key,
      field,
    ]),
  );

  const translations = [];
  for (const { locale, key, value } of wanted) {
    const field = digests.get(key);
    if (!field?.digest || field.locale === locale) continue;
    translations.push({
      key,
      locale,
      value,
      translatableContentDigest: field.digest,
    });
  }

  for (let i = 0; i < translations.length; i += 40) {
    const result = await admin.graphql(
      `mutation($resourceId: ID!, $translations: [TranslationInput!]!) {
        translationsRegister(resourceId: $resourceId, translations: $translations) {
          userErrors { field message }
        }
      }`,
      { resourceId, translations: translations.slice(i, i + 40) },
    );
    assertNoUserErrors(
      result.translationsRegister.userErrors,
      `translations ${resourceId}`,
    );
  }
  return translations.length;
}
