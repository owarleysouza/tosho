import { RouterProvider } from 'react-router-dom'
import router from './routes/routes.tsx'
import './assets/css/global.css'

function App() {
  return (
    <>
      <div className='card'>
        <RouterProvider router={router} />
      </div>     
    </>
  )
}

export default App
