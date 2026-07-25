// RN-13 — fixed category order, mirroring supermarket aisle navigation.
// This is the display value itself (not an internal key translated later) —
// the target free-text format (RN-16, HU-07) has the user type the category
// name directly, so there's no key/label indirection to maintain.
export const FIXED_CATEGORIES = [
  'Hortifruti',
  'Padaria',
  'Laticínios',
  'Carnes e Aves',
  'Peixes e Frutos do Mar',
  'Frios e Embutidos',
  'Mercearia',
  'Massas e Cereais',
  'Enlatados e Conservas',
  'Bebidas',
  'Congelados',
  'Limpeza',
  'Higiene e Beleza',
  'Bebê',
  'Pet',
  'Outros',
] as const;

// RN-15 — items without a category fall back to this.
export const DEFAULT_CATEGORY: (typeof FIXED_CATEGORIES)[number] = 'Outros';

// Pre-HU-06 data used free-form English keys (catalog + old free-text
// default). Translated here instead of migrated in Firestore, so old items
// land in the correct fixed category instead of an "unknown" English-named
// group — no data rewrite needed.
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  grocery: 'Mercearia',
  dairy: 'Laticínios',
  hortifruti: 'Hortifruti',
  bakery: 'Padaria',
  beverages: 'Bebidas',
  cleaning: 'Limpeza',
  frozen: 'Congelados',
  hygiene: 'Higiene e Beleza',
  baby: 'Bebê',
  pet: 'Pet',
  proteins: 'Carnes e Aves',
  home: 'Outros',
  electronics: 'Outros',
  condiment: 'Mercearia',
  others: 'Outros',
};

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Strips accents/diacritics for comparison only ("Laticínios" ~ "Laticinios")
// — never used for the displayed value, just to decide if two spellings
// mean the same category.
function foldForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Case/accent/whitespace-insensitive so "fruta", "Fruta", "FRUTA" and (for
// the fixed 16) "Laticinios" vs "Laticínios" all collapse into the same
// group instead of fragmenting — exported so handleProductsInput can
// normalize at write time too (keeps RN-17's duplicate check correct, not
// just how things group on screen).
//
// `knownCategories` extends this same folding to CUSTOM categories (not in
// the fixed 16): pass in the categories already used elsewhere in the
// purchase, and a fold-equal match reuses that exact spelling instead of
// title-casing a new one — so "Sao Paulo" typed after an existing "São
// Paulo" item collapses into the same group. Whichever spelling was used
// FIRST becomes canonical; there's no way to know which one is "more
// correct" without a dictionary, so first-write-wins is the tiebreak.
export function normalizeCategory(
  category: string,
  knownCategories: string[] = []
): string {
  const trimmed = category.trim();
  if (!trimmed) return DEFAULT_CATEGORY;

  const folded = foldForComparison(trimmed);

  const legacyMatch = LEGACY_CATEGORY_MAP[folded];
  if (legacyMatch) return legacyMatch;

  const fixedMatch = FIXED_CATEGORIES.find(
    (fixed) => foldForComparison(fixed) === folded
  );
  if (fixedMatch) return fixedMatch;

  const knownMatch = knownCategories.find(
    (known) => foldForComparison(known) === folded
  );
  if (knownMatch) return knownMatch;

  return toTitleCase(trimmed);
}

const OUTROS_RANK = FIXED_CATEGORIES.length - 1;

// Known categories keep their fixed position. Anything else (e.g. legacy
// free-form values) ranks just before "Outros", tied categories broken
// alphabetically so multiple unknowns don't collide.
function rankOf(category: string): number {
  const index = FIXED_CATEGORIES.indexOf(category as (typeof FIXED_CATEGORIES)[number]);
  return index === -1 ? OUTROS_RANK - 0.5 : index;
}

export function sortCategoryNames(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const diff = rankOf(a) - rankOf(b);
    if (diff !== 0) return diff;
    return a.localeCompare(b, 'pt-BR');
  });
}

// RN-14 — alphabetical order within a category.
export function sortItemsByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

// RN-12 — items are always grouped by category, never organized manually.
// Threads resolved categories across items so two custom-category spellings
// that only differ by case/accent (e.g. pre-existing Firestore data typed
// before this normalization existed) still land in the same group.
export function groupByCategory<T extends { category: string }>(
  items: T[]
): Record<string, T[]> {
  const resolvedCategories: string[] = [];

  return items.reduce((acc, item) => {
    const category = normalizeCategory(
      item.category || DEFAULT_CATEGORY,
      resolvedCategories
    );
    if (!resolvedCategories.includes(category)) resolvedCategories.push(category);
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export interface CategoryGroup<T> {
  category: string;
  items: T[];
}

// RN-12/13/14 combined — the single entry point screens should use to go
// from a flat item list to what's actually rendered.
export function getSortedCategoryGroups<T extends { category: string; name: string }>(
  items: T[]
): CategoryGroup<T>[] {
  const grouped = groupByCategory(items);

  return sortCategoryNames(Object.keys(grouped)).map((category) => ({
    category,
    items: sortItemsByName(grouped[category]),
  }));
}
