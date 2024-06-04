import { createBrowserRouter } from "react-router-dom";
import Home from '@/pages/HomePage'
import SignUp from "@/pages/auth/SignUpPage";
import Login from "@/pages/auth/LoginPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children:[
      {
        path: '/',
        element: <Home />
      }
    ]
  },
  {
    element: <PublicRoute />,
    children: [
      { 
        path: 'login',
        element: <Login />
      },
      {
        path: 'signUp',
        element: <SignUp />
      },
    ]
  },
  {
    path: '*',
    element: <h1>Rota não encontrada!</h1>
  },
]) 

export default router;