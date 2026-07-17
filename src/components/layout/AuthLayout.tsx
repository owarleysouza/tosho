import { ReactNode } from 'react'
import { ShoppingCart } from 'lucide-react'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  subtitle: string
  formTitle: string
  formSubtitle: string
  children: ReactNode
}

const AuthLayout = ({ eyebrow, title, subtitle, formTitle, formSubtitle, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="bg-tosho-900 px-7 pt-12 pb-8 md:w-[clamp(360px,28vw,560px)] md:flex md:items-center md:px-10 md:py-12">
        <div className="md:max-w-[280px]">
          <div className="hidden md:flex items-center gap-2 mb-10">
            <ShoppingCart className="text-tosho-300" size={22} />
            <span className="text-base font-medium text-tosho-hero-fg">ToSho</span>
          </div>

          <span className="block text-[11px] font-medium uppercase tracking-wide text-tosho-300 mb-2">
            {eyebrow}
          </span>
          <h1 className="text-[28px] font-medium leading-tight text-tosho-hero-fg">
            {title}
          </h1>
          <p className="text-[13px] text-tosho-300 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-6 md:mt-0 md:rounded-none md:flex md:items-center md:justify-center px-6 pt-7 pb-8 md:px-10">
        <div className="w-full md:max-w-[360px] mx-auto">
          <div className="hidden md:block mb-6">
            <h2 className="text-xl font-semibold text-foreground">{formTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">{formSubtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
