export interface VisibilityFilters {
  searchTerm?: string;
  category?: string; // RN-13 — HU-13's category filter
}

// Single entry point for "which items are visible right now". Runs on the
// flat list, before grouping — categories with no matching item simply
// never appear as a group once getSortedCategoryGroups runs on the result.
export function getVisibleItems<T extends { name: string; category: string }>(
  items: T[],
  filters: VisibilityFilters
): T[] {
  let visible = items;

  if (filters.category) {
    visible = visible.filter((item) => item.category === filters.category);
  }

  const term = filters.searchTerm?.trim().toLowerCase();
  if (term) {
    visible = visible.filter((item) => item.name.toLowerCase().includes(term));
  }

  return visible;
}
