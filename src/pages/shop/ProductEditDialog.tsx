import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormInput from '@/components/form/FormInput';
import FormSelect from '@/components/form/FormSelect';

import { Loader2 } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { ProductEditFormSchema } from '@/utils/formValidations';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product } from '@/types';

interface ProductEditDialogProps {
  product: Product;
  onEditProduct: (data: z.infer<typeof ProductEditFormSchema>) => void;
  openProductEditDialog: boolean;
  setOpenProductEditDialog: (open: boolean) => void;
  editProductLoading?: boolean;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  product,
  onEditProduct,
  openProductEditDialog,
  setOpenProductEditDialog,
  editProductLoading,
}) => {
  const form = useForm<z.infer<typeof ProductEditFormSchema>>({
    resolver: zodResolver(ProductEditFormSchema),
    defaultValues: {
      name: product.name,
      quantity: product.quantity,
      category: product.category,
      description: product.description ? product.description : '',
      price: product.price ? product.price : 0,
    },
  });

  async function onSubmit(data: z.infer<typeof ProductEditFormSchema>) {
    await onEditProduct(data);
    setOpenProductEditDialog(false);
  }

  return (
    <Dialog
      open={openProductEditDialog}
      onOpenChange={setOpenProductEditDialog}
    >
      <DialogContent
        className="w-[340px]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>
            Edite um produto digitando seus dados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 w-full"
          >
            <FormInput
              formControl={form.control}
              name="name"
              placeholder="Nome"
              hint="Digite o nome do produto"
            />

            <FormInput
              formControl={form.control}
              name="quantity"
              placeholder="Quantidade"
              hint="Digite a quantidade do produto"
            />

            <FormSelect
              formControl={form.control}
              name="category"
              placeholder="Categoria"
              hint="Selecione a categoria do produto"
            />

            <FormInput
              formControl={form.control}
              name="description"
              placeholder="Descrição"
              hint="Digite a descrição do produto"
            />

            <FormInput
              formControl={form.control}
              name="price"
              placeholder="Preço"
              hint="Digite o preço da unidade do produto"
            />

            <DialogFooter>
              <Button
                disabled={editProductLoading}
                type="submit"
                className="rounded-full px-8"
              >
                {editProductLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Editar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
