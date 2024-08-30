import LoginForm from './LoginForm' 
import PublicLayout from '@/layouts/PublicLayout';
import { useNavigate } from "react-router-dom"

const Login = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className='flex flex-col justify-center items-center w-[320px] min-h-[438px] space-y-8 bg-secondary p-6 rounded-md border border-accent shadow'>
        <div className='flex flex-col items-center'>
          <h1 className='text-3xl font-black text-primary'>ToSho</h1> 
          <span className='max-w-[180px] text-center leading-none font-semibold text-gray-500'>Entre na sua conta e organize suas compras </span>
        </div>
        <LoginForm />
        <section className='flex flex-row items-center space-x-1'>
          <span className='text-sm text-center text-gray-500 '>Não possui uma conta? </span>
          <span onClick={() =>  navigate("/signUp")} className='text-sm text-center text-gray-500 underline cursor-pointer'>Clique aqui </span>
        </section>
      </div>
    </PublicLayout>
  )
}

export default Login
