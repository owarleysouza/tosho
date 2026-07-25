import { normalizeCategory } from '@/utils/categories';

// RN-16 — strictly positional: Nome, Categoria, Quantidade, Descrição.
// Only name is mandatory; trailing fields can be omitted, but a field in
// the middle can't be skipped without also giving the ones after it —
// no content-based guessing, position is all that decides a field's role.
//
// `existingCategories` should be the categories already used elsewhere in
// the purchase — passing them in lets a custom category typed with a
// different case/accent (e.g. "Sao Paulo" after an existing "São Paulo"
// item) resolve to that same spelling instead of starting a new group.
export function handleProductsInput(text: string, existingCategories: string[] = []) {
  const products = [];
  const rows = text.trim().split('\n');
  const knownCategories = [...existingCategories];

  for (const row of rows) {
    const [name, category, quantity, description] = row
      .split(',')
      .map((part) => part.trim());

    // Blank lines and rows missing the mandatory name are ignored silently.
    if (!name) continue;

    // RN-15 — no category typed falls back to "Outros". A category outside
    // the fixed 16 (RN-13) is accepted, normalized for case/accent/
    // whitespace (against the fixed list, legacy keys, and whatever's
    // already in the purchase or earlier in this same paste) so repeat
    // typos don't fragment into new groups.
    const resolvedCategory = normalizeCategory(category || '', knownCategories);
    if (!knownCategories.includes(resolvedCategory)) {
      knownCategories.push(resolvedCategory);
    }

    products.push({
      name,
      quantity: quantity || undefined,
      description: description || undefined,
      category: resolvedCategory,
      isDone: false,
    });
  }

  return products;
}
