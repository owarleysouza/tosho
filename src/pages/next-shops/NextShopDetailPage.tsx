import PrivateLayout from '@/layouts/PrivateLayout';
import { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { UserContext } from '@/context/commom/UserContext';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import LoadingPage from '@/pages/commom/LoadingPage';
import ProductList from '@/components/shop/ProductList';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BlankState from '@/components/commom/BlankState';
import ProductFormFooter from '@/components/form/ProductFormFooter';
import CurrentShopPriceCard from '../shop/CurrentShopPriceCard';
import ProductCatalog from '@/components/shop/ProductCatalog';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';

import cartBlankStateSVG from '@/assets/images/cart-blank-state.svg';
import productsBlankStateSVG from '@/assets/images/products-blank-state.svg';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Product } from '@/types';
import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { formatDate } from '@/utils/formatDate';
import { handleProductsInput } from '@/utils/formatProductsInput';

import {
  setNextShopPendingProducts,
  setNextShopCartProducts,
} from '@/app/shop/shopSlice';

const NextShopDetailPage = () => {
  const { user } = useContext(UserContext);

  const dispatch = useDispatch();

  const { shopId } = useParams();

  const { state } = useLocation();

  const productsCollectionRef = collection(
    db,
    `users/${user?.uid}/shops/${shopId}/products`
  );

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [createProductsLoading, setCreateProductsLoading] = useState(false);

  const nextShopPendingProducts = useSelector(
    (state: RootState) => state.store.nextShopPendingProducts
  );
  const nextShopCartProducts = useSelector(
    (state: RootState) => state.store.nextShopCartProducts
  );

  const [activeTab, setActiveTab] = useState('list');

  async function getProducts() {
    console.log('shopId', shopId);
    const pendingList: Product[] = [];
    const checkedList: Product[] = [];

    try {
      if (user) {
        const pendingProductsRef = collection(
          db,
          `users/${user.uid}/shops/${shopId}/products`
        );
        const querySnapshot = await getDocs(pendingProductsRef);

        querySnapshot.forEach((doc) => {
          const { name, quantity, category, isDone, description, price } =
            doc.data();
          const product: Product = {
            uid: doc.id,
            name,
            quantity,
            category,
            isDone,
            description,
            price,
          };

          product.isDone
            ? checkedList.push(product)
            : pendingList.push(product);
        });

        dispatch(setNextShopPendingProducts(pendingList));
        dispatch(setNextShopCartProducts(checkedList));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao carregar produtos',
      });
    } finally {
      setLoadingProducts(false);
    }
  }

  async function onSubmitProduct(
    data: z.infer<typeof ProductsCreateFormSchema>,
    form: UseFormReturn<{ text: string }>
  ): Promise<void> {
    const productsToAdd = handleProductsInput(data.text);

    if (productsToAdd.length > 30) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Limite de produtos a adicionar por vez atingido',
      });

      return;
    }

    try {
      setCreateProductsLoading(true);
      if (user) {
        const productPromises = productsToAdd.map(async (product) => {
          const { id } = await addDoc(productsCollectionRef, product);
          const newProduct = {
            uid: id,
            ...product,
          };
          return newProduct;
        });

        const addedProducts = await Promise.all(productPromises);
        dispatch(
          setNextShopPendingProducts(
            nextShopPendingProducts.concat(addedProducts)
          )
        );

        form.reset();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu na adição de produtos',
      });
    } finally {
      setCreateProductsLoading(false);
    }
  }

  useEffect(() => {
    getProducts();
  }, []);

  if (loadingProducts)
    return (
      <PrivateLayout>
        <LoadingPage />
      </PrivateLayout>
    );

  return (
    <PrivateLayout>
      <div className="mt-16">
        <div className="flex flex-row items-center justify-between">
          <section className="flex flex-col items-center my-3 mx-auto">
            <span className="text-xs text-slate-400">
              {formatDate(state.shop.date?.seconds)}
            </span>
            <span className="text-lg text-black font-bold">
              {state.shop.name}
            </span>
          </section>
          <ProductCatalog shop={state.shop} type="nextShop" />
        </div>

        <Tabs
          defaultValue="list"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-80 bg-secondary">
            <TabsTrigger
              value="list"
              className="w-1/2 data-[state=active]:bg-accent"
            >
              Lista
            </TabsTrigger>
            <TabsTrigger
              value="cart"
              className="w-1/2 data-[state=active]:bg-accent"
            >
              Carrinho
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="list"
            forceMount={true}
            hidden={'list' !== activeTab}
          >
            <section className="flex flex-col justify-center items-center space-y-3">
              {nextShopPendingProducts.length ? (
                <ProductList
                  products={nextShopPendingProducts}
                  isCompletedShop={false}
                />
              ) : (
                <BlankState
                  image={productsBlankStateSVG}
                  title="Nenhum produto pendente na lista"
                />
              )}

              <ProductFormFooter
                createProductsLoading={createProductsLoading}
                onProductsAdd={onSubmitProduct}
              />
            </section>
          </TabsContent>
          <TabsContent
            value="cart"
            forceMount={true}
            hidden={'cart' !== activeTab}
          >
            <section className="pb-2">
              {nextShopCartProducts.length ? (
                <div>
                  <CurrentShopPriceCard
                    cartProducts={nextShopCartProducts}
                    pendingProducts={nextShopPendingProducts}
                    getCurrentShop={() => {}}
                  />

                  <ProductList
                    products={nextShopCartProducts}
                    isCompletedShop={false}
                  />
                </div>
              ) : (
                <BlankState
                  image={cartBlankStateSVG}
                  title="Nenhum produto no carrinho :("
                />
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </PrivateLayout>
  );
};

export default NextShopDetailPage;
