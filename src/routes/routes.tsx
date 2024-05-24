import { createBrowserRouter } from "react-router-dom";
import Home from '@/pages/Home'
import SignUp from "@/pages/auth/SignUp";
import Login from "@/pages/auth/Login";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  { 
    path: 'login',
    element: <Login />
  },
  {
    path: 'signUp',
    element: <SignUp />
  },
  {
    path: '*',
    element: <h1>Rota não encontrada!</h1>
  },
]) 

export default router;