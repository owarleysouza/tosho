import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, Clock, Check, EllipsisVertical } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import ShopFormDialog, { EditableShop } from '@/pages/shop/ShopFormDialog';
import DeletePurchaseDialog from '@/components/purchases/DeletePurchaseDialog';

export type PurchaseCardStatus = 'in-progress' | 'pending' | 'completed';

interface PurchaseCardShop extends EditableShop {
  itemsCount?: number;
}

interface PurchaseCardProps {
  shop: PurchaseCardShop;
  status: PurchaseCardStatus;
  onClick?: () => void;
  // Refetch trigger after a successful edit or delete — undefined skips
  // rendering the context menu entirely (no-op card, if ever needed).
  onChanged?: () => void;
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
  shop,
  status,
  onClick,
  onChanged,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const timestamp = shop.scheduledAt;
  const config = statusConfig[status];
  const Icon = config.icon;
  const itemsLabel = `${shop.itemsCount ?? 0} ${shop.itemsCount === 1 ? 'item' : 'itens'}`;

  // RN-11 — the in-progress purchase can't be deleted directly.
  const deleteDisabled = status === 'in-progress';

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
        <p className="truncate text-sm font-semibold text-foreground">{shop.name}</p>
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

      {onChanged && (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 -m-1">
              <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => {
                  // Let the dropdown close on its own default behavior first;
                  // opening the edit dialog in the same tick fights it for
                  // focus and leaves the dropdown stuck unable to reopen.
                  setTimeout(() => setEditOpen(true), 0);
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={deleteDisabled}
                className={cn(!deleteDisabled && 'cursor-pointer')}
                onSelect={() => {
                  if (!deleteDisabled) setTimeout(() => setDeleteOpen(true), 0);
                }}
              >
                <div className="flex flex-col">
                  <span>Excluir</span>
                  {deleteDisabled && (
                    <span className="text-[10px] text-muted-foreground">
                      Conclua a compra antes de excluir
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ShopFormDialog
            shop={shop}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSaved={onChanged}
          />

          <DeletePurchaseDialog
            shopUid={shop.uid}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={onChanged}
          />
        </div>
      )}
    </div>
  );
};

export default PurchaseCard;
