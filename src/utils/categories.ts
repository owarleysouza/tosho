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

function normalizeCategory(category: string): string {
  return LEGACY_CATEGORY_MAP[category] ?? category;
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
export function groupByCategory<T extends { category: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const category = normalizeCategory(item.category || DEFAULT_CATEGORY);
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
