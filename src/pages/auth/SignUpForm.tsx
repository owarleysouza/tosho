import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

import { SignUpFormSchema } from "@/utils/formValidations"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Loader2, User, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import FormInput from "@/components/form/FormInput"
import FormPasswordInput from "@/components/form/FormPasswordInput"
import { useToast } from "@/components/ui/use-toast"

import { FirebaseError } from "firebase/app"
import { auth, db }  from "@/lib/firebase"
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";

const SignUpForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)  
  const { toast } = useToast()

  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })


   const onSubmit = async (data: z.infer<typeof SignUpFormSchema>) => {
    try{
      setLoading(true)
      await createUserWithEmailAndPassword(auth, data.email, data.password)
      await updateProfile(auth.currentUser!, {displayName: data.name})
      if(auth.currentUser){
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          name: data.name,
          email: data.email
        })
        await sendEmailVerification(auth.currentUser)
      }
      navigate("/verify-email")
    } catch(error: unknown){
      if(error instanceof FirebaseError){
        if(error.code === 'auth/email-already-in-use'){
          form.setError("email", { message: "Este e-mail já possui uma conta" })
        } else {
          toast({
            variant: "destructive",
            title: "Ops! Algo de errado aconteceu",
            description: "Um erro inesperado aconteceu"
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3 w-full">
        <FormInput
          formControl={form.control}
          name="name"
          label="Nome"
          placeholder="João Silva"
          icon={<User size={17} />}
        />

        <FormInput
          formControl={form.control}
          name="email"
          label="E-mail"
          placeholder="joao@email.com"
          type="email"
          icon={<Mail size={17} />}
        />

        <FormPasswordInput
          formControl={form.control}
          name="password"
          label="Senha"
          placeholder="••••••••"
          icon={<Lock size={17} />}
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
