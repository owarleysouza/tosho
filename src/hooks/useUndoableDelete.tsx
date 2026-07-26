import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

interface UseUndoableDeleteOptions<T> {
  // Remove from local/redux state immediately — this is what makes the item
  // disappear from the list right away (RN-24).
  onRemoveLocally: (item: T) => void;
  // Re-insert into local/redux state if the user clicks "Desfazer". Position
  // doesn't matter here: callers whose list is grouped/sorted on every
  // render (e.g. getSortedCategoryGroups) will place it back correctly on
  // its own — no index bookkeeping needed.
  onRestoreLocally: (item: T) => void;
  // The actual persistence (e.g. a Firestore delete). Only runs if the grace
  // period elapses without an undo.
  onCommit: (item: T) => Promise<void> | void;
  delayMs?: number;
  message?: string;
}

// RN-24 — generic "remove now, commit later" pattern: HU-11 (shop items)
// and HU-26 (template items) both use this instead of duplicating the
// timer/toast logic.
export function useUndoableDelete<T>({
  onRemoveLocally,
  onRestoreLocally,
  onCommit,
  delayMs = 5000,
  message = 'Item removido',
}: UseUndoableDeleteOptions<T>) {
  const { toast } = useToast();

  function remove(item: T) {
    let undone = false;
    onRemoveLocally(item);

    // Assigned right after the toast() call below, before either the action
    // button or the timeout could possibly run — safe despite the temporal
    // gap since both are event-driven, not synchronous with this line.
    let dismiss = () => {};

    function handleUndo() {
      undone = true;
      clearTimeout(timeoutId);
      onRestoreLocally(item);
      dismiss();
    }

    const toastHandle = toast({
      variant: 'undo',
      description: message,
      action: (
        <ToastAction
          altText="Desfazer"
          onClick={handleUndo}
          className="border-none bg-transparent text-tosho-500 hover:bg-transparent hover:text-tosho-500"
        >
          Desfazer
        </ToastAction>
      ),
    });
    dismiss = toastHandle.dismiss;

    // Deliberately a plain timeout, not tied to this component's lifecycle
    // (no useEffect/cleanup): the component that called remove() unmounts
    // as soon as onRemoveLocally takes the item out of its list, but the
    // pending commit must still fire on schedule regardless.
    const timeoutId = setTimeout(() => {
      dismiss();
      if (!undone) onCommit(item);
    }, delayMs);
  }

  return { remove };
}
