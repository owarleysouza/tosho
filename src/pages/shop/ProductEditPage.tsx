import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormInput from '@/components/form/FormInput';
import FormSelect from '@/components/form/FormSelect';
import { toast } from '@/components/ui/use-toast';

import { Loader2 } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { ProductEditFormSchema } from '@/utils/formValidations';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PrivateLayout from '@/layouts/PrivateLayout';

import { UserContext } from '@/context/commom/UserContext';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
} from '@/app/shop/shopSlice';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ProductEditPage = () => {
  const { user } = useContext(UserContext);

  const { state } = useLocation();
  const product = state.product;

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);
  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.shop.currentShopPendingProducts
  );
  const currentShopCartProducts = useSelector(
    (state: RootState) => state.shop.currentShopCartProducts
  );

  const dispatch = useDispatch();

  const [editProductLoading, setEditProductLoading] = useState(false);

  const navigate = useNavigate();

  //Firestore Reference
  const productRef = doc(
    db,
    `users/${user?.uid}/shops/${currentShop.uid}/products`,
    product.uid
  );

  const form = useForm<z.infer<typeof ProductEditFormSchema>>({
    resolver: zodResolver(ProductEditFormSchema),
    defaultValues: {
      name: product.name,
      quantity: product.quantity,
      category: product.category,
      description: product.description ? product.description : '',
      price: product.price ? product.price : 0,
    },
  });

  async function onSubmit(data: z.infer<typeof ProductEditFormSchema>) {
    try {
      setEditProductLoading(true);

      const productToEdit = {
        uid: product.uid,
        isDone: product.isDone,
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
      navigate('/');
    }
  }

  return (
    <PrivateLayout>
      <div className="flex flex-col items-center mt-16">
        <div className="w-full">
          <ArrowLeft className="cursor-pointer" onClick={() => navigate('/')} />
        </div>
        <span className="text-lg text-black font-bold my-3">
          Editar Produto
        </span>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 w-full"
          >
            <FormInput
              formControl={form.control}
              name="name"
              placeholder="Nome"
              hint="Digite o nome do produto"
            />

            <FormInput
              formControl={form.control}
              name="quantity"
              placeholder="Quantidade"
              hint="Digite a quantidade do produto"
            />

            <FormSelect
              formControl={form.control}
              name="category"
              placeholder="Categoria"
              hint="Selecione a categoria do produto"
            />

            <FormInput
              formControl={form.control}
              name="description"
              placeholder="Descrição"
              hint="Digite a descrição do produto"
            />

            <FormInput
              formControl={form.control}
              name="price"
              placeholder="Preço"
              hint="Digite o preço da unidade do produto"
            />

            <Button
              disabled={editProductLoading}
              type="submit"
              className="w-full rounded-full px-8"
            >
              {editProductLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Editar'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </PrivateLayout>
  );
};

export default ProductEditPage;
