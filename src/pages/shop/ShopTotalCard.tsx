import { Product } from '@/types';
import React, { useState } from 'react'
import { EllipsisVertical, Wallet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DecisionDialog from '@/components/commom/DecisionDialog';

import { formatPrice } from '@/utils/formatters';

interface ShopTotalCardProps {
  products: Product[];
  onCompleteShop?: (shopTotal: number) => void;
  completeShopLoading?: boolean;
  isVisualizer: boolean; 
}

const ShopTotalCard: React.FC<ShopTotalCardProps> = ({products, onCompleteShop, completeShopLoading, isVisualizer}) => {
  const [openMenu, setOpenMenu] = useState(false)

  const [openCompleteShopDialog, setOpenCompleteShopDialog] = useState(false) 

  function calculateShopTotal(){
    let total = 0;

    products.forEach(product => {
      total += product.quantity * (product.price ? product.price : 0)
    });

    return total
  }

  function formatShopTotal(){
    const total = calculateShopTotal()
    const shopPrice = formatPrice(total)

    return shopPrice
  }

  function onOpenCompleteShopDialog(){
    setOpenCompleteShopDialog(true)
    setOpenMenu(false)
  }

  async function completeShop(){
    const shopTotal = calculateShopTotal()
    if(!isVisualizer && onCompleteShop) await onCompleteShop(shopTotal)
    setOpenCompleteShopDialog(false)
  }

  return (
    <section className='flex flex-row items-center max-w-[316px] justify-between bg-secondary py-5 px-5 rounded-2xl border border-accent gap-2 my-3'>
      <div className='flex flex-row items-center gap-3'>
        <Wallet className='h-9 w-9' />
        <div className='flex flex-col'>
          <span className='text-xs text-slate-400'>Total da compra</span>
          <h1 className='text-2xl text-black font-bold break-all ...'>{formatShopTotal()}</h1>
        </div>
      </div>
      {
        !isVisualizer && (
          <div className='flex flex-row items-center gap-3'>
            <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
              <DropdownMenuTrigger asChild>
                <EllipsisVertical className="h-5 w-5 cursor-pointer"/>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  className='cursor-pointer'
                  onClick={onOpenCompleteShopDialog}
                >
                  Concluir compra
                </DropdownMenuItem> 
                <DropdownMenuItem 
                  className='cursor-pointer'
                  onClick={() => {}}
                  disabled
                >
                  Limpar carrinho
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DecisionDialog 
              title='Concluir compra?'
              description='Todos os produtos serão marcados como concluídos, e a compra será movida para compras concluídas.'
              actionLabel='Concluir'
              type='success'
              open={openCompleteShopDialog} 
              setOpen={setOpenCompleteShopDialog}
              loading={completeShopLoading}
              onConfirm={completeShop}
            />
            
          </div>
        )
      }
      
    </section>
  )
}

export default ShopTotalCard
