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
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
  removeCurrentShopProduct,
  restoreCurrentShopProduct,
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
  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.shop.currentShopPendingProducts
  );
  const currentShopCartProducts = useSelector(
    (state: RootState) => state.shop.currentShopCartProducts
  );

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

  async function toggleProductStatus() {
    const newProductStatus = !currentProduct.isDone;
    try {
      await updateDoc(productRef, { isDone: newProductStatus });

      const changedProduct = { ...currentProduct };
      changedProduct.isDone = newProductStatus;

      newProductStatus === true
        ? dispatch(
            setCurrentShopPendingProducts(
              currentShopPendingProducts.filter(
                (product) => product.uid != changedProduct.uid
              )
            )
          )
        : dispatch(
            setCurrentShopCartProducts(
              currentShopCartProducts.filter(
                (product) => product.uid != changedProduct.uid
              )
            )
          );

      newProductStatus === true
        ? dispatch(
            setCurrentShopCartProducts(
              currentShopCartProducts.concat(changedProduct)
            )
          )
        : dispatch(
            setCurrentShopPendingProducts(
              currentShopPendingProducts.concat(changedProduct)
            )
          );

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: newProductStatus
          ? 'Produto adicionado ao carrinho'
          : 'Produto removido do carrinho',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description:
          'Um erro inesperado aconteceu ao mudar o status do produto',
      });
    }
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
      <Checkbox
        id={currentProduct.uid}
        className="h-7 w-7 shrink-0 rounded-[8px] border-border bg-tosho-50 data-[state=checked]:border-primary"
        checked={isCompletedShop ? true : currentProduct.isDone}
        onCheckedChange={toggleProductStatus}
        disabled={isCompletedShop}
      />

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
