import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import auth from '@/lib/firebase'
import { useNavigate } from 'react-router-dom'

import { useToast } from "@/components/ui/use-toast"
import { FirebaseError } from "firebase/app"


const Home = () => {
  const { user } = useContext(UserContext)
  const navigate = useNavigate()
  const { toast } = useToast()

  const onLogout = async () => {
    try{ 
      await signOut(auth) 
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
    <div className='flex flex-row items-center space-x-4'>
      <p>Home - {user?.email}</p>
      <Button onClick={() => navigate("/account")}>Conta</Button>
      <Button onClick={onLogout}>Sair</Button>
    </div>
  )
}

export default Home

