import SignUpForm from './SignUpForm'
import { useNavigate } from "react-router-dom"
import { ShoppingCart } from "lucide-react"

const SignUpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="bg-tosho-900 px-7 pt-12 pb-8 md:w-[clamp(360px,28vw,560px)] md:flex md:items-center md:px-10 md:py-12">
        <div className="md:max-w-[280px]">
          <div className="hidden md:flex items-center gap-2 mb-10">
            <ShoppingCart className="text-tosho-300" size={22} />
            <span className="text-base font-medium text-tosho-hero-fg">ToSho</span>
          </div>

          <span className="block text-[11px] font-medium uppercase tracking-wide text-tosho-300 mb-2">
            Criar conta
          </span>
          <h1 className="text-[28px] font-medium leading-tight text-tosho-hero-fg">
            Comece a planejar melhor hoje.
          </h1>
          <p className="text-[13px] text-tosho-300 mt-1">
            Cadastre-se gratuitamente e tenha controle total das suas compras
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-6 md:mt-0 md:rounded-none md:flex md:items-center md:justify-center px-6 pt-7 pb-8 md:px-10">
        <div className="w-full md:max-w-[360px] mx-auto">
          <div className="hidden md:block mb-6">
            <h2 className="text-xl font-semibold text-foreground">Criar conta</h2>
            <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para começar</p>
          </div>

          <SignUpForm />

          <section className="flex flex-row justify-center items-center space-x-1 mt-6">
            <span className="text-sm text-center text-muted-foreground">Já tem uma conta?</span>
            <span onClick={() => navigate("/login")} className="text-sm text-center text-foreground font-medium underline cursor-pointer">
              Entrar
            </span>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
