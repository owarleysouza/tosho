import { useContext, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { doc, increment, writeBatch } from 'firebase/firestore';

import type { TemplateItem } from '@/types';
import TemplateItemEditDialog from '@/components/templates/TemplateItemEditDialog';
import { db } from '@/lib/firebase';
import { UserContext } from '@/context/commom/UserContext';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { useToast } from '@/components/ui/use-toast';

interface TemplateItemCardProps {
  item: TemplateItem;
  templateUid: string;
  existingCategories: string[];
  onItemUpdated: (updatedItem: TemplateItem) => void;
  onItemRemoved: (uid: string) => void;
  onItemRestored: (item: TemplateItem) => void;
}

// No checkbox — unlike ProductCard, a template item has no completion
// state (RN-20/RN-21: that's created fresh only once cloned into a
// purchase). Direct pencil/trash icons (not a "..." dropdown like
// ProductCard) — same convention TemplateCard already uses for its own
// edit/delete.
const TemplateItemCard: React.FC<TemplateItemCardProps> = ({
  item,
  templateUid,
  existingCategories,
  onItemUpdated,
  onItemRemoved,
  onItemRestored,
}) => {
  const { user } = useContext(UserContext);
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);

  // RN-24 — remove immediately, no confirmation modal (that pattern is
  // RN-25, for entities like templates/purchases, not individual items).
  // The 5s undo window + delayed Firestore commit is the same hook
  // ProductCard (HU-11) uses — reused here, not reimplemented.
  const { remove: removeItemWithUndo } = useUndoableDelete<TemplateItem>({
    onRemoveLocally: (removedItem) => onItemRemoved(removedItem.uid),
    onRestoreLocally: (restoredItem) => onItemRestored(restoredItem),
    onCommit: async (committedItem) => {
      try {
        // Deletes the item and decrements the template's itemsCount counter
        // atomically, same pattern as ProductCard's shop equivalent — keeps
        // TemplatesPage's cached count in sync without a per-card query.
        const batch = writeBatch(db);
        batch.delete(
          doc(
            db,
            `users/${user?.uid}/templates/${templateUid}/items`,
            committedItem.uid
          )
        );
        batch.update(doc(db, `users/${user?.uid}/templates`, templateUid), {
          itemsCount: increment(-1),
        });
        await batch.commit();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ops! Algo de errado aconteceu',
          description: 'Um erro inesperado aconteceu ao excluir o item',
        });
      }
    },
  });

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

      <button
        type="button"
        aria-label="Excluir item"
        onClick={() => removeItemWithUndo(item)}
        className="shrink-0 text-tosho-500"
      >
        <Trash2 className="h-[17px] w-[17px]" />
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
