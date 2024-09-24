import { useContext, useEffect, useState } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Product } from '@/types';
import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { formatDate } from '@/utils/formatDate';

import { UserContext } from '@/context/commom/UserContext';

import productsBlankStateSVG from '@/assets/images/products-blank-state.svg';
import cartBlankStateSVG from '@/assets/images/cart-blank-state.svg';
import { ListPlus, Loader2 } from 'lucide-react';

import CurrentShopPriceCard from '@/pages/shop/CurrentShopPriceCard';

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
import { Button } from '@/components/ui/button';

import { productsCatalog } from '@/data/productsCatalog';

import { db } from '@/lib/firebase';
import { addDoc, collection, DocumentData, getDocs } from 'firebase/firestore';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import {
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts,
} from '@/app/shop/shopSlice';
import { Separator } from '@/components/ui/separator';

interface ShopProps {
  shop: DocumentData; //TODO: Change this type to a Shop type
}

const CurrentShopPage: React.FC<ShopProps> = ({ shop }) => {
  const { user } = useContext(UserContext);

  const productsCollectionRef = collection(
    db,
    `users/${user?.uid}/shops/${shop.uid}/products`
  );

  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.shop.currentShopPendingProducts
  );
  const currentShopCartProducts = useSelector(
    (state: RootState) => state.shop.currentShopCartProducts
  );
  const dispatch = useDispatch();

  const [createProductsLoading, setCreateProductsLoading] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [sortedProductsCatalog, setSortedProductsCatalog] = useState<Product[]>(
    []
  );

  const [loadingProductCatalogId, setLoadingProductCatalogId] = useState('');

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
      const parts = row.trim().split(',');

      const name = parts[0]?.trim();
      let quantity = 1; // Default value for quantity
      let description = ''; // Default value for description

      // If there's three parts, we assume the second one as quantity and the third as description
      if (parts.length === 3) {
        quantity = parseInt(parts[1]) || 1;
        description = parts[2]?.trim() || '';
        // If there's just two parts, we verify if the second one is a quantity or a description
      } else if (parts.length === 2) {
        //Second one is quantity
        if (!isNaN(Number(parts[1]))) {
          quantity = parseInt(parts[1]);
        } else {
          description = parts[1]?.trim() || '';
        }
      }

      // Name is mandatory
      if (name) {
        products.push({
          name: name,
          quantity: quantity,
          description: description,
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

  function sortProductsCatalog() {
    setSortedProductsCatalog(
      productsCatalog.sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function addProductFromCatalog(product: Product) {
    const productToAdd = {
      name: product.name,
      quantity: product.quantity,
      category: product.category,
      isDone: false,
    };

    try {
      setLoadingProductCatalogId(product.uid);
      if (user) {
        const { id } = await addDoc(productsCollectionRef, productToAdd);
        const newProduct = {
          ...product,
          uid: id,
        };

        dispatch(
          setCurrentShopPendingProducts(
            currentShopPendingProducts.concat(newProduct)
          )
        );

        toast({
          variant: 'success',
          title: 'Produto adicionado',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu na adição do produto',
      });
    } finally {
      setLoadingProductCatalogId('');
    }
  }

  useEffect(() => {
    getProducts();
    sortProductsCatalog();
  }, []);

  if (loadingProducts) return <LoadingPage />;

  return (
    <div className="mt-16">
      <div className="flex flex-row items-center justify-between">
        <section className="flex flex-col items-center my-3 mx-auto">
          <span className="text-xs text-slate-400">
            {formatDate(shop.date?.seconds)}
          </span>
          <span className="text-lg text-black font-bold">{shop.name}</span>
        </section>
        <Sheet>
          <SheetTrigger>
            <ListPlus className="cursor-pointer" />
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-scroll">
            <SheetHeader>
              <SheetTitle>Catálogo de Produtos</SheetTitle>
              <SheetDescription>
                Adicione um ou mais produtos para sua compra atual de forma
                simples e rápida
              </SheetDescription>

              <section className="py-2">
                {sortedProductsCatalog.map((product) => (
                  <div key={product.uid}>
                    <div className="flex flex-row items-center justify-between">
                      <span>{product.name}</span>
                      <Button
                        disabled={loadingProductCatalogId === product.uid}
                        type="button"
                        onClick={() => addProductFromCatalog(product)}
                        className="rounded-full px-4"
                        variant="ghost"
                      >
                        {loadingProductCatalogId === product.uid ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          'Adicionar'
                        )}
                      </Button>
                    </div>
                    <Separator className="my-1" />
                  </div>
                ))}
              </section>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>

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
            {currentShopCartProducts.length ? (
              <div>
                <CurrentShopPriceCard products={currentShopCartProducts} />

                <ProductList
                  products={currentShopCartProducts}
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
  );
};

export default CurrentShopPage;
