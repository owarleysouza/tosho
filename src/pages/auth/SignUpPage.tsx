import  SignUpForm from '@/components/auth/SignUpForm'
import { useNavigate } from "react-router-dom"
 
const SignUp = () => {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col justify-center items-center min-w-[320px] min-h-fit space-y-6 bg-secondary p-6 rounded-md border border-accent shadow'>
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl font-black'>ToSho</h1> 
        <span className='max-w-[260px] text-center leading-none font-semibold text-gray-500'>Crie sua conta e comece a organizar suas compras </span>
      </div>
      <SignUpForm />
      <section className='flex flex-row items-center space-x-1'>
        <span className='text-sm text-center text-gray-500 '>Já possui uma conta? </span>
        <span onClick={() =>  navigate("/login")} className='text-sm text-center text-gray-500 underline cursor-pointer'>Clique aqui </span>
      </section>
    </div>
  )
}

export default SignUp

