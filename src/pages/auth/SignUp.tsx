import  SignUpForm from '@/components/auth/SignUpForm'
 
const SignUp = () => {
  return (
    <div className='flex flex-col justify-center items-center min-w-[320px] min-h-fit space-y-6 bg-secondary p-6 rounded-md border border-accent'>
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl font-black'>ToSho</h1> 
        <span className='max-w-[260px] text-center leading-none font-semibold text-gray-500'>Crie sua conta e comece a organizar suas compras </span>
      </div>
      <SignUpForm />
    </div>
  )
}

export default SignUp

