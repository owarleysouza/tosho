import { useContext, useEffect, useState } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Product } from '@/types';
import { ProductsCreateFormSchema } from '@/utils/formValidations';

import { handleProductsInput } from '@/utils/handleProductsInput';
import { getVisibleItems } from '@/utils/itemVisibility';
import { getSortedCategoryGroups, normalizeCategory } from '@/utils/categories';

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
import { Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

// RN-13 — sentinel for "no category filter"/"Todos", never a real category
// name, so it can't collide with an actual category.
const ALL_CATEGORIES = 'all';

const categoryChipClassName =
  'shrink-0 rounded-full border border-border bg-muted px-3.5 py-1 text-xs font-medium text-muted-foreground data-[state=on]:border-transparent data-[state=on]:bg-tosho-900 data-[state=on]:text-tosho-hero-fg';

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
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const [fabExpanded, setFabExpanded] = useState(false);

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

    // RN-17 — same name (case-insensitive) + category as something already
    // in the purchase (pending or cart) is skipped silently, no error.
    // Duplicates within the same pasted batch are folded in as we go, so
    // pasting the same line twice doesn't create two identical documents.
    const existingProducts = currentShopPendingProducts.concat(currentShopCartProducts);
    const isSameItem = (a: { name: string; category: string }, b: { name: string; category: string }) =>
      a.name.toLowerCase() === b.name.toLowerCase() &&
      normalizeCategory(a.category).toLowerCase() === normalizeCategory(b.category).toLowerCase();

    const duplicateNames: string[] = [];
    const newProducts = productsToAdd.reduce<typeof productsToAdd>(
      (accepted, candidate) => {
        const isDuplicate =
          existingProducts.some((existing) => isSameItem(existing, candidate)) ||
          accepted.some((existing) => isSameItem(existing, candidate));
        if (isDuplicate) duplicateNames.push(candidate.name);
        return isDuplicate ? accepted : accepted.concat(candidate);
      },
      []
    );

    // RN-17 says no *error* for duplicates, but silence makes it look like
    // the item vanished — this is an informational heads-up (soft yellow,
    // not destructive) naming what was skipped, so the user knows to go
    // check the list/cart instead of assuming something broke.
    function notifyDuplicates() {
      if (!duplicateNames.length) return;
      toast({
        variant: 'warning',
        title: 'Já estava na compra',
        description:
          duplicateNames.length === 1
            ? `"${duplicateNames[0]}" já estava na lista ou no carrinho e não foi adicionado de novo.`
            : `Já estavam na lista ou no carrinho e não foram adicionados de novo: ${duplicateNames.join(', ')}.`,
      });
    }

    if (!newProducts.length) {
      notifyDuplicates();
      form.reset();
      return;
    }

    try {
      setCreateProductsLoading(true);
      if (user) {
        // Writes every product and the shop's itemsCount counter in one
        // atomic batch, so the denormalized count never drifts from the
        // actual number of product documents.
        const batch = writeBatch(db);

        const addedProducts = newProducts.map((product) => {
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
        notifyDuplicates();
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

  // Chips reflect the categories actually present in the purchase (not
  // filtered by the current search term) — reusing the same helper that
  // groups the list itself guarantees chips never diverge from the
  // headings actually rendered below.
  const presentCategories = getSortedCategoryGroups(currentShopPendingProducts).map(
    (group) => group.category
  );

  const visiblePendingProducts = getVisibleItems(currentShopPendingProducts, {
    searchTerm,
    category: selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory,
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

  const categoryChips = currentShopPendingProducts.length > 0 && (
    <ToggleGroup
      type="single"
      value={selectedCategory}
      // Radix lets you deselect the active chip in single mode, which would
      // otherwise leave an invalid empty value — fall back to "Todos".
      onValueChange={(value) => setSelectedCategory(value || ALL_CATEGORIES)}
      className="w-full justify-start gap-1.5 overflow-x-auto"
    >
      <ToggleGroupItem value={ALL_CATEGORIES} className={categoryChipClassName}>
        Todos
      </ToggleGroupItem>
      {presentCategories.map((category) => (
        <ToggleGroupItem
          key={category}
          value={category}
          className={categoryChipClassName}
        >
          {category}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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

  // FAB expands into "Por template" (HU-08, placeholder for now) and "Por
  // texto livre" pills (print 06) instead of opening the Sheet directly.
  const addItemsTrigger = (
    <div
      className={cn(
        'flex items-center gap-2',
        !isDesktop && 'fixed bottom-20 right-5 z-40'
      )}
    >
      {fabExpanded && (
        <>
          <button
            type="button"
            disabled
            className="shrink-0 whitespace-nowrap rounded-full border border-border bg-muted px-4 py-2.5 text-xs font-medium text-tosho-900 opacity-60"
          >
            Por template
          </button>

          <Sheet
            onOpenChange={(open) => {
              if (!open) setFabExpanded(false);
            }}
          >
            <SheetTrigger asChild>
              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-full border border-border bg-muted px-4 py-2.5 text-xs font-medium text-tosho-900"
              >
                Por texto livre
              </button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader className="sm:text-center">
                <SheetTitle>Adicionar itens</SheetTitle>
                <SheetDescription className="text-xs">
                  Digite um ou mais produtos, um por linha, no formato Nome,
                  Categoria, Quantidade, Descrição. Apenas o nome é
                  obrigatório — campos do final podem ficar em branco.
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
        </>
      )}

      <button
        type="button"
        onClick={() => setFabExpanded((expanded) => !expanded)}
        aria-label={fabExpanded ? 'Fechar' : 'Adicionar itens'}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        {fabExpanded ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
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
            {categoryChips}
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
              {categoryChips}
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
