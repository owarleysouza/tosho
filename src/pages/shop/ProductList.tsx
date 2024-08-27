import type { Product } from '@/types'
import React, { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { productCategories } from '@/utils/productCategories';

interface ProductListProps {
  products: Product[];
  onProductStatusChange?: (product: Product, status: boolean) => void;
  onRemoveProduct?: (productUid: string, status: boolean) => void;
  onEditProduct?: (product: Product) => void;
  removeProductLoading?: boolean;
  editProductLoading?: boolean;
  isVisualizer: boolean;
}

interface CategorizedProductsType{
  [key: string]: Product[];
}

 
const ProductList: React.FC<ProductListProps> = ({products, onProductStatusChange, onRemoveProduct, removeProductLoading, onEditProduct, editProductLoading, isVisualizer}) => {

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
 
  function editProduct(product: Product){
    if(onEditProduct) onEditProduct(product)
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
                product={product}
                onProductStatusChange={onProductStatusChange} 
                onRemoveProduct={onRemoveProduct}
                removeProductLoading={removeProductLoading}
                onEditProduct={editProduct}
                editProductLoading={editProductLoading}
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
