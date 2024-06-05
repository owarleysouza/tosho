import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { Navigate, Outlet } from 'react-router-dom'
import LoadingPage from '@/pages/commom/LoadingPage'

const PublicRoute = () => {
  const { user, loading } = useContext(UserContext)
  
  if(loading){
    return <LoadingPage />
  }else if(user){
    return <Navigate to="/" replace />
  } 
    return <Outlet />
}

export default PublicRoute
