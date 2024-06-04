import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { Navigate, Outlet } from 'react-router-dom'

const PublicRoute = () => {
  const user = useContext(UserContext)
  if(user){
    return <Navigate to="/" replace />
  } 
    return <Outlet />
}

export default PublicRoute
