import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RecoveryPasswordFormSchema } from '@/utils/formValidations';

import { Form } from '@/components/ui/form';
import FormInput from '@/components/form/FormInput';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

const RecoveryPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof RecoveryPasswordFormSchema>>({
    resolver: zodResolver(RecoveryPasswordFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (
    data: z.infer<typeof RecoveryPasswordFormSchema>
  ): Promise<void> => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, data.email);
      toast({
        variant: 'success',
        title: 'E-mail de recuperação enviado!',
        description: 'Acesse seu e-mail para redefinir a senha',
      });
      navigate('/');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 w-full">
        <FormInput
          formControl={form.control}
          name="email"
          placeholder="E-mail"
          type="email"
        />

        <Button
          disabled={loading}
          type="submit"
          className="w-full bg-primary rounded-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Recuperar senha'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default RecoveryPasswordForm;
