import { ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PurchaseStatus = 'in-progress' | 'pending' | 'completed';

const statusLabel: Record<PurchaseStatus, string> = {
  'in-progress': 'Em progresso',
  pending: 'Pendente',
  completed: 'Concluída',
};

interface PurchaseHeroProps {
  name: string;
  scheduledAt?: Timestamp;
  // RN-09 — derived from item state every render, never persisted, so it
  // can never drift out of sync with the actual list/cart.
  completedCount: number;
  totalCount: number;
  // HU-17 — this hero is now reused for pending/completed purchases too
  // (not just the true active one), so the badge has to reflect the real
  // status instead of always claiming "Em progresso".
  status?: PurchaseStatus;
  // HU-17 — only the detail route passes this; laid out as part of the
  // hero's own flex row so it can't overlap the title the way an
  // absolutely-positioned overlay guessed from outside could.
  onBack?: () => void;
  // Mobile-only Lista/Carrinho tab triggers, rendered inside the same green
  // hero box as the print — omitted entirely on desktop (no tabs there).
  children?: ReactNode;
}

const PurchaseHero: React.FC<PurchaseHeroProps> = ({
  name,
  scheduledAt,
  completedCount,
  totalCount,
  status = 'in-progress',
  onBack,
  children,
}) => {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    // pb-0 on mobile normally relies on `children` (the Lista/Carrinho tabs)
    // to visually close the gap below the progress bar — when there's
    // nothing in that slot (e.g. the read-only completed view), the green
    // box would end right at the bar with no breathing room, so it falls
    // back to its own bottom padding instead.
    <div
      className={cn(
        'bg-tosho-900 px-5 pt-16 md:px-8 md:pb-8 md:pt-16',
        children ? 'pb-0' : 'pb-5'
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="-ml-1.5 mb-2 flex h-8 w-8 items-center justify-center rounded-full text-tosho-hero-fg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-tosho-hero-fg">
            {name}
          </h1>
          {scheduledAt && (
            <p className="mt-[3px] text-[13px] text-tosho-300">
              {format(scheduledAt.toDate(), 'd MMM yyyy', { locale: ptBR })} ·{' '}
              {format(scheduledAt.toDate(), 'HH:mm')}
            </p>
          )}
        </div>

        <Badge variant={status} className="shrink-0 whitespace-nowrap">
          {statusLabel[status]}
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
