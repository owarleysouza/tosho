import type { Product } from '@/types';
import React from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { getSortedCategoryGroups } from '@/utils/categories';

interface ProductListProps {
  products: Product[];
  isCompletedShop: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isCompletedShop,
}) => {
  // RN-12/13/14 — grouped by category in the fixed order, alphabetical
  // within each group.
  const categoryGroups = getSortedCategoryGroups(products);

  return (
    <div className="w-full space-y-4">
      {categoryGroups.map(({ category, items }) => (
        <section key={category}>
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-tosho-700 mb-2">
            {category}
          </h3>

          <section className="space-y-2">
            {items.map((product) => (
              <ProductCard
                key={product.uid}
                currentProduct={product}
                isCompletedShop={isCompletedShop}
              />
            ))}
          </section>
        </section>
      ))}
    </div>
  );
};

export default ProductList;
