export interface VisibilityFilters {
  searchTerm?: string;
  // HU-13 will add `category` here — chained onto the same filtered list,
  // so "search within a filtered category" composes without rewriting this.
}

// Single entry point for "which items are visible right now". Runs on the
// flat list, before grouping — categories with no matching item simply
// never appear as a group once getSortedCategoryGroups runs on the result.
export function getVisibleItems<T extends { name: string }>(
  items: T[],
  filters: VisibilityFilters
): T[] {
  let visible = items;

  const term = filters.searchTerm?.trim().toLowerCase();
  if (term) {
    visible = visible.filter((item) => item.name.toLowerCase().includes(term));
  }

  return visible;
}
