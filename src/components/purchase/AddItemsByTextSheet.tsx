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
  onProductsAdd: (
    data: z.infer<typeof ProductsCreateFormSchema>,
    form: UseFormReturn<{ text: string }>
  ) => void;
  onOpenChange: (open: boolean) => void;
}

const description =
  'Digite um ou mais produtos, um por linha, no formato Nome, Categoria, Quantidade, Descrição. Apenas o nome é obrigatório — campos do final podem ficar em branco.';

// HU-07 — same free-text form either way; only the surrounding shell
// switches: a centered Dialog on desktop, the bottom Sheet on mobile, same
// split as the "Por template" pill (AddItemsFromTemplateSheet) right next
// to this one in the expanded FAB.
const AddItemsByTextSheet: React.FC<AddItemsByTextSheetProps> = ({
  createProductsLoading,
  onProductsAdd,
  onOpenChange,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

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
        onProductsAdd={onProductsAdd}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange}>
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
    <Sheet onOpenChange={onOpenChange}>
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
