import { RouterProvider } from 'react-router-dom'
import router from './routes/routes.tsx'
import './assets/css/global.css'
import UserProvider from './context/commom/UserContext.tsx'

function App() {
  return (
    <>
      <div className='min-h-screen flex flex-col justify-center items-center'>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </div>     
    </>
  )
}

export default App
