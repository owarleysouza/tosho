import React from 'react'

interface Product {
  uid: string,
  name: string, 
  quantity: number, 
  isDone: boolean
}

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
