import { useState } from 'react';
import { Pencil } from 'lucide-react';

import type { TemplateItem } from '@/types';
import TemplateItemEditDialog from '@/components/templates/TemplateItemEditDialog';

interface TemplateItemCardProps {
  item: TemplateItem;
  templateUid: string;
  existingCategories: string[];
  onItemUpdated: (updatedItem: TemplateItem) => void;
}

// No checkbox — unlike ProductCard, a template item has no completion
// state (RN-20/RN-21: that's created fresh only once cloned into a
// purchase). Direct pencil icon (not a "..." dropdown like ProductCard) —
// same convention TemplateCard already uses for its own edit/delete.
// Delete icon comes in HU-26.
const TemplateItemCard: React.FC<TemplateItemCardProps> = ({
  item,
  templateUid,
  existingCategories,
  onItemUpdated,
}) => {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
        {item.quantity && (
          <p className="text-xs font-medium text-primary">{item.quantity}</p>
        )}
        {item.description && (
          <p className="truncate text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label="Editar item"
        onClick={() => setEditOpen(true)}
        className="shrink-0 text-tosho-500"
      >
        <Pencil className="h-[17px] w-[17px]" />
      </button>

      <TemplateItemEditDialog
        item={item}
        templateUid={templateUid}
        existingCategories={existingCategories}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onItemUpdated}
      />
    </div>
  );
};

export default TemplateItemCard;
