import React from 'react'

interface Product {
  uid: string,
  name: string, 
  quantity: number, 
  isDone: boolean
}

const ProductList = ({products}: {products: Product[]}) => {
  return (
    <div>
      {products.map((product: Product) => <p key={product.uid}>{product.name}</p>)}
    </div>
  )
}

export default ProductList
