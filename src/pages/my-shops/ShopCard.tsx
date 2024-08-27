import React, { useState } from 'react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { EllipsisVertical, ShoppingBasket } from 'lucide-react'

import { DocumentData } from 'firebase/firestore';

import { formatDate, formatPrice } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

interface MyShopsProps {
  shop: DocumentData; //TODO: Change this type to a Shop type
}

const ShopCard: React.FC<MyShopsProps> = ({shop}) => {
  const [openMenu, setOpenMenu] = useState(false)

  const navigate = useNavigate()

  function goToShopDetail(){
    navigate(`/complete-shops/${shop.uid}`, { state: { shop: shop } }) 
  }
  
  return (
    <div 
      className='cursor-pointer flex flex-row w-[316px] min-h-[62px] justify-between bg-secondary py-3 px-4 rounded-2xl border border-accent shadow gap-2'
      onClick={goToShopDetail}
    >
      <section className='flex flex-row items-center gap-2'>
        <ShoppingBasket />
        <div className='flex flex-col'>
          <span 
            className="text-xs text-black font-semibold break-all ..."
          >
            {shop.name}
          </span>
          <span className="text-xs text-slate-400 break-all ...">{formatDate(shop.date?.seconds)}</span>
        </div>
      </section>

      <section className='flex flex-row items-center gap-1.5'>
        <span className="text-xs text-black font-bold">{formatPrice(shop.total)}</span>
        <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
          <DropdownMenuTrigger asChild>
            <EllipsisVertical className="h-5 w-5 cursor-pointer"/>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={() => {}}
              disabled
            >
              Excluir
            </DropdownMenuItem> 
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
    </div>
  )
}

export default ShopCard
