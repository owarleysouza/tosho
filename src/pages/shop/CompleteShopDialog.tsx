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

import { useForm } from 'react-hook-form';
import { CompleteShopFormSchema } from '@/utils/formValidations';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Loader2 } from 'lucide-react';

interface CompleteShopDialogProps {
  title: string;
  description: string;
  actionLabel: string;
  type: string;
  open: boolean;
  loading?: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: (inputShopPrice: number | undefined) => void;
}

interface ButtonBackgroundType {
  [key: string]: string;
}

const CompleteShopDialog: React.FC<CompleteShopDialogProps> = ({
  title,
  description,
  actionLabel,
  open,
  setOpen,
  loading,
  onConfirm,
  type,
}) => {
  const ButtonBackground: ButtonBackgroundType = {
    success: 'bg-primary',
    danger: 'bg-destructive',
  };

  const form = useForm<z.infer<typeof CompleteShopFormSchema>>({
    resolver: zodResolver(CompleteShopFormSchema),
    defaultValues: {
      totalPrice: 0,
    },
  });

  function onSubmit(data: z.infer<typeof CompleteShopFormSchema>) {
    onConfirm(data.totalPrice);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[340px]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 w-full"
          >
            <FormInput
              formControl={form.control}
              name="totalPrice"
              hint="Digite o valor total da compra ou deixe vazio para usar o valor calculado no carrinho"
              placeholder="Preço"
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="hover:bg-transparent"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={loading}
                type="submit"
                className={`${ButtonBackground[type]} rounded-full px-8`}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  actionLabel
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteShopDialog;
