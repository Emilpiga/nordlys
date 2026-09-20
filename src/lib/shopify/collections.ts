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

/** Umbrella clothing collection. Dam/Herr nest under this. */
export const CLOTHING_ROOT = "klader";

/** Gender collections under Kläder. */
export const CLOTHING_GENDERS = ["dam", "herr"] as const;
export type ClothingGender = (typeof CLOTHING_GENDERS)[number];

/** @deprecated Prefer CLOTHING_GENDERS — kept for older call sites. */
export const CLOTHING_PARENTS = CLOTHING_GENDERS;
export type ClothingParent = ClothingGender;

export const CLOTHING_CHILDREN: Record<ClothingGender, readonly string[]> = {
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

const CLOTHING_TYPE_HANDLES = new Set(
  Object.values(CLOTHING_CHILDREN).flatMap((handles) => [...handles]),
);

const CLOTHING_GENDER_HANDLES = new Set<string>(CLOTHING_GENDERS);

export type NavCollectionGroup = {
  parent: CollectionSummary | null;
  /** Parent handle when grouping children without a published parent row. */
  key: string;
  children: CollectionSummary[];
  /** Optional nested groups (e.g. Dam/Herr under Kläder). */
  nested?: NavCollectionGroup[];
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function byHandleMap(collections: CollectionSummary[]) {
  return new Map(
    collections.map((collection) => [
      collection.handle.trim().toLowerCase(),
      collection,
    ]),
  );
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

export function isClothingTypeHandle(handle: string) {
  return CLOTHING_TYPE_HANDLES.has(handle.trim().toLowerCase());
}

/** @deprecated Use isClothingTypeHandle */
export function isClothingChildHandle(handle: string) {
  return isClothingTypeHandle(handle);
}

export function isClothingGenderHandle(handle: string) {
  return CLOTHING_GENDER_HANDLES.has(handle.trim().toLowerCase());
}

/** Dam, Herr, or any type subcategory — not the Kläder root. */
export function isClothingNestedHandle(handle: string) {
  const normalized = handle.trim().toLowerCase();
  return (
    isClothingGenderHandle(normalized) || isClothingTypeHandle(normalized)
  );
}

export function isClothingBranchHandle(handle: string) {
  const normalized = handle.trim().toLowerCase();
  return normalized === CLOTHING_ROOT || isClothingNestedHandle(normalized);
}

export function clothingGenderFromHandle(
  handle: string,
): ClothingGender | null {
  const normalized = handle.trim().toLowerCase();
  if (isClothingGenderHandle(normalized)) {
    return normalized as ClothingGender;
  }
  for (const gender of CLOTHING_GENDERS) {
    if (CLOTHING_CHILDREN[gender].includes(normalized)) return gender;
  }
  return null;
}

/** @deprecated Prefer clothingGenderFromHandle */
export function clothingParentFromHandle(handle: string) {
  return clothingGenderFromHandle(handle);
}

/** Prefer a room collection (Kök, Sovrum…) when a product sits in several. */
export function primaryCollection(
  collections: { handle: string; title: string }[],
): { handle: string; title: string } | null {
  const browsable = collections.filter(isBrowsableCollection);
  if (browsable.length === 0) return null;

  const rooms = browsable.filter(isRoomCollection);
  const pool = rooms.length > 0 ? rooms : browsable;

  return (
    [...pool].sort((a, b) => {
      const aKey = roomKeyFromCollection(a);
      const bKey = roomKeyFromCollection(b);
      const aIndex = aKey ? ROOM_ORDER.indexOf(aKey) : ROOM_ORDER.length;
      const bIndex = bKey ? ROOM_ORDER.indexOf(bKey) : ROOM_ORDER.length;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.title.localeCompare(b.title, "sv");
    })[0] ?? null
  );
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

export function clothingTypesFor(
  gender: ClothingGender,
  collections: CollectionSummary[],
): CollectionSummary[] {
  const byHandle = byHandleMap(collections);
  return CLOTHING_CHILDREN[gender]
    .map((handle) => byHandle.get(handle))
    .filter((collection): collection is CollectionSummary =>
      Boolean(collection),
    );
}

/** @deprecated Prefer clothingTypesFor */
export function clothingChildrenFor(
  parent: ClothingGender,
  collections: CollectionSummary[],
) {
  return clothingTypesFor(parent, collections);
}

export function clothingGenders(
  collections: CollectionSummary[],
): CollectionSummary[] {
  const byHandle = byHandleMap(collections);
  return CLOTHING_GENDERS.map((handle) => byHandle.get(handle)).filter(
    (collection): collection is CollectionSummary => Boolean(collection),
  );
}

/**
 * Shop menu: rooms + Kläder (with Dam/Herr → types nested), then other
 * top-level collections. Dam/Herr are never top-level.
 */
export function navGroupsFromCollections(
  collections: CollectionSummary[],
): NavCollectionGroup[] {
  const browsable = collections.filter(isBrowsableCollection);
  const byHandle = byHandleMap(browsable);
  const groups: NavCollectionGroup[] = [];
  const used = new Set<string>();

  const klader = byHandle.get(CLOTHING_ROOT) ?? null;
  const genderGroups: NavCollectionGroup[] = [];

  for (const gender of CLOTHING_GENDERS) {
    const parent = byHandle.get(gender) ?? null;
    const children = clothingTypesFor(gender, browsable);
    if (!parent && children.length === 0) continue;
    if (parent) used.add(parent.handle.toLowerCase());
    for (const child of children) used.add(child.handle.toLowerCase());
    genderGroups.push({ parent, key: gender, children });
  }

  if (klader || genderGroups.length > 0) {
    if (klader) used.add(klader.handle.toLowerCase());
    groups.push({
      parent: klader,
      key: CLOTHING_ROOT,
      children: [],
      nested: genderGroups,
    });
  }

  const remaining = roomsFromCollections(
    browsable.filter(
      (collection) => !used.has(collection.handle.toLowerCase()),
    ),
  ).filter((collection) => !isClothingNestedHandle(collection.handle));

  for (const collection of remaining) {
    groups.push({
      parent: collection,
      key: collection.handle,
      children: [],
    });
  }

  // Rooms first, then Kläder, then the rest — keep room sort among rooms.
  return groups.sort((a, b) => {
    const aRoom = a.parent ? roomKeyFromCollection(a.parent) : null;
    const bRoom = b.parent ? roomKeyFromCollection(b.parent) : null;
    const aIndex = aRoom
      ? ROOM_ORDER.indexOf(aRoom)
      : a.key === CLOTHING_ROOT
        ? ROOM_ORDER.length
        : ROOM_ORDER.length + 1;
    const bIndex = bRoom
      ? ROOM_ORDER.indexOf(bRoom)
      : b.key === CLOTHING_ROOT
        ? ROOM_ORDER.length
        : ROOM_ORDER.length + 1;
    if (aIndex !== bIndex) return aIndex - bIndex;
    const aTitle = a.parent?.title ?? a.key;
    const bTitle = b.parent?.title ?? b.key;
    return aTitle.localeCompare(bTitle, "sv");
  });
}

/** Homepage / top chips: rooms, Kläder, Kontor — never Dam/Herr/types. */
export function topLevelCollections(
  collections: CollectionSummary[],
): CollectionSummary[] {
  return roomsFromCollections(
    collections.filter(
      (collection) =>
        isBrowsableCollection(collection) &&
        !isClothingNestedHandle(collection.handle),
    ),
  );
}

export function shortCollectionLabel(title: string, parentTitle?: string) {
  const trimmed = title.trim();
  let short = trimmed;
  if (parentTitle) {
    const prefix = parentTitle.trim();
    if (trimmed.toLowerCase().startsWith(`${prefix.toLowerCase()} `)) {
      short = trimmed.slice(prefix.length).trim();
    } else {
      short = trimmed.replace(/^(Dam|Herr)\s+/i, "");
    }
  } else {
    short = trimmed.replace(/^(Dam|Herr)\s+/i, "");
  }
  if (!short) return trimmed;
  return short.charAt(0).toLocaleUpperCase("sv") + short.slice(1);
}

export type CatalogCollectionNav = {
  /** Top-level chips/filters (rooms, Kläder, …). */
  primary: CollectionSummary[];
  /** Dam / Herr when browsing the clothing branch. */
  genders: CollectionSummary[];
  /** Type subcats when browsing a gender. */
  types: CollectionSummary[];
  clothingRoot: CollectionSummary | null;
  clothingGender: CollectionSummary | null;
  clothingGenderKey: ClothingGender | null;
  inClothingBranch: boolean;
};

/**
 * Catalog chips/filters:
 * - Top level never lists Dam/Herr
 * - On Kläder or any clothing collection → show Dam/Herr
 * - On Dam/Herr or a type → also show that gender's type chips
 */
export function catalogCollectionNav(
  collections: CollectionSummary[],
  activeHandle?: string | null,
): CatalogCollectionNav {
  const primary = topLevelCollections(collections);
  const byHandle = byHandleMap(collections);
  const clothingRoot = byHandle.get(CLOTHING_ROOT) ?? null;
  const genderKey = activeHandle
    ? clothingGenderFromHandle(activeHandle)
    : null;
  const inClothingBranch = activeHandle
    ? isClothingBranchHandle(activeHandle)
    : false;

  const genders = inClothingBranch ? clothingGenders(collections) : [];
  const clothingGender = genderKey ? (byHandle.get(genderKey) ?? null) : null;
  const types = genderKey ? clothingTypesFor(genderKey, collections) : [];

  return {
    primary,
    genders,
    types,
    clothingRoot,
    clothingGender,
    clothingGenderKey: genderKey,
    inClothingBranch,
  };
}
