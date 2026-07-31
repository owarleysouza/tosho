import { useContext, useEffect, useState } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { UserContext } from '@/context/commom/UserContext';

import PrivateLayout from '@/layouts/PrivateLayout';
import LoadingPage from '@/pages/commom/LoadingPage';
import BlankState from '@/components/commom/BlankState';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateFormDialog from '@/pages/templates/TemplateFormDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import shopBlankStateSVG from '@/assets/images/shop-blank-state.svg';

interface TemplateDocument {
  uid: string;
  name: string;
  description?: string;
  itemsCount?: number;
  icon?: string;
  createdAt?: Timestamp;
}

const TemplatesPage = () => {
  const { user } = useContext(UserContext);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateDocument[]>([]);

  async function getTemplates() {
    try {
      if (!user) return;

      const templatesRef = collection(db, 'users', user.uid, 'templates');
      const querySnapshot = await getDocs(templatesRef);
      const allTemplates: TemplateDocument[] = querySnapshot.docs.map((document) => ({
        uid: document.id,
        ...(document.data() as Omit<TemplateDocument, 'uid'>),
      }));

      // HU-21 — most recently created first.
      const sorted = allTemplates.sort(
        (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
      );

      setTemplates(sorted);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao carregar os templates',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTemplates();
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <PrivateLayout>
      <div className="w-full">
        {/* Hero — dark green on mobile (print 13, "+" inline in the header);
            plain white header on desktop, where the button is a full pill
            instead (print 14). */}
        <div className="bg-tosho-900 pt-16 pb-6 rounded-b-3xl md:bg-transparent md:rounded-none md:pb-0">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between gap-4 pt-6 md:pt-0">
              <div>
                <h1 className="text-xl font-black text-white md:text-foreground">
                  Templates
                </h1>
                <p className="text-sm text-tosho-300 md:text-muted-foreground">
                  Seus modelos de compra
                </p>
              </div>

              <div className="md:hidden">
                <TemplateFormDialog
                  onSaved={getTemplates}
                  trigger={
                    <button
                      type="button"
                      aria-label="Novo template"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  }
                />
              </div>

              <div className="hidden md:block">
                <TemplateFormDialog
                  onSaved={getTemplates}
                  trigger={
                    <Button className="rounded-full gap-1.5">
                      <Plus className="h-4 w-4" />
                      Novo template
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          {templates.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.uid} template={template} />
              ))}

              {/* Trailing CTA card, desktop only (print 14) — mobile already
                  has the "+" in the hero. */}
              <div className="hidden md:block">
                <TemplateFormDialog
                  onSaved={getTemplates}
                  trigger={
                    <button
                      type="button"
                      className="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      Novo template
                    </button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center pt-8">
              <BlankState
                image={shopBlankStateSVG}
                title="Nenhum template criado ainda"
              >
                <TemplateFormDialog onSaved={getTemplates} />
              </BlankState>
            </div>
          )}
        </div>
      </div>
    </PrivateLayout>
  );
};

export default TemplatesPage;
