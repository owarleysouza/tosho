import { ReactNode } from 'react'

interface HeaderProps{
  children: ReactNode
}

const Header = ({children}: HeaderProps) => {
  return (
    <div className='fixed min-w-full flex flex-row justify-between items-center py-2 px-6 bg-secondary shadow'>
      {children}
    </div>
  )
}

export default Header
