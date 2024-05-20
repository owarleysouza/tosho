import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().min(2, {
    message: "O e-mail deve ter pelo menos 2 caracteres.",
  }),
  password: z.string().min(2, {
    message: "A senha deve ter pelo menos 2 caracteres.",
  }),
  confirmPassword: z.string().min(2, {
    message: "A senha deve ter pelo menos 2 caracteres.",
  }),
})

export function SignUpForm() {
 
   const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  
   function onSubmit(values: z.infer<typeof formSchema>) {
 
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 w-full">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
             
              <FormControl>
                <Input placeholder="Nome" className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
             
              <FormControl>
                <Input placeholder="E-mail" className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
             
              <FormControl>
                <Input placeholder="Senha" className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
             
              <FormControl>
                <Input placeholder="Confirmar senha" className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className='w-full bg-primary rounded-full'>Criar conta</Button>
      </form>
      <span className='text-sm text-center text-gray-500'>Já possui uma conta? Clique aqui</span>
    </Form>
  )
}
