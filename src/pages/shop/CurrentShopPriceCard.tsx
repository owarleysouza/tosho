import React, { useContext, useState } from 'react';

import { Product } from '@/types';

import CompleteShopDialog from '@/pages/shop/CompleteShopDialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import { UserContext } from '@/context/commom/UserContext';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { completeCurrentShop } from '@/app/shop/shopSlice';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface CurrentShopPriceCardProps {
  products: Product[];
}

const CurrentShopPriceCard: React.FC<CurrentShopPriceCardProps> = ({
  products,
}) => {
  const { user } = useContext(UserContext);

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);
  const dispatch = useDispatch();

  const [openCompleteShopDialog, setOpenCompleteShopDialog] = useState(false);
  const [completeShopLoading, setCompleteShopLoading] = useState(false);

  function calculateShopPrice() {
    let total = 0;

    products.forEach((product) => {
      total += product.quantity * (product.price ? product.price : 0);
    });

    return total;
  }

  async function completeShop(inputShopPrice: number | undefined) {
    try {
      setCompleteShopLoading(true);

      const calculatedShopPrice = calculateShopPrice();

      if (user) {
        const shopRef = doc(db, `users/${user.uid}/shops`, currentShop.uid);

        await updateDoc(shopRef, {
          isDone: true,
          total:
            inputShopPrice && inputShopPrice > 0
              ? inputShopPrice
              : calculatedShopPrice,
        });

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
    <section className="mb-3 flex w-full items-center justify-between gap-3">
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground md:hidden">Quantidade</p>
        <h2 className="hidden text-base font-semibold text-foreground md:block">
          Carrinho
        </h2>
        <p className="text-sm font-semibold text-foreground md:text-xs md:font-normal md:text-muted-foreground">
          {products.length} {products.length === 1 ? 'item' : 'itens'}
        </p>
      </div>

      <Button
        onClick={() => setOpenCompleteShopDialog(true)}
        className="shrink-0 rounded-2xl"
      >
        Concluir compra
      </Button>

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
