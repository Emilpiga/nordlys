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

/** Clothing parent collections and their subcategory handles. */
export const CLOTHING_PARENTS = ["dam", "herr"] as const;
export type ClothingParent = (typeof CLOTHING_PARENTS)[number];

export const CLOTHING_CHILDREN: Record<ClothingParent, readonly string[]> = {
  dam: [
    "dam-ytterklader",
    "dam-toppar",
    "dam-stickat",
    "dam-klanningar",
    "dam-set",
    "dam-accessoarer",
  ],
  herr: [
    "herr-ytterklader",
    "herr-toppar",
    "herr-stickat",
    "herr-accessoarer",
  ],
};

const CLOTHING_CHILD_HANDLES = new Set(
  Object.values(CLOTHING_CHILDREN).flatMap((handles) => [...handles]),
);

export type NavCollectionGroup = {
  parent: CollectionSummary | null;
  /** Parent handle when grouping children without a published parent row. */
  key: string;
  children: CollectionSummary[];
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

export function isClothingChildHandle(handle: string) {
  return CLOTHING_CHILD_HANDLES.has(handle.trim().toLowerCase());
}

export function clothingParentFromHandle(
  handle: string,
): ClothingParent | null {
  const normalized = handle.trim().toLowerCase();
  if ((CLOTHING_PARENTS as readonly string[]).includes(normalized)) {
    return normalized as ClothingParent;
  }
  for (const parent of CLOTHING_PARENTS) {
    if (CLOTHING_CHILDREN[parent].includes(normalized)) return parent;
  }
  return null;
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

/**
 * Shop menu groups: Dam/Herr with children, then rooms and other top-level
 * collections. Child clothing collections are not listed flat.
 */
export function navGroupsFromCollections(
  collections: CollectionSummary[],
): NavCollectionGroup[] {
  const browsable = collections.filter(isBrowsableCollection);
  const byHandle = new Map(
    browsable.map((collection) => [
      collection.handle.trim().toLowerCase(),
      collection,
    ]),
  );

  const groups: NavCollectionGroup[] = [];
  const used = new Set<string>();

  for (const parentHandle of CLOTHING_PARENTS) {
    const parent = byHandle.get(parentHandle) ?? null;
    const children = CLOTHING_CHILDREN[parentHandle]
      .map((handle) => byHandle.get(handle))
      .filter((collection): collection is CollectionSummary =>
        Boolean(collection),
      );

    if (!parent && children.length === 0) continue;

    if (parent) used.add(parent.handle.toLowerCase());
    for (const child of children) used.add(child.handle.toLowerCase());

    groups.push({
      parent,
      key: parentHandle,
      children,
    });
  }

  const remaining = roomsFromCollections(
    browsable.filter((collection) => !used.has(collection.handle.toLowerCase())),
  ).filter((collection) => !isClothingChildHandle(collection.handle));

  for (const collection of remaining) {
    groups.push({
      parent: collection,
      key: collection.handle,
      children: [],
    });
  }

  return groups;
}

/** Top-level browse targets: rooms, Dam, Herr, Kläder — not clothing subcats. */
export function topLevelCollections(
  collections: CollectionSummary[],
): CollectionSummary[] {
  return roomsFromCollections(
    collections.filter(
      (collection) =>
        isBrowsableCollection(collection) &&
        !isClothingChildHandle(collection.handle),
    ),
  );
}

export function clothingChildrenFor(
  parent: ClothingParent,
  collections: CollectionSummary[],
): CollectionSummary[] {
  const byHandle = new Map(
    collections.map((collection) => [
      collection.handle.trim().toLowerCase(),
      collection,
    ]),
  );
  return CLOTHING_CHILDREN[parent]
    .map((handle) => byHandle.get(handle))
    .filter((collection): collection is CollectionSummary =>
      Boolean(collection),
    );
}

export function shortCollectionLabel(title: string, parentTitle?: string) {
  const trimmed = title.trim();
  if (!parentTitle) {
    return trimmed.replace(/^(Dam|Herr)\s+/i, "");
  }
  const prefix = parentTitle.trim();
  if (trimmed.toLowerCase().startsWith(`${prefix.toLowerCase()} `)) {
    return trimmed.slice(prefix.length).trim();
  }
  return trimmed.replace(/^(Dam|Herr)\s+/i, "");
}

export type CatalogCollectionNav = {
  /** Flat chip / filter list for the current context. */
  primary: CollectionSummary[];
  /** Subcategory chips when browsing Dam/Herr. */
  secondary: CollectionSummary[];
  /** Parent collection when active handle is a clothing child. */
  clothingParent: CollectionSummary | null;
  clothingParentKey: ClothingParent | null;
};

/**
 * Chips/filters for catalog pages:
 * - Default: top-level collections only
 * - On Dam/Herr (or a child): parent + siblings as secondary row
 */
export function catalogCollectionNav(
  collections: CollectionSummary[],
  activeHandle?: string | null,
): CatalogCollectionNav {
  const primary = topLevelCollections(collections);
  const parentKey = activeHandle
    ? clothingParentFromHandle(activeHandle)
    : null;

  if (!parentKey) {
    return {
      primary,
      secondary: [],
      clothingParent: null,
      clothingParentKey: null,
    };
  }

  const byHandle = new Map(
    collections.map((collection) => [
      collection.handle.trim().toLowerCase(),
      collection,
    ]),
  );
  const clothingParent = byHandle.get(parentKey) ?? null;
  const secondary = clothingChildrenFor(parentKey, collections);

  return {
    primary,
    secondary,
    clothingParent,
    clothingParentKey: parentKey,
  };
}
