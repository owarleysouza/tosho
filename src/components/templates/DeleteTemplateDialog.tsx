import { useContext, useState } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserContext } from '@/context/commom/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DeleteTemplateDialogProps {
  templateUid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

const DeleteTemplateDialog: React.FC<DeleteTemplateDialogProps> = ({
  templateUid,
  open,
  onOpenChange,
  onDeleted,
}) => {
  const { user } = useContext(UserContext);
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);
      if (!user) return;

      // RN-22 — this only ever touches the template's own subcollection and
      // its own doc; nothing in a purchase (or its items) points back at a
      // template, so there's nothing here that could reach into a purchase.
      // Same cascade-in-one-batch pattern as DeletePurchaseDialog: Firestore
      // never cascades on its own, so fetch every item first, then delete
      // them plus the template doc atomically — either everything goes or
      // nothing does.
      const itemsRef = collection(
        db,
        `users/${user.uid}/templates/${templateUid}/items`
      );
      const itemsSnapshot = await getDocs(itemsRef);

      const batch = writeBatch(db);
      itemsSnapshot.forEach((itemDoc) => batch.delete(itemDoc.ref));
      batch.delete(doc(db, `users/${user.uid}/templates`, templateUid));

      await batch.commit();

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Template excluído',
      });

      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao excluir o template',
      });
    } finally {
      setLoading(false);
    }
  }

  const title = 'Excluir template?';
  const description =
    'Todos os itens desse template serão removidos permanentemente. Esta ação não pode ser desfeita. Compras já criadas a partir dele não são afetadas.';

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={() => onOpenChange(false)}
      >
        Cancelar
      </Button>
      <Button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Excluir'}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>{actions}</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex-row justify-end gap-2">
          {actions}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DeleteTemplateDialog;
