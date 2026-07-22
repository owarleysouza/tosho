import { ReactNode } from 'react'

interface HeaderProps{
  children: ReactNode
}

const Header = ({children}: HeaderProps) => {
  return (
    <div className='fixed z-30 min-w-full flex flex-row justify-between items-center py-2 px-6 bg-secondary shadow md:h-[52px] md:bg-tosho-900 md:px-8 md:py-0 md:shadow-none'>
      {children}
    </div>
  )
}

export default Header
