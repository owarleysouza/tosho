import PublicLayout from '@/layouts/PublicLayout';
import RecoveryPasswordForm from '@/pages/auth/RecoveryPasswordForm';

import { useNavigate } from 'react-router-dom';

const RecoveryPasswordPage = () => {
  const navigate = useNavigate();
  return (
    <PublicLayout>
      <div className="flex flex-col justify-center items-center w-[320px] min-h-[438px] space-y-8 bg-secondary p-6 rounded-md border border-accent shadow">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-black text-primary">ToSho</h1>
          <span className="max-w-[180px] text-center leading-none font-semibold text-gray-500">
            Recupere a senha ao digitar o seu e-mail
          </span>
        </div>
        <RecoveryPasswordForm />
        <span
          onClick={() => navigate('/login')}
          className="text-sm text-center text-gray-500 underline cursor-pointer"
        >
          Voltar para login{' '}
        </span>
      </div>
    </PublicLayout>
  );
};

export default RecoveryPasswordPage;
