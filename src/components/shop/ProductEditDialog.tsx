import { useContext, useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormInput from '@/components/form/FormInput';
import FormSelect from '@/components/form/FormSelect';
import { Loader2 } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { ProductEditFormSchema } from '@/utils/formValidations';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { UserContext } from '@/context/commom/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
} from '@/app/shop/shopSlice';

import { Product } from '@/types';
import { FIXED_CATEGORIES, normalizeCategory, sortCategoryNames } from '@/utils/categories';

interface ProductEditDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildDefaultValues(product: Product) {
  return {
    name: product.name,
    quantity: product.quantity ?? '',
    category: product.category,
    description: product.description ?? '',
  };
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  product,
  open,
  onOpenChange,
}) => {
  const { user } = useContext(UserContext);
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);
  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.shop.currentShopPendingProducts
  );
  const currentShopCartProducts = useSelector(
    (state: RootState) => state.shop.currentShopCartProducts
  );
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof ProductEditFormSchema>>({
    resolver: zodResolver(ProductEditFormSchema),
    defaultValues: buildDefaultValues(product),
  });

  // Same react-hook-form gotcha as ShopFormDialog: defaultValues only apply
  // at mount, and this dialog stays mounted between opens — re-sync every
  // time it opens instead of showing whatever product it first saw.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(product));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  // RN-13 — the select offers the fixed 16 plus whatever custom categories
  // are already in use in this purchase, so an item with a custom category
  // never shows up blank and gets silently overwritten on save.
  const categoriesInUse = currentShopPendingProducts
    .concat(currentShopCartProducts)
    .map((item) => item.category);
  const categoryOptions = sortCategoryNames(
    Array.from(new Set([...FIXED_CATEGORIES, ...categoriesInUse]))
  );

  async function onSubmit(data: z.infer<typeof ProductEditFormSchema>) {
    try {
      setLoading(true);
      if (!user) return;

      const productRef = doc(
        db,
        `users/${user.uid}/shops/${currentShop.uid}/products`,
        product.uid
      );

      // Empty string, not undefined — updateDoc needs an explicit value to
      // actually clear a previously-set field; an omitted/undefined one
      // just leaves the old value untouched in Firestore.
      const updatedFields = {
        name: data.name,
        quantity: data.quantity || '',
        // RN-15 — no category chosen falls back to "Outros", same helper
        // HU-07 already uses. Not a parallel validation.
        category: normalizeCategory(data.category || ''),
        description: data.description || '',
      };

      await updateDoc(productRef, updatedFields);

      const updatedProduct = { ...product, ...updatedFields };

      if (product.isDone) {
        dispatch(
          setCurrentShopCartProducts(
            currentShopCartProducts.map((item) =>
              item.uid === product.uid ? updatedProduct : item
            )
          )
        );
      } else {
        dispatch(
          setCurrentShopPendingProducts(
            currentShopPendingProducts.map((item) =>
              item.uid === product.uid ? updatedProduct : item
            )
          )
        );
      }

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Produto editado',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao editar o produto',
      });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
        <FormInput
          formControl={form.control}
          name="name"
          label="Nome"
          placeholder="Nome do produto"
          className="space-y-1"
        />

        <FormInput
          formControl={form.control}
          name="quantity"
          label="Quantidade"
          placeholder="2 unidades, 500g..."
          className="space-y-1"
        />

        <FormSelect
          formControl={form.control}
          name="category"
          label="Categoria"
          placeholder="Categoria"
          options={categoryOptions}
          className="space-y-1"
        />

        <FormInput
          formControl={form.control}
          name="description"
          label="Descrição"
          placeholder="Descrição ou observação do produto"
          className="space-y-1"
        />

        <Button disabled={loading} type="submit" className="w-full rounded-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </form>
    </Form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[380px]"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
            <DialogDescription>Atualize os dados do item.</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Editar item</DrawerTitle>
          <DrawerDescription>Atualize os dados do item.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">{formContent}</div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProductEditDialog;
