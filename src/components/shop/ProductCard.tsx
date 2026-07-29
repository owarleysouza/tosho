import React, { useContext, useState } from 'react';

import { Product } from '@/types';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProductEditDialog from '@/components/shop/ProductEditDialog';
import { toast } from '@/components/ui/use-toast';
import { EllipsisVertical } from 'lucide-react';

import { doc, increment, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { UserContext } from '@/context/commom/UserContext';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  removeCurrentShopProduct,
  restoreCurrentShopProduct,
  toggleCurrentShopProductStatus,
} from '@/app/shop/shopSlice';
import { cn } from '@/lib/utils';

interface ProductProps {
  currentProduct: Product;
  isCompletedShop: boolean;
}

const ProductCard: React.FC<ProductProps> = ({
  currentProduct,
  isCompletedShop,
}) => {
  const { user } = useContext(UserContext);

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);

  const dispatch = useDispatch();

  const [openMenu, setOpenMenu] = useState(false);

  //Firestore Reference
  const productRef = doc(
    db,
    `users/${user?.uid}/shops/${currentShop.uid}/products`,
    currentProduct.uid
  );
  const shopDocRef = doc(db, `users/${user?.uid}/shops`, currentShop.uid);

  //Edit Product
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // RN-09/RN-18 — optimistic: flip locally first so the tap feels instant
  // even on bad store wifi, persist to Firestore in the background, and
  // only surface an error (with rollback to the previous status) if the
  // write actually fails.
  function toggleProductStatus() {
    const newProductStatus = !currentProduct.isDone;

    dispatch(
      toggleCurrentShopProductStatus({
        uid: currentProduct.uid,
        isDone: newProductStatus,
      })
    );

    updateDoc(productRef, { isDone: newProductStatus }).catch(() => {
      dispatch(
        toggleCurrentShopProductStatus({
          uid: currentProduct.uid,
          isDone: !newProductStatus,
        })
      );
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description:
          'Um erro inesperado aconteceu ao mudar o status do produto',
      });
    });
  }

  // RN-24 — remove immediately, no confirmation modal (that pattern is
  // RN-25, for entities like purchases/templates, not individual items).
  // The 5s undo window + delayed Firestore commit is handled generically by
  // useUndoableDelete (HU-26 reuses the same hook for template items).
  const { remove: removeProductWithUndo } = useUndoableDelete<Product>({
    onRemoveLocally: (product) => {
      dispatch(
        removeCurrentShopProduct({ uid: product.uid, isDone: product.isDone })
      );
    },
    onRestoreLocally: (product) => {
      dispatch(restoreCurrentShopProduct(product));
    },
    onCommit: async (product) => {
      try {
        // Deletes the product and decrements the shop's itemsCount counter
        // atomically, so PurchasesPage never needs a per-card products query.
        const batch = writeBatch(db);
        batch.delete(
          doc(
            db,
            `users/${user?.uid}/shops/${currentShop.uid}/products`,
            product.uid
          )
        );
        batch.update(shopDocRef, { itemsCount: increment(-1) });
        await batch.commit();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo de errado aconteceu',
          description: 'Um erro inesperado aconteceu ao excluir o produto',
        });
      }
    },
  });


  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5',
        currentProduct.isDone && 'bg-tosho-25'
      )}
    >
      {/* 44px hit area around the 28px visual checkbox — the visual itself
          stays spec-sized, but the tap target meets the thumb minimum. */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        <Checkbox
          id={currentProduct.uid}
          className="h-7 w-7 shrink-0 rounded-lg border-border bg-tosho-50 data-[state=checked]:border-primary"
          checked={isCompletedShop ? true : currentProduct.isDone}
          onCheckedChange={toggleProductStatus}
          disabled={isCompletedShop}
        />
      </div>

      <div className="min-w-0 flex-1">
        <label
          htmlFor={currentProduct.uid}
          className={cn(
            'block cursor-pointer truncate text-sm font-bold text-foreground',
            currentProduct.isDone && 'text-tosho-500 line-through'
          )}
        >
          {currentProduct.name}
        </label>
        {currentProduct.quantity && (
          <p
            className={cn(
              'text-xs font-medium text-primary',
              currentProduct.isDone && 'text-tosho-500 line-through'
            )}
          >
            {currentProduct.quantity}
          </p>
        )}
        {currentProduct.description && (
          <p className="truncate text-xs text-muted-foreground">
            {currentProduct.description}
          </p>
        )}
      </div>

      {!isCompletedShop && (
        <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
          <DropdownMenuTrigger asChild>
            <EllipsisVertical className="h-[17px] w-[17px] shrink-0 cursor-pointer text-tosho-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                // Let the dropdown close on its own default behavior first —
                // opening the edit dialog in the same tick fights it for
                // focus and leaves the dropdown stuck (same bug hit in the
                // purchases manager's Editar/Excluir menu).
                setTimeout(() => setOpenEditDialog(true), 0);
              }}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setOpenMenu(false);
                removeProductWithUndo(currentProduct);
              }}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ProductEditDialog
        product={currentProduct}
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
      />
    </div>
  );
};

export default ProductCard;
