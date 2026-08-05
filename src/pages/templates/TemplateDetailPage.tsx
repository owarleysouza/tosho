import { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Pencil, Plus, Search } from 'lucide-react';
import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';

import { db } from '@/lib/firebase';
import { UserContext } from '@/context/commom/UserContext';
import { TemplateItem } from '@/types';
import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { handleProductsInput } from '@/utils/handleProductsInput';
import { dedupeIncomingItems } from '@/utils/dedupeIncomingItems';
import { addItemsToTemplate } from '@/utils/addItemsToTemplate';
import { getVisibleItems } from '@/utils/itemVisibility';

import PrivateLayout from '@/layouts/PrivateLayout';
import LoadingPage from '@/pages/commom/LoadingPage';
import BlankState from '@/components/commom/BlankState';
import TemplateItemList from '@/components/templates/TemplateItemList';
import TemplateFormDialog from '@/pages/templates/TemplateFormDialog';
import ProductFormFooter from '@/components/form/ProductFormFooter';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import productsBlankStateSVG from '@/assets/images/products-blank-state.svg';

interface TemplateDocument {
  uid: string;
  name: string;
  description?: string;
  itemsCount?: number;
  icon?: string;
  createdAt?: Timestamp;
}

// HU-23-26 — the screen "dentro de um template" (print 15). Fetches the
// template doc and its items subcollection directly by id, same convention
// as PurchaseDetailPage, so a refresh or a direct link never depends on
// router state carried over from the list.
const TemplateDetailPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TemplateDocument | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [addItemsLoading, setAddItemsLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Re-reads just the template doc (name/description/icon/itemsCount) —
  // shared by the initial load and by the edit dialog's onSaved, so a name
  // change (HU-27) is reflected in this header right away instead of
  // needing a manual refresh.
  async function refetchTemplateMeta(templateUid: string) {
    const templateSnap = await getDoc(doc(db, `users/${user!.uid}/templates`, templateUid));
    if (!templateSnap.exists()) {
      setTemplate(null);
      return;
    }
    setTemplate({ uid: templateSnap.id, ...templateSnap.data() } as TemplateDocument);
  }

  useEffect(() => {
    async function loadTemplate() {
      try {
        if (!user || !templateId) return;

        await refetchTemplateMeta(templateId);

        const itemsSnapshot = await getDocs(
          collection(db, `users/${user.uid}/templates/${templateId}/items`)
        );
        const templateItems: TemplateItem[] = itemsSnapshot.docs.map((document) => ({
          uid: document.id,
          ...(document.data() as Omit<TemplateItem, 'uid'>),
        }));

        setItems(templateItems);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo de errado aconteceu',
          description: 'Um erro inesperado aconteceu ao carregar o template',
        });
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, user]);

  async function onSubmitItems(
    data: z.infer<typeof ProductsCreateFormSchema>,
    form: UseFormReturn<{ text: string }>
  ): Promise<void> {
    // Same category-spelling reuse as HU-07: pass what's already in the
    // template so a custom category typed with different case/accent
    // collapses into the existing group instead of forking a new one.
    const existingCategories = items.map((item) => item.category);
    const parsedItems = handleProductsInput(data.text, existingCategories);

    if (parsedItems.length > 30) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Limite de itens a adicionar por vez atingido',
      });

      return;
    }

    // RN-17 — same rule as the purchase, applied to the template's own item
    // list instead.
    const { newItems, duplicateNames } = dedupeIncomingItems(parsedItems, items);

    function notifyDuplicates() {
      if (!duplicateNames.length) return;
      toast({
        variant: 'warning',
        title: 'Já estava no template',
        description:
          duplicateNames.length === 1
            ? `"${duplicateNames[0]}" já estava no template e não foi adicionado de novo.`
            : `Já estavam no template e não foram adicionados de novo: ${duplicateNames.join(', ')}.`,
      });
    }

    if (!newItems.length) {
      notifyDuplicates();
      form.reset();
      return;
    }

    try {
      setAddItemsLoading(true);
      if (user && templateId) {
        const addedItems = await addItemsToTemplate(user.uid, templateId, newItems);

        setItems((current) => current.concat(addedItems));

        form.reset();
        notifyDuplicates();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu na adição de itens',
      });
    } finally {
      setAddItemsLoading(false);
    }
  }

  // HU-25 — TemplateItemEditDialog already wrote to Firestore; this just
  // merges the result into local state (no Redux for templates), same as
  // onSubmitItems does for additions above.
  function onItemUpdated(updatedItem: TemplateItem) {
    setItems((current) =>
      current.map((item) => (item.uid === updatedItem.uid ? updatedItem : item))
    );
  }

  // HU-26 — useUndoableDelete calls this immediately (RN-24), before the
  // Firestore delete is even scheduled. Position doesn't matter for
  // restore: getSortedCategoryGroups re-derives category/alphabetical
  // placement from the flat array on every render, so a plain filter/concat
  // pair is enough.
  function onItemRemoved(uid: string) {
    setItems((current) => current.filter((item) => item.uid !== uid));
  }

  function onItemRestored(item: TemplateItem) {
    setItems((current) => current.concat(item));
  }

  if (loading) {
    return (
      <PrivateLayout>
        <LoadingPage />
      </PrivateLayout>
    );
  }

  // Bad/stale id (deleted template, typo'd URL) — bounce to the manager
  // instead of rendering a broken screen, same guard as PurchaseDetailPage.
  if (!template) {
    return <Navigate to="/templates" replace />;
  }

  // Derived from the fully-loaded items array, not the cached itemsCount
  // field — same "never stored" principle as RN-09's purchase progress.
  // Everything this screen adds/removes/undoes is already reflected in
  // `items`, so this can't drift the way a separately-tracked counter
  // would. The Firestore itemsCount field still exists and is still kept
  // in sync (addItemsToTemplate/onCommit below) — it's just not what this
  // header reads anymore, since TemplatesPage's cards are the only
  // consumer that actually needs a denormalized count (they don't load
  // the items subcollection).
  const itemsLabel = `${items.length} ${items.length === 1 ? 'item' : 'itens'}`;

  // HU-24 — same pure filter HU-12 already uses on the purchase's item
  // list, applied here to the template's. Category-group headings for
  // categories with no match disappear on their own once
  // getSortedCategoryGroups runs on the filtered result.
  const visibleItems = getVisibleItems(items, { searchTerm });

  const addItemsTrigger = (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Adicionar itens"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <Plus className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="sm:text-center">
          <SheetTitle>Adicionar itens</SheetTitle>
          <SheetDescription className="text-xs">
            Digite um ou mais produtos, um por linha, no formato Nome,
            Categoria, Quantidade, Descrição. Apenas o nome é obrigatório —
            campos do final podem ficar em branco.
          </SheetDescription>
        </SheetHeader>
        <div className="flex justify-center pt-3">
          <ProductFormFooter
            createProductsLoading={addItemsLoading}
            onProductsAdd={onSubmitItems}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <PrivateLayout>
      <div className="w-full">
        <div className="bg-tosho-900 px-5 pb-5 pt-16 md:px-8 md:pb-8 md:pt-16">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              aria-label="Voltar"
              className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tosho-hero-fg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Editar template"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tosho-hero-fg"
            >
              <Pencil className="h-[18px] w-[18px]" />
            </button>
          </div>

          <h1 className="text-xl font-black text-tosho-hero-fg md:text-2xl">
            {template.name}
          </h1>
          <p className="mt-[3px] text-[13px] text-tosho-300">
            {template.description ? `${template.description} · ` : ''}
            {itemsLabel}
          </p>
        </div>

        <section className="mx-auto flex w-full max-w-3xl flex-col items-center space-y-3 px-5 py-4 md:px-8 md:py-6">
          {items.length > 0 && (
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-tosho-500" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar item..."
                className="rounded-xl border-border bg-muted pl-10 placeholder:text-tosho-text-3"
              />
            </div>
          )}

          {!items.length ? (
            <BlankState
              image={productsBlankStateSVG}
              title="Nenhum item nesse template ainda"
            />
          ) : visibleItems.length ? (
            <TemplateItemList
              items={visibleItems}
              templateUid={template.uid}
              existingCategories={items.map((item) => item.category)}
              onItemUpdated={onItemUpdated}
              onItemRemoved={onItemRemoved}
              onItemRestored={onItemRestored}
            />
          ) : (
            <BlankState image={productsBlankStateSVG} title="Nenhum item encontrado" />
          )}

          <div className="fixed bottom-20 right-5 z-40 md:static md:flex md:w-full md:justify-end">
            {addItemsTrigger}
          </div>
        </section>
      </div>

      <TemplateFormDialog
        template={template}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => {
          setEditOpen(false);
          if (templateId) refetchTemplateMeta(templateId);
        }}
      />
    </PrivateLayout>
  );
};

export default TemplateDetailPage;
