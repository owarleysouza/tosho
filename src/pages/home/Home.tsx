import { useContext, useEffect, useState } from 'react';

import shopBlankStateSVG from '@/assets/images/shop-blank-state.svg';

import PrivateLayout from '@/layouts/PrivateLayout';
import ShopFormDialog from '@/pages/shop/ShopFormDialog';
import LoadingPage from '@/pages/commom/LoadingPage';
import CurrentShopPage from '@/pages/shop/CurrentShopPage';
import { useToast } from '@/components/ui/use-toast';
import BlankState from '@/components/commom/BlankState';

import { UserContext } from '@/context/commom/UserContext';
import { getActivePurchase, ActivePurchaseCandidate } from '@/utils/getActivePurchase';

import { getDocs, collection, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { useSelector, useDispatch } from 'react-redux';
import { addCurrentShop, cleanStore } from '@/app/shop/shopSlice';
import { RootState } from '@/app/store';

const Home = () => {
  const { user } = useContext(UserContext);

  const currentShop = useSelector((state: RootState) => state.shop.currentShop);
  const dispatch = useDispatch();

  const [loadingCurrentShop, setLoadingCurrentShop] = useState(true);

  const { toast } = useToast();

  async function getCurrentShop() {
    // Re-invoked after creating or completing a purchase (not just on
    // mount) — reset to loading each time so a stale/completed shop can't
    // flash on screen while the next active one (or lack thereof) resolves.
    setLoadingCurrentShop(true);
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
      const openShops = querySnapshot.docs.map((document) => {
        const data = document.data() as ActivePurchaseCandidate & DocumentData;
        return { uid: document.id, ...data };
      });

      // RN-06/RN-08 — the active purchase is the pending one whose
      // scheduledAt is closest to now, centralized in getActivePurchase so
      // HU-06 and HU-14 reuse the same rule instead of re-deriving it.
      const activeShop = getActivePurchase(openShops);

      // Always clear first: currentShopPendingProducts/currentShopCartProducts
      // are their own Redux fields, not reset just by swapping currentShop —
      // without this, the previous (possibly just-completed) shop's items
      // stay in state and CurrentShopPage's fetch guard skips loading the
      // new shop's actual products.
      dispatch(cleanStore());

      // RN-07 — no active shop left means either none was ever created or
      // the last one was just completed; either way, Home falls through to
      // the CTA once currentShop stays empty.
      if (activeShop) {
        dispatch(addCurrentShop(activeShop));
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
        // key forces a full remount when the active shop changes (e.g.
        // after completing one) so CurrentShopPage's own product state
        // can't leak across purchases.
        <CurrentShopPage
          key={currentShop.uid}
          shop={currentShop}
          onCompleted={getCurrentShop}
        />
      ) : (
        <section className="h-screen flex flex-col justify-center items-center">
          <BlankState
            image={shopBlankStateSVG}
            title="Nenhuma compra criada ainda :("
          >
            <ShopFormDialog onSaved={getCurrentShop} />
          </BlankState>
        </section>
      )}
    </PrivateLayout>
  );
};

export default Home;
