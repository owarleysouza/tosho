import React, { useState } from 'react'

import { Product } from '@/types'

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DecisionDialog from '@/components/commom/DecisionDialog'

import { EllipsisVertical   } from 'lucide-react'

interface ProductProps{
  product: Product;
  onProductStatusChange: (product: Product, status: boolean) => void;
  onRemoveProduct: (productUid: string, status: boolean) => void;
  removeProductLoading: boolean;
}

const ProductCard: React.FC<ProductProps> = ({ product, onProductStatusChange, onRemoveProduct, removeProductLoading }) =>  {

  const [openRemoveDialog, setOpenRemoveDialog] = useState(false) 
  const [openMenu, setOpenMenu] = useState(false)
  
  function handleCheckboxChange(){
    onProductStatusChange(product, !product.isDone)
  }

  function removeProduct(){
    onRemoveProduct(product.uid, product.isDone)
  }

  function onOpenRemoveDialog(){
    setOpenRemoveDialog(true)
    setOpenMenu(false)
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
        <span className="text-xs text-black font-bold">{product.quantity}x</span>
        <span className="text-xs text-black font-bold">{product.price}</span>
        <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
          <DropdownMenuTrigger asChild>
            <EllipsisVertical className="h-5 w-5 cursor-pointer"/>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Editar</DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={onOpenRemoveDialog}
            >
              Remover
            </DropdownMenuItem> 
          </DropdownMenuContent>
        </DropdownMenu>

        <DecisionDialog 
          title='Remover produto?'
          description='Todos os dados desse produto serão perdidos e esta ação não poderá ser desfeita.'
          actionLabel='Remover'
          open={openRemoveDialog} 
          setOpen={setOpenRemoveDialog}
          loading={removeProductLoading}
          onConfirm={removeProduct}
        />
        
      </section>

    
    </div>
  )
}

export default ProductCard
