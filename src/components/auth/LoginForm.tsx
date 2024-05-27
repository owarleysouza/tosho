import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { LoginFormSchema } from "@/utils/form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"


const LoginForm = () => {

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  
   function onSubmit(data: z.infer<typeof LoginFormSchema>) {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 w-full">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
             
              <FormControl>
                <Input placeholder="E-mail" type="email" className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
              </FormControl>
              
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
             
              <FormControl>
                <Input placeholder="Senha" type="password" className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
              </FormControl>
              
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        /> 
        <Button type="submit" className='w-full bg-primary rounded-full'>Entrar</Button>
      </form>
    </Form>
  )
}

export default LoginForm
