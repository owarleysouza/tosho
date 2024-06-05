import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import auth from '@/lib/firebase'
import { useNavigate } from 'react-router-dom'


const Home = () => {
  const { user } = useContext(UserContext)
  const navigate = useNavigate()

  const onLogout = async () => {
    try{ 
      await signOut(auth) 
      navigate("/login")
    } catch(error){
      console.log("error", error)
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

