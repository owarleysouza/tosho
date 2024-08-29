import type { Product } from '@/types'
import React, { useEffect, useState } from 'react'
import ProductCard from '@/components/shop/ProductCard'
import { productCategories } from '@/utils/productCategories';

interface ProductListProps {
  products: Product[]; 
  isVisualizer: boolean;
}

interface CategorizedProductsType{
  [key: string]: Product[];
}

const ProductList: React.FC<ProductListProps> = ({products, isVisualizer}) => {

  const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProductsType>({})
  
  function categorizeProducts(){
    const groupedProducts = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>)

    setCategorizedProducts(groupedProducts)
  }

  useEffect(() => { 
    categorizeProducts()
  }, [products])
  
  return (
    <div className='space-y-4'>
      {Object.keys(categorizedProducts).map((category) => (
        <section key={category}>
          <h3 className='text-sm font-bold mb-1'>{productCategories[category]}</h3> 
          
          <section className='space-y-2'>
            {categorizedProducts[category].map((product) => (
              <ProductCard 
                key={product.uid}
                currentProduct={product}
                isVisualizer={isVisualizer}
              />
            ))}
          </section>     
        </section>
      ))} 
    </div>
  )
}

export default ProductList