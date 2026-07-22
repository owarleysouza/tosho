import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, Clock, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PurchaseCardStatus = 'in-progress' | 'pending' | 'completed';

interface PurchaseCardProps {
  name: string;
  scheduledAt?: Timestamp;
  date?: Timestamp; // legacy fallback for shops created before scheduledAt (HU-16)
  itemsCount?: number;
  status: PurchaseCardStatus;
  onClick?: () => void;
}

const statusConfig: Record<
  PurchaseCardStatus,
  { icon: typeof ShoppingCart; label: string; iconWrapClassName: string; cardClassName: string }
> = {
  'in-progress': {
    icon: ShoppingCart,
    label: 'Em progresso',
    iconWrapClassName: 'bg-tosho-500 text-tosho-hero-fg',
    cardClassName: 'border-primary bg-secondary',
  },
  pending: {
    icon: Clock,
    label: 'Pendente',
    iconWrapClassName: 'bg-tosho-50 text-tosho-700',
    cardClassName: 'border-border bg-background',
  },
  completed: {
    icon: Check,
    label: 'Concluída',
    iconWrapClassName: 'bg-tosho-25 text-muted-foreground',
    cardClassName: 'border-border bg-background',
  },
};

const PurchaseCard: React.FC<PurchaseCardProps> = ({
  name,
  scheduledAt,
  date,
  itemsCount,
  status,
  onClick,
}) => {
  const timestamp = scheduledAt ?? date;
  const config = statusConfig[status];
  const Icon = config.icon;
  const itemsLabel = `${itemsCount ?? 0} ${itemsCount === 1 ? 'item' : 'itens'}`;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4',
        config.cardClassName,
        onClick && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          config.iconWrapClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {timestamp
            ? `${format(timestamp.toDate(), 'd MMM yyyy', { locale: ptBR })} · ${format(
                timestamp.toDate(),
                'HH:mm'
              )} · ${itemsLabel}`
            : itemsLabel}
        </p>
      </div>

      <Badge variant={status}>{config.label}</Badge>
    </div>
  );
};

export default PurchaseCard;
