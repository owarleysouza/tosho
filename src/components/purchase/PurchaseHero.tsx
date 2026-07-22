import { ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';

interface PurchaseHeroProps {
  name: string;
  scheduledAt?: Timestamp;
  date?: Timestamp; // legacy fallback for shops created before scheduledAt (HU-16)
  // RN-09 — derived from item state every render, never persisted, so it
  // can never drift out of sync with the actual list/cart.
  completedCount: number;
  totalCount: number;
  // Mobile-only Lista/Carrinho tab triggers, rendered inside the same green
  // hero box as the print — omitted entirely on desktop (no tabs there).
  children?: ReactNode;
}

const PurchaseHero: React.FC<PurchaseHeroProps> = ({
  name,
  scheduledAt,
  date,
  completedCount,
  totalCount,
  children,
}) => {
  const timestamp = scheduledAt ?? date;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-tosho-900 px-5 pb-0 pt-16 md:px-8 md:pb-8 md:pt-16">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-tosho-hero-fg">
            {name}
          </h1>
          {timestamp && (
            <p className="mt-[3px] text-[13px] text-tosho-300">
              {format(timestamp.toDate(), 'd MMM yyyy', { locale: ptBR })} ·{' '}
              {format(timestamp.toDate(), 'HH:mm')}
            </p>
          )}
        </div>

        <Badge
          variant="in-progress"
          className="shrink-0 whitespace-nowrap"
        >
          Em progresso
        </Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-tosho-hero-fg">Progresso</span>
          <span className="text-[11px] font-medium text-tosho-hero-fg">
            {completedCount} de {totalCount} itens
          </span>
        </div>
        <div className="mt-1.5 h-[5px] w-full rounded-full bg-white/15">
          <div
            className="h-[5px] rounded-full bg-tosho-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {children}
    </div>
  );
};

export default PurchaseHero;
