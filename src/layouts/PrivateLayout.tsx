import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, ShoppingCart } from 'lucide-react';

import Header from '@/components/commom/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import userPNG from '@/assets/images/user.png';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

// Only routes that exist today — Templates isn't built yet (Fase 6-8), so
// it's left out instead of linking to a page that doesn't exist.
const navItems = [
  { label: 'Compra atual', path: '/', icon: ShoppingCart },
  { label: 'Compras', path: '/purchases', icon: ClipboardList },
];

const PrivateLayout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div>
      <Header>
        <h1
          className="flex items-center gap-2 text-xl font-black text-primary cursor-pointer md:text-base md:font-medium md:text-tosho-hero-fg"
          onClick={() => navigate('/')}
        >
          <ShoppingCart className="hidden h-4 w-4 text-tosho-300 md:block" />
          ToSho
        </h1>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] text-tosho-200 transition-colors hover:text-tosho-hero-fg',
                pathname === item.path && 'bg-white/10 text-tosho-hero-fg'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <Avatar
          className="cursor-pointer"
          onClick={() => navigate('/account')}
        >
          <AvatarImage src={userPNG} />
          <AvatarFallback>
            <Skeleton className="h-12 w-12 rounded-full" />
          </AvatarFallback>
        </Avatar>
      </Header>

      <div className="flex flex-col items-center justify-center pb-16 md:pb-0">
        {children}
      </div>

      {/* Bottom nav (mobile) — the Topbar's nav items become fixed icon
          buttons at the bottom of the screen instead of disappearing. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-white py-1.5 md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-1 text-[10px]',
                isActive ? 'text-tosho-900' : 'text-tosho-text-3'
              )}
            >
              <item.icon className="h-[22px] w-[22px]" />
              {item.label}
              <span
                className={cn(
                  'h-1 w-1 rounded-full',
                  isActive ? 'bg-tosho-900' : 'bg-transparent'
                )}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PrivateLayout;
