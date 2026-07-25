import React, { useContext, useState } from 'react';

import { Product } from '@/types';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DecisionDialog from '@/components/commom/DecisionDialog';
import ProductEditDialog from '@/components/shop/ProductEditDialog';
import { toast } from '@/components/ui/use-toast';
import { EllipsisVertical } from 'lucide-react';

import { doc, increment, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { UserContext } from '@/context/commom/UserContext';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
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

  //Remove Product
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [removeProductLoading, setRemoveProductLoading] = useState(false);

  //Edit Product
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // An item checked into the cart of an active (not read-only) purchase gets
  // the undo-only treatment from the print — checking it off is still done
  // via the same checkbox/toggle, editing/deleting isn't offered there.
  const isInCart = currentProduct.isDone && !isCompletedShop;

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

  function onOpenRemoveDialog() {
    setOpenRemoveDialog(true);
    setOpenMenu(false);
  }

  async function removeProduct() {
    try {
      setRemoveProductLoading(true);

      // Deletes the product and decrements the shop's itemsCount counter
      // atomically, so PurchasesPage never needs a per-card products query.
      const batch = writeBatch(db);
      batch.delete(productRef);
      batch.update(shopDocRef, { itemsCount: increment(-1) });
      await batch.commit();

      currentProduct.isDone
        ? dispatch(
            setCurrentShopCartProducts(
              currentShopCartProducts.filter(
                (product) => product.uid != currentProduct.uid
              )
            )
          )
        : dispatch(
            setCurrentShopPendingProducts(
              currentShopPendingProducts.filter(
                (product) => product.uid != currentProduct.uid
              )
            )
          );

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Produto excluído',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao excluir o produto',
      });
    } finally {
      setRemoveProductLoading(false);
    }
  }


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

      {!isCompletedShop && !isInCart && (
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
              onClick={onOpenRemoveDialog}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DecisionDialog
        title="Excluir produto?"
        description="Todos os dados desse produto serão perdidos e esta ação não poderá ser desfeita."
        actionLabel="Excluir"
        type="danger"
        open={openRemoveDialog}
        setOpen={setOpenRemoveDialog}
        loading={removeProductLoading}
        onConfirm={removeProduct}
      />

      <ProductEditDialog
        product={currentProduct}
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
      />
    </div>
  );
};

export default ProductCard;
