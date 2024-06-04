import { createContext, useState, ReactNode } from 'react'

interface UserContext {
  name?: string
}

interface UserProps {
  children: ReactNode
}

export const UserContext = createContext<UserContext | null>(null); 

const UserProvider = ( {children}: UserProps ) => {
  const [user] = useState({name: "Warley"})

  return (
    <UserContext.Provider value={user}>
      { children }
    </UserContext.Provider>
  )
}

export default UserProvider
