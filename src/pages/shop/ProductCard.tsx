import { Product } from '@/types'
import React from 'react'

import { Checkbox } from "@/components/ui/checkbox"

interface ProductProps{
  product: Product;
  onProductStatusChange: (product: Product, status: boolean) => void;
}

const ProductCard: React.FC<ProductProps> = ({ product, onProductStatusChange }) =>  {

  function handleCheckboxChange(){
    onProductStatusChange(product, !product.isDone)
  }
   
  return (
    <div className='flex flex-row w-[316px] min-h-[62px] justify-between bg-secondary py-3 px-4 rounded-2xl border border-accent shadow'>
      <section className='flex flex-row items-center gap-2'>
        <Checkbox 
          id={product.uid}
          className='rounded-md h-5 w-5'
          checked={product.isDone}
          onCheckedChange={handleCheckboxChange}
        />
        <div className='flex flex-col'>
          <label
            htmlFor={product.uid}
            className="cursor-pointer text-xs text-black font-semibold break-all ..."
          >
            {product.name}
          </label>
          <span className="text-xs text-slate-400 break-all ...">{product.description}</span>
        </div>
        
      </section>
      <section className='flex flex-row items-center gap-1.5'>
        <span className="text-xs text-black font-bold">{product.quantity}X</span>
        <span className="text-xs text-black font-bold">{product.price}</span>
      </section>
    </div>
  )
}

export default ProductCard
