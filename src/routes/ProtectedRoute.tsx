import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { Navigate, Outlet } from 'react-router-dom'
import LoadingPage from '@/pages/commom/LoadingPage'

const ProtectedRoute = () => {
  const { user, loading } = useContext(UserContext)
  
  if(loading){
    return <LoadingPage />
  }else if(!user){
    return <Navigate to="/login" replace />
  }else if(!user.emailVerified){
    // RN-01 — email confirmation required before accessing protected pages
    return <Navigate to="/verify-email" replace />
  }
    return <Outlet />
  }

export default ProtectedRoute
