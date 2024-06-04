import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'


const Home = () => {
  const user = useContext(UserContext)
  console.log("user context", user)
  return (
    <div>
      Home
    </div>
  )
}

export default Home

