import { User, onAuthStateChanged } from 'firebase/auth';
import { createContext, useState, ReactNode, useEffect } from 'react'

import auth from '@/lib/firebase'

interface UserContext {
  user?: User | null,
  loading?: boolean
}

interface UserProps {
  children: ReactNode
}

export const UserContext = createContext<UserContext>({}); 

const UserProvider = ( {children}: UserProps ) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
   
  useEffect(() => onAuthStateChanged(auth, (user) => {
      if(user){
        setUser(user) 
        setLoading(false)
      }else{
        setUser(null)
        setLoading(false)
      }
    }), []) 

  return (
    <UserContext.Provider value={{user, loading}}>
      { children }
    </UserContext.Provider>
  )
}

export default UserProvider
