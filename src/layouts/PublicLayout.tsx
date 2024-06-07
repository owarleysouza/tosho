import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const PublicLayout = ({children}: LayoutProps) => {
  return (
    <div className='min-h-screen flex flex-col justify-center items-center'>
      {children}
    </div>
  )
}

export default PublicLayout
