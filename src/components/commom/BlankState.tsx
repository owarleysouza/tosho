import { ReactNode } from 'react'

interface BlankStateProps {
  children: ReactNode,
  image: string,
  title: string,
  subtitle?: string
}

const BlankState = ({children, image, title, subtitle}: BlankStateProps) => {
  return (
    <div className='h-screen flex flex-col justify-center items-center space-y-3 '>
      <section className='flex flex-col justify-center items-center'>
        <img src={image} alt='Empty Image' />
        <span className='text-base text-slate-400'>{title}</span>
        <span className='text-xs text-slate-400'>{subtitle}</span>
      </section>

      {children}    
    </div>
  )
}

export default BlankState
