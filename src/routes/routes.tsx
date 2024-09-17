import { createBrowserRouter } from 'react-router-dom';

import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';

import Home from '@/pages/home/Home';
import SignUp from '@/pages/auth/SignUpPage';
import Login from '@/pages/auth/LoginPage';
import AccountPage from '@/pages/account/AccountPage';
import CompletedShopsPage from '@/pages/completed-shops/CompletedShopsPage';
import CompletedShopDetailPage from '@/pages/completed-shops/CompletedShopDetailPage';
import ProductEditPage from '@/pages/shop/ProductEditPage';
import RecoveryPasswordPage from '@/pages/auth/RecoveryPasswordPage';

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
        path: '/complete-shops',
        element: <CompletedShopsPage />,
      },
      {
        path: '/complete-shops/:shopId',
        element: <CompletedShopDetailPage />,
      },
      {
        path: '/edit-product/:productId',
        element: <ProductEditPage />,
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
    path: '*',
    element: <h1>Rota não encontrada!</h1>,
  },
]);

export default router;
