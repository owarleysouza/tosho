import { useContext, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'

import { UserContext } from '@/context/commom/UserContext'
import { auth } from '@/lib/firebase'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'

import PublicLayout from '@/layouts/PublicLayout'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

const VerifyEmailPage = () => {
  const { user, loading } = useContext(UserContext)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [sending, setSending] = useState(false)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.emailVerified) return <Navigate to="/" replace />

  const onResend = async () => {
    try {
      setSending(true)
      await sendEmailVerification(user)
      toast({ title: 'E-mail reenviado', description: `Verifique a caixa de entrada de ${user.email}` })
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo está errado',
          description: 'Não foi possível reenviar o e-mail agora. Tente novamente em instantes.',
        })
      }
    } finally {
      setSending(false)
    }
  }

  const onLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <PublicLayout>
      <div className="w-[320px] min-h-fit space-y-4 bg-secondary p-6 rounded-md border border-accent shadow text-center">
        <div className="flex flex-col items-center space-y-2">
          <MailCheck className="text-tosho-700" size={36} />
          <h1 className="text-xl font-semibold text-tosho-900">Confirme seu e-mail</h1>
          <p className="text-sm text-tosho-text-3">
            Enviamos um link de confirmação para <span className="font-medium text-tosho-900">{user.email}</span>.
            Acesse sua caixa de entrada e clique no link para liberar o acesso ao ToSho.
          </p>
        </div>

        <Button disabled={sending} onClick={onResend} className="w-full rounded-full">
          {sending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
        </Button>

        <span onClick={onLogout} className="block text-sm text-tosho-text-3 underline cursor-pointer">
          Sair
        </span>
      </div>
    </PublicLayout>
  )
}

export default VerifyEmailPage
