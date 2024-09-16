import { useContext, useEffect, useState } from 'react';

import shopBlankStateSVG from '@/assets/images/shop-blank-state.svg';

import PrivateLayout from '@/layouts/PrivateLayout';
import CurrentShopCreateDialog from '@/pages/shop/CurrentShopCreateDialog';
import LoadingPage from '@/pages/commom/LoadingPage';
import CurrentShopPage from '@/pages/shop/CurrentShopPage';
import { useToast } from '@/components/ui/use-toast';
import BlankState from '@/components/commom/BlankState';

import { UserContext } from '@/context/commom/UserContext';

import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { useSelector, useDispatch } from 'react-redux';
import { addCurrentShop } from '@/app/shop/shopSlice';
import { RootState } from '@/app/store';

const Home = () => {
  const { user } = useContext(UserContext);

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);
  const dispatch = useDispatch();

  const [loadingCurrentShop, setLoadingCurrentShop] = useState(true);

  const { toast } = useToast();

  async function getCurrentShop() {
    try {
      if (!user || !Object.keys(user).length) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo de errado aconteceu',
          description: 'Um erro inesperado aconteceu ao carregar o usuário',
        });
        return;
      }
      const openShopsRef = query(
        collection(db, 'users', user.uid, 'shops'),
        where('isDone', '==', false)
      );
      const querySnapshot = await getDocs(openShopsRef);
      const currentShopDocument = querySnapshot.docs[0];

      if (currentShopDocument) {
        const shop = {
          uid: currentShopDocument.id,
          ...currentShopDocument.data(),
        };
        dispatch(addCurrentShop(shop));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao carregar a compra',
      });
    } finally {
      setLoadingCurrentShop(false);
    }
  }

  useEffect(() => {
    getCurrentShop();
  }, []);

  if (loadingCurrentShop) return <LoadingPage />;

  return (
    <PrivateLayout>
      {Object.keys(currentShop).length ? (
        <CurrentShopPage shop={currentShop} />
      ) : (
        <section className="h-screen flex flex-col justify-center items-center">
          <BlankState
            image={shopBlankStateSVG}
            title="Nenhuma compra criada ainda :("
          >
            <CurrentShopCreateDialog onShopCreated={getCurrentShop} />
          </BlankState>
        </section>
      )}
    </PrivateLayout>
  );
};

export default Home;
