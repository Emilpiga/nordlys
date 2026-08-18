import type { CollectionSummary } from "./types";

const EXCLUDED_HANDLES = new Set([
  "frontpage",
  "home",
  "home-page",
  "homepage",
  "startsida",
  "all",
  "all-products",
]);

const EXCLUDED_TITLE_PATTERN =
  /^(home\s*page|homepage|frontpage|startsida|alla produkter|all products)$/i;

/** Canonical room walk for the landing page and nav. */
export const ROOM_ORDER = [
  "vardagsrum",
  "sovrum",
  "kok",
  "tradgard",
] as const;

type RoomKey = (typeof ROOM_ORDER)[number];

const ROOM_ALIASES: Record<string, RoomKey> = {
  vardagsrum: "vardagsrum",
  livingroom: "vardagsrum",
  living: "vardagsrum",
  sovrum: "sovrum",
  bedroom: "sovrum",
  kok: "kok",
  kitchen: "kok",
  tradgard: "tradgard",
  garden: "tradgard",
  outdoor: "tradgard",
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Drop Shopify system collections that should not appear as shop categories. */
export function isBrowsableCollection(
  collection: Pick<CollectionSummary, "handle" | "title">,
): boolean {
  const handle = collection.handle.trim().toLowerCase();
  const title = collection.title.trim();

  if (EXCLUDED_HANDLES.has(handle)) return false;
  if (EXCLUDED_TITLE_PATTERN.test(title)) return false;

  return true;
}

export function roomKeyFromCollection(
  collection: Pick<CollectionSummary, "handle" | "title">,
): RoomKey | null {
  const handle = normalizeKey(collection.handle);
  const title = normalizeKey(collection.title);
  return ROOM_ALIASES[handle] ?? ROOM_ALIASES[title] ?? null;
}

export function isRoomCollection(
  collection: Pick<CollectionSummary, "handle" | "title">,
): boolean {
  return roomKeyFromCollection(collection) !== null;
}

/** Prefer a room collection (Kök, Sovrum…) when a product sits in several. */
export function primaryCollection(
  collections: { handle: string; title: string }[],
): { handle: string; title: string } | null {
  const browsable = collections.filter(isBrowsableCollection);
  if (browsable.length === 0) return null;

  const rooms = browsable.filter(isRoomCollection);
  const pool = rooms.length > 0 ? rooms : browsable;

  return [...pool].sort((a, b) => {
    const aKey = roomKeyFromCollection(a);
    const bKey = roomKeyFromCollection(b);
    const aIndex = aKey ? ROOM_ORDER.indexOf(aKey) : ROOM_ORDER.length;
    const bIndex = bKey ? ROOM_ORDER.indexOf(bKey) : ROOM_ORDER.length;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.title.localeCompare(b.title, "sv");
  })[0] ?? null;
}

/** Known rooms first, then every other published collection. */
export function roomsFromCollections(
  collections: CollectionSummary[],
): CollectionSummary[] {
  return [...collections].sort((a, b) => {
    const aKey = roomKeyFromCollection(a);
    const bKey = roomKeyFromCollection(b);
    const aIndex = aKey ? ROOM_ORDER.indexOf(aKey) : ROOM_ORDER.length;
    const bIndex = bKey ? ROOM_ORDER.indexOf(bKey) : ROOM_ORDER.length;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.title.localeCompare(b.title, "sv");
  });
}
