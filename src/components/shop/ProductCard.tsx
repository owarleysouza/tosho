import React, { useContext, useState } from 'react';

import { Product } from '@/types';

import { Checkbox } from '@/components/ui/checkbox';
import ProductEditDialog from '@/components/shop/ProductEditDialog';
import { toast } from '@/components/ui/use-toast';
import { Check, Pencil, Trash2 } from 'lucide-react';

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

  // Metadata (quantity + description) is unified into a single line,
  // separated by " · " — with only one of the two present, no separator.
  const metadata = [currentProduct.quantity, currentProduct.description]
    .filter(Boolean)
    .join(' · ');

  return (
    // items-stretch (not items-center) — the checkbox strip stretches to
    // the card's full height. Bg stays white regardless of isDone: the
    // card itself never changes color, only the checkbox/name/metadata do.
    <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-border bg-card">
      {/* Checkbox strip — a dedicated, full-height tap target (RN-09/
          RN-18), not just the 26px visual box. The whole strip is a
          <label> pointing at the checkbox, so a tap anywhere in it
          toggles the item, same mechanism the name text used to rely on
          alone. HU-17 — read-only mode renders a plain static indicator
          instead: no interactive control in the tree at all. A completed
          purchase can still have unmarked items (HU-14 allows completing
          with pending ones), so this reflects the item's real isDone
          instead of forcing it to look checked. */}
      {isCompletedShop ? (
        <div className="flex w-[52px] shrink-0 items-center justify-center border-r border-border bg-muted md:w-[54px]">
          <div
            className={cn(
              'flex h-[26px] w-[26px] items-center justify-center rounded-md border',
              currentProduct.isDone
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-[1.5px] border-tosho-500 bg-secondary'
            )}
          >
            {currentProduct.isDone && <Check className="h-[15px] w-[15px]" />}
          </div>
        </div>
      ) : (
        <label
          htmlFor={currentProduct.uid}
          className="flex w-[52px] shrink-0 cursor-pointer items-center justify-center border-r border-border bg-muted md:w-[54px]"
        >
          <Checkbox
            id={currentProduct.uid}
            aria-label={currentProduct.name}
            className="h-[26px] w-[26px] shrink-0 rounded-md border-[1.5px] border-tosho-500 bg-secondary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            checked={currentProduct.isDone}
            onCheckedChange={toggleProductStatus}
          />
        </label>
      )}

      <div className="min-w-0 flex-1 px-[13px] py-[11px] md:px-3.5 md:py-3">
        <p
          className={cn(
            'truncate text-sm font-medium text-foreground',
            currentProduct.isDone && 'text-tosho-500 line-through'
          )}
        >
          {currentProduct.name}
        </p>
        {metadata && (
          <p
            className={cn(
              'text-xs text-tosho-text-3',
              currentProduct.isDone && 'text-tosho-500'
            )}
          >
            {metadata}
          </p>
        )}
      </div>

      {!isCompletedShop && (
        <div className="flex shrink-0 items-center gap-3.5 px-3.5 md:gap-4 md:px-4">
          <button
            type="button"
            aria-label="Editar item"
            onClick={() => setOpenEditDialog(true)}
            className="text-tosho-500"
          >
            <Pencil className="h-[17px] w-[17px]" />
          </button>
          <button
            type="button"
            aria-label="Excluir item"
            onClick={() => removeProductWithUndo(currentProduct)}
            className="text-tosho-500"
          >
            <Trash2 className="h-[17px] w-[17px]" />
          </button>
        </div>
      )}

      {!isCompletedShop && (
        <ProductEditDialog
          product={currentProduct}
          open={openEditDialog}
          onOpenChange={setOpenEditDialog}
        />
      )}
    </div>
  );
};

export default ProductCard;
