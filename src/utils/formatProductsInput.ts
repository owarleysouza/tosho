export const handleProductsInput = (text: string) => {
  const products = [];
  const rows = text.trim().split('\n');

  for (const row of rows) {
    const parts = row.trim().split(',');

    const name = parts[0]?.trim();
    let quantity = 1; // Default value for quantity
    let description = ''; // Default value for description

    // If there's three parts, we assume the second one as quantity and the third as description
    if (parts.length === 3) {
      quantity = parseInt(parts[1]) || 1;
      description = parts[2]?.trim() || '';
      // If there's just two parts, we verify if the second one is a quantity or a description
    } else if (parts.length === 2) {
      //Second one is quantity
      if (!isNaN(Number(parts[1]))) {
        quantity = parseInt(parts[1]);
      } else {
        description = parts[1]?.trim() || '';
      }
    }

    // Name is mandatory
    if (name) {
      products.push({
        name: name,
        quantity: quantity,
        description: description,
        category: 'others',
        isDone: false,
      });
    }
  }

  return products;
}