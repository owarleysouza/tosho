import { Product } from '@/types';
import React from 'react'
import { EllipsisVertical, Wallet } from 'lucide-react';

interface ShopTotalCardProps {
  products: Product[];
   
}

const ShopTotalCard: React.FC<ShopTotalCardProps> = ({products}) => {

  function calculateShopTotal(){
    let total = 0;

    products.forEach(product => {
      total += product.quantity * (product.price ? product.price : 0)
    });

    const shopPrice = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(total)

    return shopPrice
  }

  return (
    <section className='flex flex-row items-center max-w-[316px] justify-between bg-secondary py-5 px-5 rounded-2xl border border-accent gap-2 my-3'>
      <div className='flex flex-row items-center gap-3'>
        <Wallet className='h-9 w-9' />
        <div className='flex flex-col'>
          <span className='text-xs text-slate-400'>Total da compra</span>
          <h1 className='text-2xl text-black font-bold break-all ...'>{calculateShopTotal()}</h1>
        </div>
      </div>
      <div className='flex flex-row items-center gap-3'>
        <EllipsisVertical/>
      </div>
    </section>
  )
}

export default ShopTotalCard
