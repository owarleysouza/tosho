import { useContext, useEffect, useState } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Product } from '@/types';
import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { formatDate } from '@/utils/formatDate';

import { UserContext } from '@/context/commom/UserContext';

import productsBlankStateSVG from '@/assets/images/products-blank-state.svg';
import cartBlankStateSVG from '@/assets/images/cart-blank-state.svg';

import BlankState from '@/components/commom/BlankState';
import ProductFormFooter from '@/components/form/ProductFormFooter';
import LoadingPage from '@/pages/commom/LoadingPage';
import { useToast } from '@/components/ui/use-toast';
import ProductList from '@/components/shop/ProductList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopTotalCard from '@/components/shop/ShopTotalCard';

import { db } from '@/lib/firebase';
import { addDoc, collection, DocumentData, getDocs } from 'firebase/firestore';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
} from '@/app/shop/shopSlice';

interface ShopProps {
  shop: DocumentData; //TODO: Change this type to a Shop type
}

const CurrentShopPage: React.FC<ShopProps> = ({ shop }) => {
  const { user } = useContext(UserContext);

  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.shop.currentShopPendingProducts
  );
  const currentShopCartProducts = useSelector(
    (state: RootState) => state.shop.currentShopCartProducts
  );
  const dispatch = useDispatch();

  const [createProductsLoading, setCreateProductsLoading] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(true);

  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('list');

  async function getProducts() {
    const pendingList: Product[] = [];
    const checkedList: Product[] = [];

    try {
      //Verification if products is empty for avoid to do a get on firestore again and replicate the products on redux state. Try to improve this approach later
      if (
        user &&
        !currentShopPendingProducts.length &&
        !currentShopCartProducts.length
      ) {
        const pendingProductsRef = collection(
          db,
          `users/${user.uid}/shops/${shop.uid}/products`
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

        dispatch(setCurrentShopPendingProducts(pendingList));
        dispatch(setCurrentShopCartProducts(checkedList));
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

  function handleProductsInput(text: string) {
    const products = [];
    const rows = text.trim().split('\n');

    for (const row of rows) {
      const [name, quantity] = row.trim().split(',');

      //Validate if user just typed \n
      if (name || quantity) {
        products.push({
          name: name ? name : 'Produto Exemplo',
          quantity: quantity ? parseInt(quantity) : 1,
          category: 'others',
          isDone: false,
        });
      }
    }

    return products;
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
        const productsCollRef = collection(
          db,
          `users/${user.uid}/shops/${shop.uid}/products`
        );

        const productPromises = productsToAdd.map(async (product) => {
          const { id } = await addDoc(productsCollRef, product);
          const newProduct = {
            uid: id,
            ...product,
          };
          return newProduct;
        });

        const addedProducts = await Promise.all(productPromises);
        dispatch(
          setCurrentShopPendingProducts(
            currentShopPendingProducts.concat(addedProducts)
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

  if (loadingProducts) return <LoadingPage />;

  return (
    <div className="mt-16">
      <section className="flex flex-col items-center my-3">
        <span className="text-xs text-slate-400">
          {formatDate(shop.date?.seconds)}
        </span>
        <span className="text-lg text-black font-bold">{shop.name}</span>
      </section>

      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
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
            {currentShopPendingProducts.length ? (
              <ProductList
                products={currentShopPendingProducts}
                isVisualizer={false}
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
            {currentShopCartProducts.length ? (
              <div>
                <ShopTotalCard
                  products={currentShopCartProducts}
                  isVisualizer={false}
                />

                <ProductList
                  products={currentShopCartProducts}
                  isVisualizer={false}
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
  );
};

export default CurrentShopPage;
