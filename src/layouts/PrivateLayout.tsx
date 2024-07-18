import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/components/commom/Header'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import userPNG from "@/assets/images/user.png"


interface LayoutProps {
  children: ReactNode
}

const PrivateLayout = ({children}: LayoutProps) => {
  const navigate = useNavigate()

  return (
    <div>
      <Header>
        <h1 className='text-xl font-black text-primary cursor-pointer' onClick={() => navigate("/")}>ToSho</h1>
        <Avatar className='cursor-pointer' onClick={() => navigate("/account", {replace: true})}>
          <AvatarImage src={userPNG} />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
      </Header>
      <div className="flex flex-col justify-center items-center">
        {children}
      </div>
    </div>

    
  )
}

export default PrivateLayout
