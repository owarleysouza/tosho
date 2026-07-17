import SignUpForm from './SignUpForm'
import { useNavigate } from "react-router-dom"
import AuthLayout from '@/components/layout/AuthLayout'

const SignUpPage = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout
      eyebrow="Criar conta"
      title="Comece a planejar melhor hoje."
      subtitle="Cadastre-se gratuitamente e tenha controle total das suas compras"
      formTitle="Criar conta"
      formSubtitle="Preencha seus dados para começar"
    >
      <SignUpForm />

      <section className="flex flex-row justify-center items-center space-x-1 mt-6">
        <span className="text-sm text-center text-muted-foreground">Já tem uma conta?</span>
        <span onClick={() => navigate("/login")} className="text-sm text-center text-foreground font-medium underline cursor-pointer">
          Entrar
        </span>
      </section>
    </AuthLayout>
  )
}

export default SignUpPage
