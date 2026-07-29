import { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { UserContext } from '@/context/commom/UserContext';
import { getActivePurchase, ActivePurchaseCandidate } from '@/utils/getActivePurchase';

import PrivateLayout from '@/layouts/PrivateLayout';
import LoadingPage from '@/pages/commom/LoadingPage';
import CurrentShopPage from '@/pages/shop/CurrentShopPage';
import { useToast } from '@/components/ui/use-toast';

import { useDispatch } from 'react-redux';
import { addCurrentShop, cleanStore } from '@/app/shop/shopSlice';

// HU-17 — one screen, reused for both modes: a pending purchase opens fully
// editable (same experience as the active purchase), a completed one opens
// read-only. Fetches the shop doc directly by id instead of trusting router
// state, so a refresh or a direct link never bounces you back to /purchases.
const PurchaseDetailPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { shopId } = useParams();
  const { toast } = useToast();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<DocumentData | null>(null);
  const [isActivePurchase, setIsActivePurchase] = useState(false);

  useEffect(() => {
    async function loadShop() {
      try {
        if (!user || !shopId) return;

        const shopSnap = await getDoc(doc(db, `users/${user.uid}/shops`, shopId));

        if (!shopSnap.exists()) {
          setShop(null);
          return;
        }

        const shopData: DocumentData = { uid: shopSnap.id, ...shopSnap.data() };

        // RN-06/RN-07 — visualizar ≠ ativar: independently re-derive which
        // purchase is active (never trust a cached value) so that opening
        // the one that's currently active redirects to Home instead of
        // rendering a second, parallel copy of the same editable screen.
        if (!shopData.isDone) {
          const openShopsRef = query(
            collection(db, 'users', user.uid, 'shops'),
            where('isDone', '==', false)
          );
          const openSnapshot = await getDocs(openShopsRef);
          const openShops = openSnapshot.docs.map((document) => {
            const data = document.data() as ActivePurchaseCandidate & DocumentData;
            return { uid: document.id, ...data };
          });
          const active = getActivePurchase(openShops);

          if (active?.uid === shopData.uid) {
            setIsActivePurchase(true);
            return;
          }
        }

        // CurrentShopPage and its children (ProductCard, ProductEditDialog,
        // CompleteShopBar) all read/write this same global Redux slice
        // rather than the shop prop directly — Home leaves whatever it last
        // loaded there. Without resetting it here, CurrentShopPage's own
        // fetch guard sees non-empty arrays from a *different* shop and
        // skips loading this one's real products, showing stale items until
        // a hard refresh.
        dispatch(cleanStore());
        dispatch(addCurrentShop(shopData));

        setShop(shopData);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo de errado aconteceu',
          description: 'Um erro inesperado aconteceu ao carregar a compra',
        });
      } finally {
        setLoading(false);
      }
    }

    loadShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, user]);

  if (loading) {
    return (
      <PrivateLayout>
        <LoadingPage />
      </PrivateLayout>
    );
  }

  if (isActivePurchase) {
    return <Navigate to="/" replace />;
  }

  // Bad/stale id (deleted purchase, typo'd URL) — bounce to the manager
  // instead of rendering a broken screen.
  if (!shop) {
    return <Navigate to="/purchases" replace />;
  }

  return (
    <PrivateLayout>
      {/* key forces a full remount if the viewed shop changes without an
          intervening unmount (e.g. navigating directly between two detail
          URLs) — same guard used in Home.tsx for the same reason. */}
      <CurrentShopPage
        key={shop.uid}
        shop={shop}
        readOnly={shop.isDone}
        onBack={() => navigate('/purchases')}
      />
    </PrivateLayout>
  );
};

export default PurchaseDetailPage;
