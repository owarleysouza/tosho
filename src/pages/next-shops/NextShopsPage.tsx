import { useContext, useEffect, useState } from 'react';

import { UserContext } from '@/context/commom/UserContext';

import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import PrivateLayout from '@/layouts/PrivateLayout';
import ShopCard from '@/components/shop/ShopCard';
import LoadingPage from '@/pages/commom/LoadingPage';
import { toast } from '@/components/ui/use-toast';
import BlankState from '@/components/commom/BlankState';

import shopBlankStateSVG from '@/assets/images/shop-blank-state.svg';
import { RootState } from '@/app/store';
import { useDispatch, useSelector } from 'react-redux';

import { setNextShops } from '@/app/shop/shopSlice';
import CurrentShopCreateDialog from '../shop/CurrentShopCreateDialog';

const NextShopsPage = () => {
  const { user } = useContext(UserContext);

  const nextShops = useSelector((state: RootState) => state.store.nextShops);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [removeShopLoading, setRemoveShopLoading] = useState(false);

  async function getShops() {
    const myNextShops: DocumentData[] = [];
    try {
      if (!user || !Object.keys(user).length) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo de errado aconteceu',
          description: 'Um erro inesperado aconteceu ao carregar o usuário',
        });
        return;
      }
      const shopsRef = query(
        collection(db, 'users', user.uid, 'shops'),
        where('isDone', '==', false)
      );
      const querySnapshot = await getDocs(shopsRef);

      //TODO: Type this shop later
      querySnapshot.forEach((doc) => {
        const { name, date, total, isDone } = doc.data();
        const shop = {
          uid: doc.id,
          name,
          date,
          total,
          isDone,
        };

        myNextShops.push(shop);
      });

      myNextShops.sort((a, b) => a.date.seconds - b.date.seconds);
      myNextShops.shift();
      dispatch(setNextShops(myNextShops));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao carregar as compras',
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeShop(shopUid: string) {
    try {
      setRemoveShopLoading(true);
      if (user) {
        const shopRef = doc(db, `users/${user.uid}/shops`, shopUid);
        await deleteDoc(shopRef);

        dispatch(setNextShops(nextShops.filter((shop) => shop.uid != shopUid)));

        toast({
          variant: 'success',
          title: 'Sucesso!',
          description: 'Compra excluída',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao excluir a compra',
      });
    } finally {
      setRemoveShopLoading(false);
    }
  }

  useEffect(() => {
    getShops();
  }, []);

  if (loading)
    return (
      <PrivateLayout>
        <LoadingPage />
      </PrivateLayout>
    );

  return (
    <PrivateLayout>
      <div className="flex flex-col space-y-4 justify-between mt-16">
        <div className="flex flex-col items-center">
          <span className="text-lg text-black font-bold my-3">
            Próximas compras
          </span>
          {nextShops.length ? (
            <section className="space-y-2">
              {nextShops.map((shop) => (
                <ShopCard
                  key={shop.uid}
                  shop={shop}
                  onRemoveShop={removeShop}
                  removeShopLoading={removeShopLoading}
                />
              ))}
            </section>
          ) : (
            <BlankState
              image={shopBlankStateSVG}
              title="Nenhuma próxima compra criada :("
            />
          )}
        </div>
        <CurrentShopCreateDialog onShopCreated={getShops} />
      </div>
    </PrivateLayout>
  );
};

export default NextShopsPage;
