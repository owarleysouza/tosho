import React, { useState } from 'react'

import { Product } from '@/types'
import { ProductEditFormSchema } from '@/utils/formValidations'
import { z } from 'zod'

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DecisionDialog from '@/components/commom/DecisionDialog'
import ProductEditDialog from '@/pages/shop/ProductEditDialog'

import { EllipsisVertical   } from 'lucide-react'

interface ProductProps{
  product: Product;
  onProductStatusChange: (product: Product, status: boolean) => void;
  onRemoveProduct: (productUid: string, status: boolean) => void;
  onEditProduct: (data: Product) => void;
  removeProductLoading: boolean;
  editProductLoading: boolean;
}

const ProductCard: React.FC<ProductProps> = ({ product, onProductStatusChange, onRemoveProduct, removeProductLoading, onEditProduct, editProductLoading }) =>  {

  const [openRemoveDialog, setOpenRemoveDialog] = useState(false) 
  const [openProductEditDialog, setOpenProductEditDialog] = useState(false) 
  
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

  function onOpenEditDialog(){
    setOpenProductEditDialog(true)
    setOpenMenu(false)
  }
 
  function editProduct(data: z.infer<typeof ProductEditFormSchema>){
    const productToEdit = {
      uid: product.uid,
      isDone: product.isDone,
      ...data
    }
    onEditProduct(productToEdit)
  }

  const formattedPrice = () => {
    if(product.price && product.price > 0){
      const price = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(product.price)
      return price
    }
    return 
  }
   
  return (
    <div className='flex flex-row w-[316px] min-h-[62px] justify-between bg-secondary py-3 px-4 rounded-2xl border border-accent shadow gap-2'>
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
        <span className="text-xs text-black font-bold">{formattedPrice()}</span>
        <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
          <DropdownMenuTrigger asChild>
            <EllipsisVertical className="h-5 w-5 cursor-pointer"/>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              className='cursor-pointer'
              onClick={onOpenEditDialog}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={onOpenRemoveDialog}
            >
              Excluir
            </DropdownMenuItem> 
          </DropdownMenuContent>
        </DropdownMenu>

        <DecisionDialog 
          title='Excluir produto?'
          description='Todos os dados desse produto serão perdidos e esta ação não poderá ser desfeita.'
          actionLabel='Excluir'
          type='danger'
          open={openRemoveDialog} 
          setOpen={setOpenRemoveDialog}
          loading={removeProductLoading}
          onConfirm={removeProduct}
        />

        <ProductEditDialog 
          product={product}
          openProductEditDialog={openProductEditDialog}
          setOpenProductEditDialog={setOpenProductEditDialog}
          onEditProduct={editProduct}
          editProductLoading={editProductLoading}
        />
      </section>
    </div>
  )
}

export default ProductCard
