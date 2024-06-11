import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LoginFormSchema } from "@/utils/form"

import { Form } from "@/components/ui/form" 
import FormInput from "../form/FormInput"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { FirebaseError } from "firebase/app"

const LoginForm = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  
   const onSubmit = async (data: z.infer<typeof LoginFormSchema>): Promise<void> => {
    try{
      setLoading(true)
      await signInWithEmailAndPassword(auth, data.email, data.password)      
      navigate("/")
    } catch(error: unknown){
      if(error instanceof FirebaseError){
        let title: string;
        let description: string;
        switch (error.code) {
          case 'auth/invalid-credential':
            title = "Ops! Algo está errado";
            description = "E-mail ou senha inválidos";
            break;
          default:
            title = "Ops! Algo de errado aconteceu";
            description = "Um erro inesperado aconteceu";
            break;
        }
       
        toast({
          variant: "destructive",
          title,
          description
        }) 
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 w-full">
        <FormInput 
          formControl={form.control}
          name="email"
          placeholder="E-mail"
          type="email"
        />
        <FormInput 
          formControl={form.control}
          name="password"
          placeholder="Senha"
          type="password"
        />
 
        <Button disabled={loading} type="submit" className='w-full bg-primary rounded-full'>
        { loading ? 
          (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) 
          : "Entrar" }
        </Button>
      </form>
      
    </Form>
  )
}

export default LoginForm
