import { useContext, useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import ItemEditFormFields from '@/components/form/ItemEditFormFields';
import { Loader2 } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { ProductEditFormSchema } from '@/utils/formValidations';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { UserContext } from '@/context/commom/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { TemplateItem } from '@/types';
import { FIXED_CATEGORIES, normalizeCategory, sortCategoryNames } from '@/utils/categories';

interface TemplateItemEditDialogProps {
  item: TemplateItem;
  templateUid: string;
  // RN-13 — categories already in use across the whole template (not just
  // the currently-filtered/visible items), so an in-progress search never
  // hides a custom category from the select.
  existingCategories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Same convention as HU-23's addItemsToTemplate call site: templates have
  // no Redux slice, so the caller (TemplateDetailPage) owns the item list
  // and merges the update itself.
  onSaved: (updatedItem: TemplateItem) => void;
}

function buildDefaultValues(item: TemplateItem) {
  return {
    name: item.name,
    quantity: item.quantity ?? '',
    category: item.category,
    description: item.description ?? '',
  };
}

// HU-25 — same form as ProductEditDialog (HU-10): same schema, same fields,
// same quantity-as-string handling. Only the destination differs — this
// writes to a template's items subcollection and has no isDone to branch
// on, since TemplateItem has no completion state at all.
const TemplateItemEditDialog: React.FC<TemplateItemEditDialogProps> = ({
  item,
  templateUid,
  existingCategories,
  open,
  onOpenChange,
  onSaved,
}) => {
  const { user } = useContext(UserContext);
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof ProductEditFormSchema>>({
    resolver: zodResolver(ProductEditFormSchema),
    defaultValues: buildDefaultValues(item),
  });

  // Same react-hook-form gotcha as ProductEditDialog: defaultValues only
  // apply at mount, and this dialog stays mounted between opens — re-sync
  // every time it opens instead of showing whatever item it first saw.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(item));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  // RN-13 — the select offers the fixed 16 plus whatever custom categories
  // are already in use in this template, so an item with a custom category
  // never shows up blank and gets silently overwritten on save.
  const categoryOptions = sortCategoryNames(
    Array.from(new Set([...FIXED_CATEGORIES, ...existingCategories]))
  );

  async function onSubmit(data: z.infer<typeof ProductEditFormSchema>) {
    try {
      setLoading(true);
      if (!user) return;

      const itemRef = doc(
        db,
        `users/${user.uid}/templates/${templateUid}/items`,
        item.uid
      );

      // Empty string, not undefined — updateDoc needs an explicit value to
      // actually clear a previously-set field; an omitted/undefined one
      // just leaves the old value untouched in Firestore.
      const updatedFields = {
        name: data.name,
        quantity: data.quantity || '',
        // RN-15 — no category chosen falls back to "Outros", same helper
        // HU-07/HU-23 already use. Not a parallel validation.
        category: normalizeCategory(data.category || ''),
        description: data.description || '',
      };

      await updateDoc(itemRef, updatedFields);

      onSaved({ ...item, ...updatedFields });

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Item editado',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao editar o item',
      });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
        <ItemEditFormFields formControl={form.control} categoryOptions={categoryOptions} />

        <Button disabled={loading} type="submit" className="w-full rounded-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </form>
    </Form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[380px]"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
            <DialogDescription>Atualize os dados do item.</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Editar item</DrawerTitle>
          <DrawerDescription>Atualize os dados do item.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">{formContent}</div>
      </DrawerContent>
    </Drawer>
  );
};

export default TemplateItemEditDialog;
