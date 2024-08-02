import type { Product } from '@/types'
import React from 'react'
import ProductCard from './ProductCard'

interface ProductListProps {
  products: Product[]
}
 
const ProductList: React.FC<ProductListProps> = ({products}) => {

  const productCategories = {
    others: "Outros",
    cleaning: "Limpeza",
    hygiene: "Higiene Pessoal",
    Fruits: "Frutas"
  }

  //TODO: Change this to a dynamic way
  //Product Organization Example
  // const categorizedProducts = 
  //   {
  //     others: [{"Product"}]
  //   }
  
  return (
    <div className='h-screen space-y-3'>
      <h3 className='font-bold'>{productCategories.others}</h3>
      {products.map((product: Product) => <ProductCard key={product.uid} product={product} />)}
    </div>
  )
}

export default ProductList
