import PublicLayout from "@/layouts/PublicLayout"
import { LoaderCircle } from "lucide-react"

const LoadingPage = () => { 
  return (
    <PublicLayout>
      <div className="w-1/2 md:w-1/3 pa-0 flex flex-col items-center justify-center space-y-2">
        <h1 className='text-3xl font-black text-primary'>ToSho</h1>        
        <LoaderCircle className="text-primary animate-spin" />
      </div>
    </PublicLayout>
  )
}

export default LoadingPage
