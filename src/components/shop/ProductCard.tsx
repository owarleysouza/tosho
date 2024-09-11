import React, { useContext, useState } from 'react';

import { Product } from '@/types';
import { z } from 'zod';
import { ProductEditFormSchema } from '@/utils/formValidations';
import { formatPrice } from '@/utils/formatters';

import ProductEditDialog from '@/pages/shop/ProductEditDialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DecisionDialog from '@/components/commom/DecisionDialog';
import { toast } from '@/components/ui/use-toast';
import { EllipsisVertical } from 'lucide-react';

import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { UserContext } from '@/context/commom/UserContext';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
} from '@/app/shop/shopSlice';

interface ProductProps {
  currentProduct: Product;
  isVisualizer: boolean;
}

const ProductCard: React.FC<ProductProps> = ({
  currentProduct,
  isVisualizer,
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

  //Remove Product
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [removeProductLoading, setRemoveProductLoading] = useState(false);

  //Edit Product
  const [openProductEditDialog, setOpenProductEditDialog] = useState(false);
  const [editProductLoading, setEditProductLoading] = useState(false);

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

      await deleteDoc(productRef);

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

  function onOpenEditDialog() {
    setOpenProductEditDialog(true);
    setOpenMenu(false);
  }

  async function editProduct(data: z.infer<typeof ProductEditFormSchema>) {
    try {
      setEditProductLoading(true);

      const productToEdit = {
        uid: currentProduct.uid,
        isDone: currentProduct.isDone,
        ...data,
      };

      await updateDoc(productRef, {
        name: productToEdit.name,
        quantity: productToEdit.quantity,
        category: productToEdit.category,
        description: productToEdit.description,
        price: productToEdit.price,
      });
      //TODO: This can be improved
      if (productToEdit.isDone) {
        dispatch(
          setCurrentShopCartProducts(
            currentShopCartProducts.map((element) =>
              element.uid === productToEdit.uid
                ? { ...element, ...productToEdit }
                : element
            )
          )
        );
      } else {
        dispatch(
          setCurrentShopPendingProducts(
            currentShopPendingProducts.map((element) =>
              element.uid === productToEdit.uid
                ? { ...element, ...productToEdit }
                : element
            )
          )
        );
      }

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Produto editado',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao editar o produto',
      });
    } finally {
      setEditProductLoading(false);
    }
  }

  return (
    <div className="flex flex-row w-[316px] min-h-[62px] justify-between bg-secondary py-3 px-4 rounded-2xl border border-accent shadow gap-2">
      <section className="flex flex-row items-center gap-2">
        <Checkbox
          id={currentProduct.uid}
          className="rounded-md h-5 w-5"
          checked={isVisualizer ? isVisualizer : currentProduct.isDone}
          onCheckedChange={toggleProductStatus}
          disabled={isVisualizer}
        />
        <div className="flex flex-col">
          <label
            htmlFor={currentProduct.uid}
            className="cursor-pointer text-xs text-black font-semibold break-all ..."
          >
            {currentProduct.name}
          </label>
          <span className="text-xs text-slate-400 break-all ...">
            {currentProduct.description}
          </span>
        </div>
      </section>

      <section className="flex flex-row items-center gap-1.5">
        <span className="text-xs text-black font-bold">
          {currentProduct.quantity}x
        </span>
        <span className="text-xs text-black font-bold">
          {formatPrice(currentProduct.price)}
        </span>
        {!isVisualizer && (
          <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
            <DropdownMenuTrigger asChild>
              <EllipsisVertical className="h-5 w-5 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onOpenEditDialog}
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
          openProductEditDialog={openProductEditDialog}
          setOpenProductEditDialog={setOpenProductEditDialog}
          onEditProduct={editProduct}
          editProductLoading={editProductLoading}
        />
      </section>
    </div>
  );
};

export default ProductCard;
