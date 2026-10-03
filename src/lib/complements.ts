/**
 * Which collections go together. Cart suggestions pull products from these;
 * collection pages link to them with editorial tiles.
 */

/** Each collection points at what finishes the outfit. */
export const CART_COMPLEMENTS: Record<string, string[]> = {
  "dam-ytterklader": ["dam-accessoarer", "dam-stickat"],
  "dam-stickat": ["dam-accessoarer", "dam-ytterklader"],
  "dam-toppar": ["dam-stickat", "dam-accessoarer"],
  "dam-klanningar": ["dam-accessoarer", "dam-ytterklader"],
  "dam-set": ["dam-accessoarer", "dam-ytterklader"],
  "dam-byxor": ["dam-toppar", "dam-stickat"],
  "dam-accessoarer": ["dam-stickat", "dam-ytterklader"],
  "herr-ytterklader": ["herr-accessoarer", "herr-stickat"],
  "herr-stickat": ["herr-accessoarer", "herr-toppar"],
  "herr-toppar": ["herr-stickat", "herr-accessoarer"],
  "herr-byxor": ["herr-toppar", "herr-accessoarer"],
  "herr-accessoarer": ["herr-stickat", "herr-ytterklader"],
};

/** Collections worth a detour from this one — never the page itself. */
const TILE_LINKS: Record<string, string[]> = {
  klader: ["dam", "herr"],
  dam: ["dam-ytterklader", "dam-stickat"],
  herr: ["herr-ytterklader", "herr-stickat"],
};

export function collectionTileHandles(handle: string): string[] {
  const links = TILE_LINKS[handle] ?? CART_COMPLEMENTS[handle] ?? [];
  return links.filter((link) => link !== handle);
}
