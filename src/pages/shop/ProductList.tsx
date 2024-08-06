import type { Product } from '@/types'
import React, { useEffect, useState } from 'react'
import ProductCard from './ProductCard'

interface ProductListProps {
  products: Product[]
}

interface CategorizedProductsType{
  [key: string]: Product[],
}

interface ProductCategoriesType{
  [key: string]: string,
}
 
const ProductList: React.FC<ProductListProps> = ({products}) => {

  const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProductsType>({})

  //TODO: Change this with all defined categories on product edit 
  const productCategories: ProductCategoriesType = {
    others: "Outros",
    cleaning: "Limpeza",
    hygiene: "Higiene Pessoal",
    fruits: "Frutas",
    bakery: "Padaria"
  }
  
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
          <h3 className='font-bold mb-1'>{productCategories[category]}</h3> 
          
          <section className='space-y-2'>
            {categorizedProducts[category].map((product) => (
              <ProductCard key={product.uid} product={product} />
            ))}
          </section>     
        </section>
      ))} 
    </div>
  )
}

export default ProductList
