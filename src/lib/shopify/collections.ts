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
    "dam-byxor",
    "dam-set",
    "dam-accessoarer",
  ],
  herr: [
    "herr-ytterklader",
    "herr-toppar",
    "herr-stickat",
    "herr-byxor",
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

/** The collection a product page links back to when a product sits in several. */
export function primaryCollection(
  collections: { handle: string; title: string }[],
): { handle: string; title: string } | null {
  return sortByTitle(collections.filter(isBrowsableCollection))[0] ?? null;
}

export function sortByTitle<T extends { title: string }>(collections: T[]): T[] {
  return [...collections].sort((a, b) => a.title.localeCompare(b.title, "sv"));
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

/** Product ids from Dam and Herr, alternating so a short sample includes both. */
export function clothingSampleIds(
  collections: CollectionSummary[],
  limit = 12,
): string[] {
  const lists = clothingGenders(collections).map(
    (collection) => collection.productIds,
  );
  const ids: string[] = [];
  const seen = new Set<string>();

  const push = (id: string | undefined) => {
    if (!id || seen.has(id) || ids.length >= limit) return;
    seen.add(id);
    ids.push(id);
  };

  if (lists.length === 0) {
    for (const collection of collections) {
      if (!isClothingBranchHandle(collection.handle)) continue;
      for (const id of collection.productIds) push(id);
    }
    return ids;
  }

  const maxLen = Math.max(...lists.map((list) => list.length));
  for (let index = 0; index < maxLen; index++) {
    for (const list of lists) push(list[index]);
  }

  return ids;
}

/**
 * Shop menu: Kläder (with Dam/Herr → types nested), then any other
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

  const remaining = sortByTitle(
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

  return groups;
}

export type CollectionTreeNode = {
  collection: CollectionSummary;
  children: CollectionTreeNode[];
};

/** Category filter tree: any collection with children can expand. */
export function collectionFilterTree(
  collections: CollectionSummary[],
): CollectionTreeNode[] {
  return navGroupsToTree(navGroupsFromCollections(collections));
}

/**
 * Handles to open so `handle` is visible. Empty when it is top-level.
 * Null when it is not in the tree.
 */
export function collectionAncestorHandles(
  nodes: CollectionTreeNode[],
  handle: string | null,
): string[] | null {
  if (!handle) return null;
  for (const node of nodes) {
    if (node.collection.handle === handle) return [];
    const nested = collectionAncestorHandles(node.children, handle);
    if (nested) return [node.collection.handle, ...nested];
  }
  return null;
}

function navGroupsToTree(groups: NavCollectionGroup[]): CollectionTreeNode[] {
  const nodes: CollectionTreeNode[] = [];
  for (const group of groups) {
    const children = [
      ...navGroupsToTree(group.nested ?? []),
      ...group.children.map(
        (collection): CollectionTreeNode => ({ collection, children: [] }),
      ),
    ];
    if (group.parent) {
      nodes.push({ collection: group.parent, children });
    } else {
      nodes.push(...children);
    }
  }
  return nodes;
}

/** Top chips: Kläder and any other top-level collection — never Dam/Herr/types. */
export function topLevelCollections(
  collections: CollectionSummary[],
): CollectionSummary[] {
  return sortByTitle(
    collections.filter(
      (collection) =>
        isBrowsableCollection(collection) &&
        !isClothingNestedHandle(collection.handle),
    ),
  );
}

/** "Dam ytterkläder", "Yttertøy dame" and "Naisten takit" all lose the gender. */
function stripGender(title: string) {
  return title
    .replace(/^(Dam|Herr|Naisten|Miesten)\s+/i, "")
    .replace(/\s+(dame|herre)$/i, "");
}

export function shortCollectionLabel(title: string, parentTitle?: string) {
  const trimmed = title.trim();
  let short = trimmed;
  if (parentTitle) {
    const prefix = parentTitle.trim();
    if (trimmed.toLowerCase().startsWith(`${prefix.toLowerCase()} `)) {
      short = trimmed.slice(prefix.length).trim();
    } else {
      short = stripGender(trimmed);
    }
  } else {
    short = stripGender(trimmed);
  }
  if (!short) return trimmed;
  return short.charAt(0).toLocaleUpperCase("sv") + short.slice(1);
}

export type CatalogCollectionNav = {
  /** Top-level chips/filters (Kläder, …). */
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
