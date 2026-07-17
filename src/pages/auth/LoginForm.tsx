import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LoginFormSchema } from "@/utils/formValidations"

import { Form } from "@/components/ui/form"
import FormInput from "@/components/form/FormInput"
import FormPasswordInput from "@/components/form/FormPasswordInput"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock } from "lucide-react"

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { FirebaseError } from "firebase/app"
import {
  clearLockout,
  formatRemainingTime,
  getLockoutStatus,
  registerFailedAttempt,
  type LockoutStatus,
} from "@/utils/loginLockout"

// Codes that mean "this attempt failed" for RN-03's counter — includes older
// Firebase SDK codes and `too-many-requests`, which Firebase itself starts
// returning after repeated failures on the same account, instead of
// `invalid-credential`, once its own throttling kicks in.
const FAILED_ATTEMPT_CODES = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/too-many-requests',
])

const LoginForm = () => {
  const [loading, setLoading] = useState(false)
  const [lockout, setLockout] = useState<LockoutStatus>({ locked: false, remainingMs: 0 })
  const navigate = useNavigate()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const emailValue = form.watch("email")

  useEffect(() => {
    if (!emailValue) {
      setLockout({ locked: false, remainingMs: 0 })
      return
    }

    const update = () => setLockout(getLockoutStatus(emailValue))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [emailValue])

   const onSubmit = async (data: z.infer<typeof LoginFormSchema>): Promise<void> => {
    // RN-03 — reject during lockout without contacting the server
    const currentLockout = getLockoutStatus(data.email)
    if (currentLockout.locked) {
      setLockout(currentLockout)
      return
    }

    try{
      setLoading(true)
      await signInWithEmailAndPassword(auth, data.email, data.password)
      clearLockout(data.email)
      navigate("/")
    } catch(error: unknown){
      if(error instanceof FirebaseError){
        if(FAILED_ATTEMPT_CODES.has(error.code)){
          const updatedLockout = registerFailedAttempt(data.email)
          setLockout(updatedLockout)

          if(!updatedLockout.locked){
            toast({
              variant: "destructive",
              title: "Ops! Algo está errado",
              description: "E-mail ou senha inválidos"
            })
          }
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

        {lockout.locked && (
          <p className="text-xs text-destructive text-center">
            Muitas tentativas incorretas. Tente novamente em {formatRemainingTime(lockout.remainingMs)}.
          </p>
        )}

        <Button disabled={loading || lockout.locked} type="submit" className='w-full bg-primary rounded-full'>
        { loading ?
          (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)
          : "Entrar" }
        </Button>
      </form>

    </Form>
  )
}

export default LoginForm
