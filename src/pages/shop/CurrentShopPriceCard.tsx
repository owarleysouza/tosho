import React, { useContext, useEffect, useState } from 'react';

import { Product } from '@/types';

import CompleteShopDialog from '@/pages/shop/CompleteShopDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { EllipsisVertical, Wallet } from 'lucide-react';

import { formatPrice } from '@/utils/formatPrice';

import { UserContext } from '@/context/commom/UserContext';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { completeCurrentShop } from '@/app/shop/shopSlice';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface CurrentShopPriceCardProps {
  cartProducts: Product[];
  pendingProducts: Product[];
  getCurrentShop: () => void;
}

const CurrentShopPriceCard: React.FC<CurrentShopPriceCardProps> = ({
  cartProducts,
  pendingProducts,
  getCurrentShop,
}) => {
  const navigate = useNavigate();

  const { user } = useContext(UserContext);

  const currentShop = useSelector(
    (state: RootState) => state.store.currentShop
  );
  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.store.currentShopPendingProducts
  );
  const currentShopCartProducts = useSelector(
    (state: RootState) => state.store.currentShopCartProducts
  );
  const dispatch = useDispatch();

  const [openMenu, setOpenMenu] = useState(false);

  const [openCompleteShopDialog, setOpenCompleteShopDialog] = useState(false);
  const [completeShopLoading, setCompleteShopLoading] = useState(false);
  const [currentShopProgress, setCurrentShopProgress] = useState(0);

  function onOpenCompleteShopDialog() {
    setOpenCompleteShopDialog(true);
    setOpenMenu(false);
  }

  function calculateShopPrice() {
    let total = 0;

    cartProducts.forEach((product) => {
      total += product.quantity * (product.price ? product.price : 0);
    });

    return total;
  }

  function formatShopPrice() {
    const total = calculateShopPrice();
    const shopPrice = formatPrice(total);

    return shopPrice;
  }

  async function completeShop(inputShopPrice: number | undefined) {
    try {
      setCompleteShopLoading(true);

      const calculatedShopPrice = calculateShopPrice();
      // console.log('user', user.uid);
      // console.log('currentShop', currentShop.uid);
      if (user) {
        const shopRef = doc(db, `users/${user.uid}/shops`, currentShop.uid);
        console.log('shopRef', shopRef);
        await updateDoc(shopRef, {
          isDone: true,
          total:
            inputShopPrice && inputShopPrice > 0
              ? inputShopPrice
              : calculatedShopPrice,
        });

        dispatch(completeCurrentShop());

        getCurrentShop();

        toast({
          variant: 'success',
          title: 'Sucesso!',
          description: 'Compra concluída com sucesso',
        });
        navigate('/next-shops');
      }
    } catch (error) {
      console.log('error', error);
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceuuu',
        description: 'Um erro inesperado aconteceu ao concluir a compra',
      });
    } finally {
      setCompleteShopLoading(false);
    }
  }

  function calculateCurrentShopProgress() {
    const totalProductsCart = cartProducts.length;
    const totalProductsShop = pendingProducts.length + cartProducts.length;
    console.log(
      'currentShopCartProducts',
      currentShopCartProducts,
      'currentShopPendingProducts',
      currentShopPendingProducts
    );
    const shopProgress = (totalProductsCart / totalProductsShop) * 100;
    console.log('shopProgress', totalProductsCart, totalProductsShop);
    setCurrentShopProgress(Math.round(shopProgress));
  }

  useEffect(() => {
    calculateCurrentShopProgress();
  }, [cartProducts, pendingProducts]);

  return (
    <section className="max-w-[316px] bg-secondary py-5 px-5 rounded-2xl border border-accent my-3">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          <Wallet className="h-9 w-9" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Total da compra</span>
            <h1 className="text-2xl text-black font-bold break-all ...">
              {formatShopPrice()}
            </h1>
          </div>
        </div>

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
      </div>

      <div className="flex flex-col items-center mt-1.5">
        <div className="w-full flex flex-row items-center justify-between">
          <span className="text-xs text-[10px] text-slate-500">
            Progresso da compra
          </span>
          <span className="text-[10px] text-slate-500">
            {currentShopProgress}%
          </span>
        </div>
        <Progress value={currentShopProgress} className="h-2 bg-slate-200" />
      </div>

      <CompleteShopDialog
        title="Concluir compra?"
        description="Todos os produtos serão marcados como concluídos, e a compra será movida para compras concluídas."
        actionLabel="Concluir"
        type="success"
        open={openCompleteShopDialog}
        setOpen={setOpenCompleteShopDialog}
        loading={completeShopLoading}
        onConfirm={completeShop}
      />
    </section>
  );
};

export default CurrentShopPriceCard;
