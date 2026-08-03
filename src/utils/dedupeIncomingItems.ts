import { normalizeCategory } from '@/utils/categories';

// RN-17 — an incoming item with the same name (case-insensitive) and
// category as one that already exists is skipped silently, no error. Used
// by both the purchase (HU-07) and the template (HU-23) free-text flows —
// same rule, same tiebreak, only the destination list differs.
//
// Duplicates *within* the same pasted batch are folded in as they're
// walked, so pasting the same line twice doesn't create two identical
// documents.
function isSameItem(
  a: { name: string; category: string },
  b: { name: string; category: string }
): boolean {
  return (
    a.name.toLowerCase() === b.name.toLowerCase() &&
    normalizeCategory(a.category).toLowerCase() ===
      normalizeCategory(b.category).toLowerCase()
  );
}

export interface DedupeResult<T> {
  newItems: T[];
  duplicateNames: string[];
}

export function dedupeIncomingItems<
  T extends { name: string; category: string },
>(candidates: T[], existingItems: { name: string; category: string }[]): DedupeResult<T> {
  const duplicateNames: string[] = [];

  const newItems = candidates.reduce<T[]>((accepted, candidate) => {
    const isDuplicate =
      existingItems.some((existing) => isSameItem(existing, candidate)) ||
      accepted.some((existing) => isSameItem(existing, candidate));
    if (isDuplicate) duplicateNames.push(candidate.name);
    return isDuplicate ? accepted : accepted.concat(candidate);
  }, []);

  return { newItems, duplicateNames };
}
