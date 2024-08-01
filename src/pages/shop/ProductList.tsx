import type { Product } from '@/types'
import React from 'react'
import ProductCard from './ProductCard'

interface ProductListProps {
  products: Product[]
}
 
const ProductList: React.FC<ProductListProps> = ({products}) => {
  return (
    <div className='h-screen space-y-3'>
      {products.map((product: Product) => <ProductCard key={product.uid} product={product} />)}
    </div>
  )
}

export default ProductList
