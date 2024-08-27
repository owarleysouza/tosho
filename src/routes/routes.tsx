import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";

import Home from '@/pages/home/Home'
import SignUp from "@/pages/auth/SignUpPage";
import Login from "@/pages/auth/LoginPage";
import AccountPage from "@/pages/account/AccountPage";
import MyShopsPage from "@/pages/my-shops/MyShopsPage";
import ShopDetailPage from "@/pages/my-shops/ShopDetailPage";


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
      },
      {
        path: '/complete-shops',
        element: <MyShopsPage />,
      },
      {
        path: '/complete-shops/:shopId',
        element: <ShopDetailPage />
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