import { useContext, useState } from 'react';

import CompleteShopDialog from '@/pages/shop/CompleteShopDialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import { UserContext } from '@/context/commom/UserContext';

import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

import { db } from '@/lib/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface CompleteShopBarProps {
  cartItemCount: number;
  pendingItemCount: number;
  onCompleted: () => void;
}

// RN-25 — always rendered (not gated on the cart having items): mobile pins
// this above the bottom nav on the Carrinho tab, desktop sits static at the
// top of the right column (print 07/08).
const CompleteShopBar: React.FC<CompleteShopBarProps> = ({
  cartItemCount,
  pendingItemCount,
  onCompleted,
}) => {
  const { user } = useContext(UserContext);
  const currentShop = useSelector((state: RootState) => state.shop.currentShop);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // RN-07/RN-10 — completion is just isDone: true + an immutable
  // completedAt, nothing else. Which purchase becomes active next is never
  // written here — onCompleted() re-derives it via getActivePurchase.
  async function completeShop() {
    try {
      setLoading(true);
      if (!user) return;

      await updateDoc(doc(db, `users/${user.uid}/shops`, currentShop.uid), {
        isDone: true,
        completedAt: serverTimestamp(),
      });

      setOpen(false);
      onCompleted();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao concluir a compra',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background px-5 py-3 md:static md:inset-auto md:bottom-auto md:z-auto md:mb-3 md:flex md:w-full md:items-center md:justify-between md:border-t-0 md:bg-transparent md:p-0">
      <div className="hidden md:block">
        <h2 className="text-base font-semibold text-foreground">Carrinho</h2>
        <p className="text-xs text-muted-foreground">
          {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}
        </p>
      </div>

      <Button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl md:w-auto"
      >
        Concluir compra
      </Button>

      <CompleteShopDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={completeShop}
        loading={loading}
        pendingCount={pendingItemCount}
      />
    </div>
  );
};

export default CompleteShopBar;
