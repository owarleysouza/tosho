import React from 'react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormTextArea from '@/components/form/FormTextArea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Info, LoaderCircle } from 'lucide-react';

import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { FIXED_CATEGORIES } from '@/utils/categories';

import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface AddProductsFormProps {
  createProductsLoading: boolean;
  onProductsAdd: (
    data: z.infer<typeof ProductsCreateFormSchema>,
    form: UseFormReturn<{ text: string }>
  ) => void;
}

const AddProductsForm: React.FC<AddProductsFormProps> = ({
  createProductsLoading,
  onProductsAdd,
}) => {
  const form = useForm<z.infer<typeof ProductsCreateFormSchema>>({
    resolver: zodResolver(ProductsCreateFormSchema),
    defaultValues: {
      text: '',
    },
  });

  function handleAddProducts(data: z.infer<typeof ProductsCreateFormSchema>) {
    onProductsAdd(data, form);
  }

  return (
    <footer className="w-full max-w-md mx-auto sticky bottom-0 flex justify-center py-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleAddProducts)}
          className="flex flex-col items-center justify-between w-full space-y-2"
        >
          <div className="relative w-full">
            <FormTextArea
              formControl={form.control}
              name="text"
              placeholder="Nome, Categoria, Quantidade, Descrição — um produto por linha."
              className="pr-9"
            />

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Ver categorias disponíveis"
                  className="absolute right-3 top-3 text-tosho-500"
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <p className="mb-2 text-xs font-medium text-foreground">
                  Categorias
                </p>
                <div className="flex flex-wrap gap-1">
                  {FIXED_CATEGORIES.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="sm"
            disabled={createProductsLoading}
            type="submit"
            className="rounded-xl w-full"
          >
            {createProductsLoading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              'Adicionar'
            )}
          </Button>
        </form>
      </Form>
    </footer>
  );
};

export default AddProductsForm;
