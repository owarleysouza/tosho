import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { UserContext } from '@/context/commom/UserContext';
import { getActivePurchase } from '@/utils/getActivePurchase';

import PrivateLayout from '@/layouts/PrivateLayout';
import LoadingPage from '@/pages/commom/LoadingPage';
import PurchaseCard from '@/components/purchases/PurchaseCard';
import PurchaseSummaryCards from '@/components/purchases/PurchaseSummaryCards';
import CurrentShopCreateDialog from '@/pages/shop/CurrentShopCreateDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ShopDocument {
  uid: string;
  name: string;
  isDone: boolean;
  scheduledAt?: Timestamp;
  date?: Timestamp; // legacy fallback for shops created before scheduledAt (HU-16)
  completedAt?: Timestamp; // not written yet — HU-14
  itemsCount?: number;
}

const PurchasesPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activePurchase, setActivePurchase] = useState<ShopDocument>();
  const [pendingPurchases, setPendingPurchases] = useState<ShopDocument[]>([]);
  const [completedPurchases, setCompletedPurchases] = useState<ShopDocument[]>([]);

  async function getPurchases() {
    try {
      if (!user) return;

      // Single unfiltered read — itemsCount already lives on each shop
      // document (maintained via increment() at write time), so no
      // per-card products query is needed here.
      const shopsRef = collection(db, 'users', user.uid, 'shops');
      const querySnapshot = await getDocs(shopsRef);
      const allShops: ShopDocument[] = querySnapshot.docs.map((document) => ({
        uid: document.id,
        ...(document.data() as Omit<ShopDocument, 'uid'>),
      }));

      const openShops = allShops.filter((shop) => !shop.isDone);
      const completedShops = allShops.filter((shop) => shop.isDone);

      // RN-06/RN-08 — same helper HU-16 uses to pick the active purchase;
      // everything else still open is "pending".
      const active = getActivePurchase(openShops);

      const pending = openShops
        .filter((shop) => shop.uid !== active?.uid)
        .sort(
          (a, b) =>
            (a.scheduledAt ?? a.date)!.toMillis() -
            (b.scheduledAt ?? b.date)!.toMillis()
        );

      // completedAt doesn't exist yet (HU-14 will write it) — scheduledAt/date
      // is a proxy until then; this sort picks up the real field automatically
      // once it exists, no change needed here.
      const completed = completedShops.sort(
        (a, b) =>
          (b.completedAt ?? b.scheduledAt ?? b.date)!.toMillis() -
          (a.completedAt ?? a.scheduledAt ?? a.date)!.toMillis()
      );

      setActivePurchase(active);
      setPendingPurchases(pending);
      setCompletedPurchases(completed);
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

  useEffect(() => {
    getPurchases();
  }, []);

  if (loading) return <LoadingPage />;

  // Reuses the existing (read-only) shop detail route for now. HU-17 will
  // give pending purchases their own editable detail view — this just wires
  // the click to something that already works instead of nothing.
  function goToShopDetail(shop: ShopDocument) {
    navigate(`/complete-shops/${shop.uid}`, { state: { shop } });
  }

  return (
    <PrivateLayout>
      <div className="w-full">
        {/* Hero — dark green through the summary cards on mobile (print 11);
            plain white header on desktop, where the button sits inline
            instead (print 12). */}
        <div className="bg-tosho-900 pt-16 pb-6 rounded-b-3xl md:bg-transparent md:rounded-none md:pb-0">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between gap-4 pt-6 md:pt-0">
              <div>
                <h1 className="text-xl font-black text-white md:text-foreground">
                  Compras
                </h1>
                <p className="text-sm text-tosho-300 md:text-muted-foreground">
                  Gerencie todas as suas compras
                </p>
              </div>

              <div className="hidden md:block">
                <CurrentShopCreateDialog
                  onShopCreated={getPurchases}
                  trigger={
                    <Button className="rounded-full gap-1.5">
                      <Plus className="h-4 w-4" />
                      Nova compra
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <PurchaseSummaryCards
                inProgressCount={activePurchase ? 1 : 0}
                pendingCount={pendingPurchases.length}
                completedCount={completedPurchases.length}
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 space-y-6">
          {/* Mobile-only dashed CTA (moved above "Em progresso" for easy
              one-thumb reach) — desktop already has the header button above. */}
          <div className="md:hidden">
            <CurrentShopCreateDialog
              onShopCreated={getPurchases}
              trigger={
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary py-3 font-medium text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Nova compra
                </button>
              }
            />
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Em progresso
            </h2>
            {activePurchase ? (
              <PurchaseCard
                name={activePurchase.name}
                scheduledAt={activePurchase.scheduledAt}
                date={activePurchase.date}
                itemsCount={activePurchase.itemsCount}
                status="in-progress"
                onClick={() => navigate('/')}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma compra em progresso
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pendentes
            </h2>
            {pendingPurchases.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingPurchases.map((shop) => (
                  <PurchaseCard
                    key={shop.uid}
                    name={shop.name}
                    scheduledAt={shop.scheduledAt}
                    date={shop.date}
                    itemsCount={shop.itemsCount}
                    status="pending"
                    onClick={() => goToShopDetail(shop)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma compra pendente
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Concluídas
            </h2>
            {completedPurchases.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedPurchases.map((shop) => (
                  <PurchaseCard
                    key={shop.uid}
                    name={shop.name}
                    scheduledAt={shop.scheduledAt}
                    date={shop.date}
                    itemsCount={shop.itemsCount}
                    status="completed"
                    onClick={() => goToShopDetail(shop)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma compra concluída ainda
              </p>
            )}
          </section>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default PurchasesPage;
