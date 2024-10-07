import React, { useContext, useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ListPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { productsCatalog } from '@/data/productsCatalog';
import { Product } from '@/types';
import { db } from '@/lib/firebase';
import { addDoc, collection, DocumentData } from 'firebase/firestore';

import { UserContext } from '@/context/commom/UserContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';

import {
  setNextShopPendingProducts,
  setCurrentShopPendingProducts,
} from '@/app/shop/shopSlice';
import { toast } from '../ui/use-toast';

interface ProductCatalogProps {
  shop: DocumentData; //TODO: Change this type to a Shop type
  type: string;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ shop, type }) => {
  const { user } = useContext(UserContext);

  const productsCollectionRef = collection(
    db,
    `users/${user?.uid}/shops/${shop.uid}/products`
  );

  const nextShopPendingProducts = useSelector(
    (state: RootState) => state.store.nextShopPendingProducts
  );

  const currentShopPendingProducts = useSelector(
    (state: RootState) => state.store.currentShopPendingProducts
  );

  const dispatch = useDispatch();

  const [sortedProductsCatalog, setSortedProductsCatalog] = useState<Product[]>(
    []
  );

  const [loadingProductCatalogId, setLoadingProductCatalogId] = useState('');

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
        type === 'nextShop'
          ? dispatch(
              setNextShopPendingProducts(
                nextShopPendingProducts.concat(newProduct)
              )
            )
          : dispatch(
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
    sortProductsCatalog();
  }, []);

  return (
    <Sheet>
      <SheetTrigger>
        <ListPlus className="cursor-pointer" />
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>Catálogo de Produtos</SheetTitle>
          <SheetDescription>
            Adicione um ou mais produtos para sua compra atual de forma simples
            e rápida
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
  );
};

export default ProductCatalog;
