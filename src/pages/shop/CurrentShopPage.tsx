import { useContext, useEffect, useState } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Product } from '@/types';
import { ProductsCreateFormSchema } from '@/utils/formValidations';

import { handleProductsInput } from '@/utils/handleProductsInput';
import { getVisibleItems } from '@/utils/itemVisibility';

import { UserContext } from '@/context/commom/UserContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import productsBlankStateSVG from '@/assets/images/products-blank-state.svg';
import cartBlankStateSVG from '@/assets/images/cart-blank-state.svg';

import CurrentShopPriceCard from '@/pages/shop/CurrentShopPriceCard';

import PurchaseHero from '@/components/purchase/PurchaseHero';
import BlankState from '@/components/commom/BlankState';
import ProductFormFooter from '@/components/form/ProductFormFooter';
import LoadingPage from '@/pages/commom/LoadingPage';
import { useToast } from '@/components/ui/use-toast';
import ProductList from '@/components/shop/ProductList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  DocumentData,
  getDocs,
  increment,
  writeBatch,
} from 'firebase/firestore';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
} from '@/app/shop/shopSlice';

interface ShopProps {
  shop: DocumentData; //TODO: Change this type to a Shop type
}

const tabTriggerClassName =
  'w-full rounded-none border-b-[2.5px] border-transparent pb-2 text-[13px] font-normal text-white data-[state=active]:border-tosho-300 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-none';

const CurrentShopPage: React.FC<ShopProps> = ({ shop }) => {
  const { user } = useContext(UserContext);

  const productsCollectionRef = collection(
    db,
    `users/${user?.uid}/shops/${shop.uid}/products`
  );

  const shopDocRef = doc(db, `users/${user?.uid}/shops`, shop.uid);

  const isDesktop = useMediaQuery('(min-width: 768px)');

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

  const [searchTerm, setSearchTerm] = useState('');

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
        // Writes every product and the shop's itemsCount counter in one
        // atomic batch, so the denormalized count never drifts from the
        // actual number of product documents.
        const batch = writeBatch(db);

        const addedProducts = productsToAdd.map((product) => {
          const productRef = doc(productsCollectionRef);
          batch.set(productRef, product);
          return { uid: productRef.id, ...product };
        });

        batch.update(shopDocRef, { itemsCount: increment(addedProducts.length) });

        await batch.commit();

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

  // RN-09 — derived from the current item lists on every render, never
  // stored, so it can't drift out of sync with the actual data.
  const completedCount = currentShopCartProducts.length;
  const totalCount = currentShopPendingProducts.length + completedCount;

  const visiblePendingProducts = getVisibleItems(currentShopPendingProducts, {
    searchTerm,
  });

  const searchInput = currentShopPendingProducts.length > 0 && (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-tosho-500" />
      <Input
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar item..."
        className="rounded-xl border-border bg-muted pl-10 placeholder:text-tosho-text-3"
      />
    </div>
  );

  const listContent = !currentShopPendingProducts.length ? (
    <BlankState
      image={productsBlankStateSVG}
      title="Nenhum produto pendente na lista"
    />
  ) : visiblePendingProducts.length ? (
    <ProductList products={visiblePendingProducts} isCompletedShop={false} />
  ) : (
    <BlankState image={productsBlankStateSVG} title="Nenhum item encontrado" />
  );

  const cartContent = currentShopCartProducts.length ? (
    <div className="w-full">
      <CurrentShopPriceCard products={currentShopCartProducts} />
      <ProductList products={currentShopCartProducts} isCompletedShop={false} />
    </div>
  ) : (
    <BlankState image={cartBlankStateSVG} title="Nenhum produto no carrinho :(" />
  );

  // Stand-in for HU-07's FAB (which will add "Por template"/"Por texto
  // livre" pills): reuses the existing free-text form inside a Sheet
  // instead of leaving it always visible in the list, matching the clean
  // list + floating button from the print.
  const addItemsTrigger = (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Adicionar itens"
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg',
            !isDesktop && 'fixed bottom-20 right-5 z-40'
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Adicionar itens</SheetTitle>
          <SheetDescription>
            Digite um ou mais produtos, um por linha.
          </SheetDescription>
        </SheetHeader>
        <div className="flex justify-center pt-3">
          <ProductFormFooter
            createProductsLoading={createProductsLoading}
            onProductsAdd={onSubmitProduct}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <PurchaseHero
        name={shop.name}
        scheduledAt={shop.scheduledAt}
        date={shop.date}
        completedCount={completedCount}
        totalCount={totalCount}
      >
        {/* Mobile-only tabs, embedded in the same green hero box as the
            print. Desktop shows both columns at once — genuinely different
            markup, not the same tree with a column hidden via CSS. */}
        {!isDesktop && (
          <TabsList className="mt-4 grid h-auto w-full grid-cols-2 rounded-none bg-transparent p-0">
            <TabsTrigger value="list" className={tabTriggerClassName}>
              Lista
            </TabsTrigger>
            <TabsTrigger value="cart" className={tabTriggerClassName}>
              Carrinho
            </TabsTrigger>
          </TabsList>
        )}
      </PurchaseHero>

      {isDesktop ? (
        <div className="grid grid-cols-2 px-8 py-6">
          <section className="min-w-0 flex flex-col items-center space-y-3 pr-6">
            <div className="flex w-full flex-col">
              <h2 className="text-base font-semibold text-foreground">Lista</h2>
              <p className="text-xs text-muted-foreground">
                {currentShopPendingProducts.length}{' '}
                {currentShopPendingProducts.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
            {searchInput}
            {listContent}
            <div className="flex w-full justify-end">{addItemsTrigger}</div>
          </section>
          <section className="min-w-0 flex flex-col items-center space-y-3 border-l border-border pl-6">
            {cartContent}
          </section>
        </div>
      ) : (
        <>
          <TabsContent value="list" forceMount hidden={activeTab !== 'list'}>
            <section className="flex flex-col items-center justify-center space-y-3 px-5 py-4">
              {searchInput}
              {listContent}
              {addItemsTrigger}
            </section>
          </TabsContent>
          <TabsContent value="cart" forceMount hidden={activeTab !== 'cart'}>
            <section className="flex flex-col items-center px-5 py-4 pb-2">
              {cartContent}
            </section>
          </TabsContent>
        </>
      )}
    </Tabs>
  );
};

export default CurrentShopPage;
