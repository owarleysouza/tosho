import React, { useContext, useState } from 'react';

import { Product } from '@/types';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DecisionDialog from '@/components/commom/DecisionDialog';
import { toast } from '@/components/ui/use-toast';
import { EllipsisVertical, Wallet } from 'lucide-react';

import { formatPrice } from '@/utils/formatters';

import { UserContext } from '@/context/commom/UserContext';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { completeCurrentShop } from '@/app/shop/shopSlice';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ShopTotalCardProps {
  products: Product[];
  isVisualizer: boolean;
}

const ShopTotalCard: React.FC<ShopTotalCardProps> = ({
  products,
  isVisualizer,
}) => {
  const { user } = useContext(UserContext);

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);
  const dispatch = useDispatch();

  const [openMenu, setOpenMenu] = useState(false);

  const [openCompleteShopDialog, setOpenCompleteShopDialog] = useState(false);
  const [completeShopLoading, setCompleteShopLoading] = useState(false);

  function onOpenCompleteShopDialog() {
    setOpenCompleteShopDialog(true);
    setOpenMenu(false);
  }

  function calculateShopTotal() {
    let total = 0;

    products.forEach((product) => {
      total += product.quantity * (product.price ? product.price : 0);
    });

    return total;
  }

  function formatShopTotal() {
    const total = calculateShopTotal();
    const shopPrice = formatPrice(total);

    return shopPrice;
  }

  async function completeShop() {
    try {
      setCompleteShopLoading(true);

      const shopTotal = calculateShopTotal();

      if (user) {
        const shopRef = doc(db, `users/${user.uid}/shops`, currentShop.uid);

        await updateDoc(shopRef, { isDone: true, total: shopTotal });

        dispatch(completeCurrentShop());

        toast({
          variant: 'success',
          title: 'Sucesso!',
          description: 'Compra concluída com sucesso',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao concluir a compra',
      });
    } finally {
      setCompleteShopLoading(false);
    }
  }

  return (
    <section className="flex flex-row items-center max-w-[316px] justify-between bg-secondary py-5 px-5 rounded-2xl border border-accent gap-2 my-3">
      <div className="flex flex-row items-center gap-3">
        <Wallet className="h-9 w-9" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Total da compra</span>
          <h1 className="text-2xl text-black font-bold break-all ...">
            {formatShopTotal()}
          </h1>
        </div>
      </div>
      {!isVisualizer && (
        <div className="flex flex-row items-center gap-3">
          <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
            <DropdownMenuTrigger asChild>
              <EllipsisVertical className="h-5 w-5 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onOpenCompleteShopDialog}
              >
                Concluir compra
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {}}
                disabled
              >
                Limpar carrinho
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DecisionDialog
            title="Concluir compra?"
            description="Todos os produtos serão marcados como concluídos, e a compra será movida para compras concluídas."
            actionLabel="Concluir"
            type="success"
            open={openCompleteShopDialog}
            setOpen={setOpenCompleteShopDialog}
            loading={completeShopLoading}
            onConfirm={completeShop}
          />
        </div>
      )}
    </section>
  );
};

export default ShopTotalCard;
