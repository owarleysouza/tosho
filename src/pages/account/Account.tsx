import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { UserContext } from '@/context/commom/UserContext'

import { signOut } from 'firebase/auth'
import auth from '@/lib/firebase'
import { FirebaseError } from "firebase/app"

import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button'


const Account = () => {
  const { user } = useContext(UserContext) 
  const { toast } = useToast()
  const navigate = useNavigate()
  
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
    <div>
      <h1>Conta</h1>
      <p>{user?.email}</p>
      <Button onClick={onLogout}>Sair</Button>
    </div>
  )
}

export default Account
