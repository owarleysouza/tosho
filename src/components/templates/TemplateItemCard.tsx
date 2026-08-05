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

  // Metadata (quantity + description) unified into a single line, same
  // convention as the redesigned ProductCard — separated by " · ", no
  // separator when only one of the two is present.
  const metadata = [item.quantity, item.description].filter(Boolean).join(' · ');

  return (
    // Same card shell/typography/spacing as the redesigned ProductCard,
    // minus the checkbox strip — a template item has no completion state
    // (RN-20/RN-21: that's created fresh only once cloned into a purchase),
    // so there's nothing for a strip to toggle.
    <div className="flex w-full items-center overflow-hidden rounded-xl border border-border bg-card">
      <div className="min-w-0 flex-1 px-[13px] py-[11px] md:px-3.5 md:py-3">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        {metadata && <p className="text-xs text-tosho-text-3">{metadata}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-3.5 px-3.5 md:gap-4 md:px-4">
        <button
          type="button"
          aria-label="Editar item"
          onClick={() => setEditOpen(true)}
          className="text-tosho-500"
        >
          <Pencil className="h-[17px] w-[17px]" />
        </button>

        <button
          type="button"
          aria-label="Excluir item"
          onClick={() => removeItemWithUndo(item)}
          className="text-tosho-500"
        >
          <Trash2 className="h-[17px] w-[17px]" />
        </button>
      </div>

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
