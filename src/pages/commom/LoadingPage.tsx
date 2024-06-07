import { Progress } from "@/components/ui/progress"
import PublicLayout from "@/layouts/PublicLayout"
import { useEffect, useState } from "react"

const LoadingPage = () => {
  const [progressValue, setProgressValue] = useState(1)

  useEffect(() => {
    if(progressValue < 100) setProgressValue(progressValue * 10)
  }, [progressValue])

  return (
    <PublicLayout>
      <div className="w-1/2 md:w-1/3 pa-0 flex flex-col items-center justify-center space-y-2">
        <h1 className='text-3xl font-black'>ToSho...</h1>       
        <Progress value={progressValue} />
      </div>
    </PublicLayout>
  )
}

export default LoadingPage
