import React from 'react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormTextArea from '@/components/form/FormTextArea';

import { LoaderCircle } from 'lucide-react';

import { ProductsCreateFormSchema } from '@/utils/formValidations';

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
    <footer className="w-80 sticky bottom-0 flex justify-center py-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleAddProducts)}
          className="flex flex-col items-center justify-between w-full space-y-2"
        >
          <div className="w-full">
            <FormTextArea
              formControl={form.control}
              name="text"
              placeholder="Digite um ou mais produtos, um por linha, no formato: Nome, Quantidade, Descrição. Apenas o nome é obrigatório."
            />
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
