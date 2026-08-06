import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { db } from '@/lib/firebase';
import { Product, TemplateItem } from '@/types';
import { getTemplateIcon } from '@/utils/templateIcons';
import { dedupeIncomingItems } from '@/utils/dedupeIncomingItems';
import { addProductsToShop } from '@/utils/addProductsToShop';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import StepDots from '@/components/commom/StepDots';
import { useToast } from '@/components/ui/use-toast';

interface TemplateCandidate {
  uid: string;
  name: string;
  description?: string;
  itemsCount?: number;
  icon?: string;
}

interface AddItemsFromTemplateSheetProps {
  userUid?: string;
  shopUid: string;
  // Pending + cart, merged — RN-17 dedup here means "already anywhere in
  // this purchase," not just the visible list.
  existingProducts: Product[];
  onItemsAdded: (addedProducts: Product[]) => void;
  onOpenChange: (open: boolean) => void;
}

// HU-08 — same pick-a-template UI and RN-26 step indicator as HU-29's
// create-purchase step 2, and the same cloning shape (own docs, no pointer
// back to the template — RN-20), but combined with HU-07's dedup (RN-17)
// since this lands on a purchase that may already have items, unlike a
// brand-new one. Adds a second inner screen on top of HU-29's pattern:
// "carregar todos os itens ou selecionar itens específicos" needs the
// chosen template's items broken out individually, not just cloned
// wholesale.
const AddItemsFromTemplateSheet: React.FC<AddItemsFromTemplateSheetProps> = ({
  userUid,
  shopUid,
  existingProducts,
  onItemsAdded,
  onOpenChange,
}) => {
  const { toast } = useToast();

  // Desktop uses a centered Dialog, mobile the bottom Sheet — same
  // Dialog/Drawer-style split already used everywhere else in the app
  // (ShopFormDialog, TemplateFormDialog, ProductEditDialog), just with
  // Sheet instead of Drawer for the mobile side, matching how this
  // specific FAB flow was already presented.
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [pickerStep, setPickerStep] = useState<'template' | 'items'>('template');

  const [templates, setTemplates] = useState<TemplateCandidate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(new Set());
  const [itemsLoading, setItemsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      if (!userUid) return;

      try {
        const templatesRef = collection(db, 'users', userUid, 'templates');
        const snapshot = await getDocs(templatesRef);
        setTemplates(
          snapshot.docs.map((document) => ({
            uid: document.id,
            ...(document.data() as Omit<TemplateCandidate, 'uid'>),
          }))
        );
      } catch (error) {
        // Transient read failure — keep whatever was last known instead of
        // forcing the option back to disabled.
      }
    }

    loadTemplates();
  }, [userUid]);

  // RN-23 — a template can exist with zero items, but there's nothing
  // useful to clone from one, so it's excluded from selection entirely
  // (same treatment as HU-29's create-purchase step 2).
  const templatesWithItems = templates.filter((template) => (template.itemsCount ?? 0) > 0);
  const disabled = templatesWithItems.length === 0;

  // RN-17 — computed once the chosen template's items are loaded: which of
  // them already exist in this purchase (pending or cart), so the
  // checklist can show them disabled instead of letting the user "add"
  // something that's just going to be silently dropped anyway.
  const { newItems: nonDuplicateItems } = dedupeIncomingItems(templateItems, existingProducts);
  const nonDuplicateIds = new Set(nonDuplicateItems.map((item) => item.uid));

  async function goToItemsStep() {
    const selectedId = selectedTemplateId ?? templatesWithItems[0]?.uid;
    if (!userUid || !selectedId) return;

    try {
      setItemsLoading(true);
      const sourceItemsRef = collection(db, `users/${userUid}/templates/${selectedId}/items`);
      const sourceSnapshot = await getDocs(sourceItemsRef);
      const items: TemplateItem[] = sourceSnapshot.docs.map((itemDoc) => ({
        uid: itemDoc.id,
        ...(itemDoc.data() as Omit<TemplateItem, 'uid'>),
      }));

      // Defaults to "carregar todos os itens" — every non-duplicate item
      // starts checked; unchecking any of them is "selecionar itens
      // específicos". Duplicates never enter the set — they're always
      // disabled in the checklist below.
      const { newItems } = dedupeIncomingItems(items, existingProducts);

      setTemplateItems(items);
      setCheckedItemIds(new Set(newItems.map((item) => item.uid)));
      setPickerStep('items');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao carregar os itens do template',
      });
    } finally {
      setItemsLoading(false);
    }
  }

  function toggleItem(uid: string) {
    setCheckedItemIds((current) => {
      const next = new Set(current);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  const allNonDuplicatesChecked =
    nonDuplicateIds.size > 0 &&
    [...nonDuplicateIds].every((uid) => checkedItemIds.has(uid));

  function toggleSelectAll() {
    setCheckedItemIds(allNonDuplicatesChecked ? new Set() : new Set(nonDuplicateIds));
  }

  async function handleAddItems() {
    if (!userUid) return;

    const itemsToAdd = templateItems.filter((item) => checkedItemIds.has(item.uid));

    // RN-17 — items skipped because they were already in the purchase
    // (never enter checkedItemIds, so they can't be in itemsToAdd) still
    // get the same "heads up" toast the free-text flow (HU-07) uses,
    // instead of just quietly not mentioning them.
    const duplicateNames = templateItems
      .filter((item) => !nonDuplicateIds.has(item.uid))
      .map((item) => item.name);

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

    if (!itemsToAdd.length) {
      notifyDuplicates();
      onOpenChange(false);
      return;
    }

    try {
      setSubmitting(true);

      // RN-20/RN-21 — brand-new documents, no pointer back to the
      // template, reset to pending, same shape HU-29 uses.
      const productsToAdd = itemsToAdd.map(({ name, quantity, category, description }) => ({
        name,
        quantity,
        category,
        description,
        isDone: false,
      }));

      const addedProducts = await addProductsToShop(userUid, shopUid, productsToAdd);

      onItemsAdded(addedProducts);
      notifyDuplicates();
      onOpenChange(false);

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Itens adicionados',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu na adição de itens',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function resetPickerState() {
    setPickerStep('template');
    setTemplateItems([]);
    setCheckedItemIds(new Set());
  }

  const title = pickerStep === 'items' ? 'Selecionar itens' : 'Selecionar template';
  const description =
    pickerStep === 'items'
      ? 'Escolha quais itens adicionar — todos vêm marcados por padrão.'
      : 'Escolha o modelo para adicionar itens a esta compra.';

  const titleChildren = (
    <>
      {pickerStep === 'items' && (
        <button
          type="button"
          onClick={() => setPickerStep('template')}
          aria-label="Voltar"
          className="text-tosho-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      {title}
    </>
  );

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border border-border bg-muted px-4 py-2.5 text-xs font-medium text-tosho-900',
        disabled && 'opacity-60'
      )}
    >
      Por template
    </button>
  );

  const bodyContent = (
    <>
      <div className="pt-3">
        <StepDots activeStep={pickerStep === 'items' ? 2 : 1} />
      </div>

      {pickerStep === 'template' ? (
        <>
          <RadioGroup
            value={selectedTemplateId ?? templatesWithItems[0]?.uid}
            onValueChange={setSelectedTemplateId}
            className="gap-2 pt-3"
          >
            {templatesWithItems.map((template) => {
              const Icon = getTemplateIcon(template.icon);
              const isSelected =
                (selectedTemplateId ?? templatesWithItems[0]?.uid) === template.uid;
              const itemsLabel = `${template.itemsCount ?? 0} ${
                template.itemsCount === 1 ? 'item' : 'itens'
              }`;

              return (
                <label
                  key={template.uid}
                  htmlFor={`add-template-${template.uid}`}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                    isSelected ? 'border-primary bg-secondary' : 'border-border bg-background'
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tosho-50 text-tosho-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {template.name}
                    </span>
                    <p className="truncate text-xs text-muted-foreground">
                      {itemsLabel}
                      {template.description ? ` · ${template.description}` : ''}
                    </p>
                  </div>
                  <RadioGroupItem id={`add-template-${template.uid}`} value={template.uid} />
                </label>
              );
            })}
          </RadioGroup>

          <Button
            disabled={itemsLoading || disabled}
            onClick={goToItemsStep}
            className="mt-4 w-full rounded-full"
          >
            {itemsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continuar'}
          </Button>
        </>
      ) : (
        <>
          {nonDuplicateIds.size > 0 && (
            <label className="flex cursor-pointer items-center gap-2 pt-3 text-xs font-medium text-tosho-700">
              <Checkbox
                checked={allNonDuplicatesChecked}
                onCheckedChange={toggleSelectAll}
                className="h-4 w-4 rounded-[4px]"
              />
              Selecionar todos
            </label>
          )}

          <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto">
            {templateItems.map((item) => {
              const isDuplicate = !nonDuplicateIds.has(item.uid);
              const metadata = [item.quantity, item.description].filter(Boolean).join(' · ');

              return (
                <label
                  key={item.uid}
                  htmlFor={`add-item-${item.uid}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3',
                    isDuplicate
                      ? 'cursor-not-allowed border-border bg-muted opacity-60'
                      : 'cursor-pointer border-border bg-background'
                  )}
                >
                  <Checkbox
                    id={`add-item-${item.uid}`}
                    checked={isDuplicate || checkedItemIds.has(item.uid)}
                    disabled={isDuplicate}
                    onCheckedChange={() => toggleItem(item.uid)}
                    className="h-4 w-4 shrink-0 rounded-[4px]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    {(metadata || isDuplicate) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {isDuplicate ? 'Já está na compra' : metadata}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <Button
            disabled={submitting}
            onClick={handleAddItems}
            className="mt-4 w-full rounded-full"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Adicionar itens'}
          </Button>
        </>
      )}
    </>
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) resetPickerState();
    onOpenChange(open);
  };

  if (isDesktop) {
    return (
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{titleChildren}</DialogTitle>
            <DialogDescription className="text-xs">{description}</DialogDescription>
          </DialogHeader>
          {bodyContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="sm:text-center">
          <SheetTitle className="flex items-center gap-2">{titleChildren}</SheetTitle>
          <SheetDescription className="text-xs">{description}</SheetDescription>
        </SheetHeader>
        {bodyContent}
      </SheetContent>
    </Sheet>
  );
};

export default AddItemsFromTemplateSheet;
