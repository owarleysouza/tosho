import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { getTemplateIcon } from '@/utils/templateIcons';
import TemplateFormDialog from '@/pages/templates/TemplateFormDialog';
import DeleteTemplateDialog from '@/components/templates/DeleteTemplateDialog';

export interface TemplateCardData {
  uid: string;
  name: string;
  description?: string;
  itemsCount?: number;
  icon?: string;
}

interface TemplateCardProps {
  template: TemplateCardData;
  // Refetch trigger after a successful edit or delete — undefined skips
  // rendering the edit/delete icons entirely, same convention as
  // PurchaseCard's onChanged.
  onChanged?: () => void;
}

// No click-through to a detail view yet — that's HU-23-26 (gerenciar itens),
// which doesn't exist yet.
const TemplateCard: React.FC<TemplateCardProps> = ({ template, onChanged }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const itemsLabel = `${template.itemsCount ?? 0} ${
    template.itemsCount === 1 ? 'item' : 'itens'
  }`;
  const Icon = getTemplateIcon(template.icon);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tosho-50 text-tosho-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {template.name}
        </p>
        <p className="text-xs font-medium text-primary">{itemsLabel}</p>
        {template.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {template.description}
          </p>
        )}
      </div>

      {onChanged && (
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Editar template"
            onClick={() => setEditOpen(true)}
            className="text-tosho-500"
          >
            <Pencil className="h-[17px] w-[17px]" />
          </button>
          <button
            type="button"
            aria-label="Excluir template"
            onClick={() => setDeleteOpen(true)}
            className="text-tosho-500"
          >
            <Trash2 className="h-[17px] w-[17px]" />
          </button>
        </div>
      )}

      {onChanged && (
        <>
          <TemplateFormDialog
            template={template}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSaved={onChanged}
          />

          <DeleteTemplateDialog
            templateUid={template.uid}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={onChanged}
          />
        </>
      )}
    </div>
  );
};

export default TemplateCard;
