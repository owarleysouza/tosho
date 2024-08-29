import { useNavigate } from 'react-router-dom'

import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'

import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { FirebaseError } from "firebase/app"

import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button'
import PrivateLayout from '@/layouts/PrivateLayout'

import { cleanStore } from '@/app/shop/shopSlice';
import { useAppDispatch } from '@/hooks/hooks';


const AccountPage = () => {
  const { user } = useContext(UserContext) 
  const { toast } = useToast()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const onLogout = async () => {
    try{ 
      await signOut(auth) 
      dispatch(cleanStore())
      navigate("/login")
    } catch(error: unknown){
      if(error instanceof FirebaseError){
        const title = "Ops! Algo de errado aconteceu";
        const description = "Um erro inesperado aconteceu";
        
        toast({
          variant: "destructive",
          title,
          description
        }) 
      }
    }
  }

  return (
    <PrivateLayout>
      <div className='h-screen flex flex-col justify-center items-center p-4'>
        <h1>Conta</h1>
        <p>{user?.email}</p>
        <Button className='w-[200px]' onClick={onLogout}>Sair</Button>
      </div>
    </PrivateLayout>
  )
}

export default AccountPage
