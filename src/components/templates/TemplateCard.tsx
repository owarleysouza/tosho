import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// HU-23 — clicking the card opens the template's detail view (print 15).
// Edit/delete icons stop propagation so they don't also trigger the
// navigation underneath them.
const TemplateCard: React.FC<TemplateCardProps> = ({ template, onChanged }) => {
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const itemsLabel = `${template.itemsCount ?? 0} ${
    template.itemsCount === 1 ? 'item' : 'itens'
  }`;
  const Icon = getTemplateIcon(template.icon);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/templates/${template.uid}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') navigate(`/templates/${template.uid}`);
      }}
      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4"
    >
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
        // Same convention as PurchaseCard: wraps the trigger icons *and* the
        // dialogs themselves. React bubbles synthetic events through the
        // component tree, not the portal's DOM position, so a click inside
        // the (portaled) Dialog/Drawer content still needs this boundary to
        // avoid also firing the card's navigate.
        <div
          onClick={(event) => event.stopPropagation()}
          className="flex shrink-0 items-center gap-3"
        >
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
        </div>
      )}
    </div>
  );
};

export default TemplateCard;
