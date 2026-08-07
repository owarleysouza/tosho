import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { ProductsCreateFormSchema } from '@/utils/formValidations';
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
import ProductFormFooter from '@/components/form/ProductFormFooter';

interface AddItemsByTextSheetProps {
  createProductsLoading: boolean;
  // Third arg lets the caller close this sheet once its own submission
  // logic actually succeeds (added, or everything was a RN-17 duplicate) —
  // not called from the catch/error path, so a failed submit leaves the
  // sheet open for the user to retry instead of silently discarding it.
  onProductsAdd: (
    data: z.infer<typeof ProductsCreateFormSchema>,
    form: UseFormReturn<{ text: string }>,
    closeSheet: () => void
  ) => void;
  onOpenChange: (open: boolean) => void;
}

const description =
  'Digite um ou mais produtos, um por linha, no formato Nome, Categoria, Quantidade, Descrição. Apenas o nome é obrigatório — campos do final podem ficar em branco.';

// HU-07 — same free-text form either way; only the surrounding shell
// switches: a centered Dialog on desktop, the bottom Sheet on mobile, same
// split as the "Por template" pill (AddItemsFromTemplateSheet) right next
// to this one in the expanded FAB.
//
// Open state is controlled here (not left to Radix's own uncontrolled
// default) specifically so a successful submit can close it — otherwise
// there's no hook to call after ProductFormFooter's fire-and-forget
// onProductsAdd resolves.
const AddItemsByTextSheet: React.FC<AddItemsByTextSheetProps> = ({
  createProductsLoading,
  onProductsAdd,
  onOpenChange,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    onOpenChange(nextOpen);
  }

  const trigger = (
    <button
      type="button"
      className="shrink-0 whitespace-nowrap rounded-full border border-border bg-muted px-4 py-2.5 text-xs font-medium text-tosho-900"
    >
      Por texto livre
    </button>
  );

  const form = (
    <div className="flex justify-center pt-3">
      <ProductFormFooter
        createProductsLoading={createProductsLoading}
        onProductsAdd={(data, formInstance) =>
          onProductsAdd(data, formInstance, () => handleOpenChange(false))
        }
      />
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="w-[420px]">
          <DialogHeader>
            <DialogTitle>Adicionar itens</DialogTitle>
            <DialogDescription className="text-xs">{description}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="sm:text-center">
          <SheetTitle>Adicionar itens</SheetTitle>
          <SheetDescription className="text-xs">{description}</SheetDescription>
        </SheetHeader>
        {form}
      </SheetContent>
    </Sheet>
  );
};

export default AddItemsByTextSheet;
