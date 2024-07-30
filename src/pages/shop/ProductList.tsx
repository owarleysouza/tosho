import { Product } from '@/types'
import React from 'react'

interface ProductListProps {
  products: Product[]
}
 
const ProductList: React.FC<ProductListProps> = ({products}) => {
  return (
    <div>
      {products.map((product: Product) => <p key={product.uid}>{product.name}</p>)}
    </div>
  )
}

export default ProductList
