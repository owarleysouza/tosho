import { createBrowserRouter } from 'react-router-dom';

import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';

import Home from '@/pages/home/Home';
import SignUp from '@/pages/auth/SignUpPage';
import Login from '@/pages/auth/LoginPage';
import AccountPage from '@/pages/account/AccountPage';
import PurchasesPage from '@/pages/purchases/PurchasesPage';
import CompletedShopDetailPage from '@/pages/completed-shops/CompletedShopDetailPage';
import RecoveryPasswordPage from '@/pages/auth/RecoveryPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/account',
        element: <AccountPage />,
      },
      {
        path: '/purchases',
        element: <PurchasesPage />,
      },
      {
        path: '/complete-shops/:shopId',
        element: <CompletedShopDetailPage />,
      },
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signUp',
        element: <SignUp />,
      },
      {
        path: 'recoveryPassword',
        element: <RecoveryPasswordPage />,
      },
    ],
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '*',
    element: <h1>Rota não encontrada!</h1>,
  },
]);

export default router;
