import { useContext } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const user = useContext(UserContext)
  if(!user){
    return <Navigate to="/login" replace />
  } 
    return <Outlet />
  }

export default ProtectedRoute
