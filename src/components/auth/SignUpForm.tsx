import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { SignUpFormSchema } from "@/utils/form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

import { firebaseApp } from "@/lib/firebase"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom"
import FormInput from "../form/FormInput"

const SignUpForm = () => {
  const auth = getAuth(firebaseApp)
  const navigate = useNavigate()

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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user;  

      await updateProfile(auth.currentUser!, {displayName: data.name})

      navigate("/")
    } catch(error){
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

        <Button type="submit" className='w-full bg-primary rounded-full'>Criar conta</Button>
      </form>
    </Form>
  )
}

export default SignUpForm
