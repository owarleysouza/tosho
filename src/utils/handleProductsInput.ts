import { normalizeCategory } from '@/utils/categories';

// RN-16 — strictly positional: Nome, Categoria, Quantidade, Descrição.
// Only name is mandatory; trailing fields can be omitted, but a field in
// the middle can't be skipped without also giving the ones after it —
// no content-based guessing, position is all that decides a field's role.
export function handleProductsInput(text: string) {
  const products = [];
  const rows = text.trim().split('\n');

  for (const row of rows) {
    const [name, category, quantity, description] = row
      .split(',')
      .map((part) => part.trim());

    // Blank lines and rows missing the mandatory name are ignored silently.
    if (!name) continue;

    products.push({
      name,
      quantity: quantity || undefined,
      description: description || undefined,
      // RN-15 — no category typed falls back to "Outros". A category
      // outside the fixed 16 (RN-13) is accepted, normalized for
      // case/whitespace so repeat typos don't fragment into new groups.
      category: normalizeCategory(category || ''),
      isDone: false,
    });
  }

  return products;
}
