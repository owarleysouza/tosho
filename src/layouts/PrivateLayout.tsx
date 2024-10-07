import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/commom/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import userPNG from '@/assets/images/user.png';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface LayoutProps {
  children: ReactNode;
}

const PrivateLayout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();

  return (
    <div>
      <Header>
        <h1
          className="text-xl font-black text-primary cursor-pointer"
          onClick={() => navigate('/')}
        >
          ToSho
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="cursor-pointer">
              <AvatarImage src={userPNG} />
              <AvatarFallback>
                <Skeleton className="h-12 w-12 rounded-full" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/')}
            >
              Compra Atual
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/next-shops')}
            >
              Próximas Compras
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/complete-shops')}
            >
              Compras Concluídas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/account')}
            >
              Minha conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Header>
      <div className="flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
};

export default PrivateLayout;
