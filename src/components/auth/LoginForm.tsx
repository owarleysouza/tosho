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

const LoginForm = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  
   async function onSubmit(data: z.infer<typeof LoginFormSchema>) {
    try{
      setLoading(true)
      await signInWithEmailAndPassword(auth, data.email, data.password)      
      setLoading(false)
      navigate("/")
    } catch(error){
      setLoading(false)
      console.log("error", error)
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
