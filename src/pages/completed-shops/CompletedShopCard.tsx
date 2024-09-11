import React, { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DecisionDialog from '@/components/commom/DecisionDialog';

import { EllipsisVertical, ShoppingBasket } from 'lucide-react';

import { DocumentData } from 'firebase/firestore';

import { formatDate } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';
import { useNavigate } from 'react-router-dom';

interface MyShopsProps {
  shop: DocumentData; //TODO: Change this type to a Shop type
  onRemoveShop: (shopId: string) => void;
  removeShopLoading: boolean;
}

const ShopCard: React.FC<MyShopsProps> = ({
  shop,
  onRemoveShop,
  removeShopLoading,
}) => {
  const [openMenu, setOpenMenu] = useState(false);

  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);

  const navigate = useNavigate();

  function goToShopDetail() {
    navigate(`/complete-shops/${shop.uid}`, { state: { shop: shop } });
  }

  function onOpenRemoveDialog() {
    setOpenRemoveDialog(true);
    setOpenMenu(false);
  }

  function removeShop() {
    onRemoveShop(shop.uid);
  }

  return (
    <div className="flex flex-row w-[316px] min-h-[62px] justify-between bg-secondary py-3 px-4 rounded-2xl border border-accent shadow gap-2">
      <section
        className="cursor-pointer flex flex-row items-center gap-2"
        onClick={goToShopDetail}
      >
        <ShoppingBasket />
        <div className="flex flex-col">
          <span className="text-xs text-black font-semibold break-all ...">
            {shop.name}
          </span>
          <span className="text-xs text-slate-400 break-all ...">
            {formatDate(shop.date?.seconds)}
          </span>
        </div>
      </section>

      <section className="flex flex-row items-center gap-1.5">
        <span className="text-xs text-black font-bold">
          {formatPrice(shop.total)}
        </span>
        <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
          <DropdownMenuTrigger asChild>
            <EllipsisVertical className="h-5 w-5 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onOpenRemoveDialog}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <DecisionDialog
        title="Excluir compra?"
        description="Todos os dados dessa compra serão perdidos e esta ação não poderá ser desfeita."
        actionLabel="Excluir"
        type="danger"
        open={openRemoveDialog}
        setOpen={setOpenRemoveDialog}
        loading={removeShopLoading}
        onConfirm={removeShop}
      />
    </div>
  );
};

export default ShopCard;
