import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

import { SignUpFormSchema } from "@/utils/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import FormInput from "../form/FormInput"

import  auth  from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const SignUpForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)  

  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  
   async function onSubmit(data: z.infer<typeof SignUpFormSchema>) { 
    try{
      setLoading(true)
      await createUserWithEmailAndPassword(auth, data.email, data.password)
   
      await updateProfile(auth.currentUser!, {displayName: data.name})
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
          name="name"
          placeholder="Nome"/>
        
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

        <FormInput
          formControl={form.control}
          name="confirmPassword"
          placeholder="Confirmar Senha"
          type="password"
        /> 

        <Button disabled={loading} type="submit" className='w-full bg-primary rounded-full'>
        { loading ? 
          (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) 
          : "Criar conta" }
        </Button>
      </form>
    </Form>
  )
}

export default SignUpForm
