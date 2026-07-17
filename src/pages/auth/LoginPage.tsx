import LoginForm from './LoginForm';
import AuthLayout from '@/components/layout/AuthLayout';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout
      eyebrow="Bem-vindo de volta"
      title="Suas compras te esperam."
      subtitle="Planeje, execute e conclua suas compras sem esforço"
      formTitle="Entrar na conta"
      formSubtitle="Preencha seus dados abaixo"
    >
      <LoginForm />

      <section className="flex flex-col items-center space-y-3 mt-6">
        <section className="flex flex-row space-x-1">
          <span className="text-sm text-center text-muted-foreground">
            Não possui uma conta?{' '}
          </span>
          <span
            onClick={() => navigate('/signUp')}
            className="text-sm text-center text-foreground font-medium underline cursor-pointer"
          >
            Cadastre-se
          </span>
        </section>
        <section className="flex flex-row space-x-1">
          <span className="text-sm text-center text-muted-foreground">
            Esqueceu a senha?{' '}
          </span>
          <span
            onClick={() => navigate('/recoveryPassword')}
            className="text-sm text-center text-foreground font-medium underline cursor-pointer"
          >
            Clique aqui
          </span>
        </section>
      </section>
    </AuthLayout>
  );
};

export default Login;
