import { createBrowserRouter } from "react-router-dom";
import Home from '@/pages/home/Home'
import SignUp from "@/pages/auth/SignUpPage";
import Login from "@/pages/auth/LoginPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";
import AccountPage from "@/pages/account/AccountPage";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children:[
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/account',
        element: <AccountPage />
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