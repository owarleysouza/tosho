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

interface DeletePurchaseDialogProps {
  shopUid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

const DeletePurchaseDialog: React.FC<DeletePurchaseDialogProps> = ({
  shopUid,
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

      // Firestore never cascades: subcollections survive their parent
      // document's deletion as orphans. Fetch every product first, then
      // delete them plus the shop doc in a single batch — batch.commit()
      // is atomic, so either everything goes or nothing does.
      const productsRef = collection(
        db,
        `users/${user.uid}/shops/${shopUid}/products`
      );
      const productsSnapshot = await getDocs(productsRef);

      const batch = writeBatch(db);
      productsSnapshot.forEach((productDoc) => batch.delete(productDoc.ref));
      batch.delete(doc(db, `users/${user.uid}/shops`, shopUid));

      await batch.commit();

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Compra excluída',
      });

      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ops! Algo de errado aconteceu',
        description: 'Um erro inesperado aconteceu ao excluir a compra',
      });
    } finally {
      setLoading(false);
    }
  }

  const title = 'Excluir compra?';
  const description =
    'Todos os itens dessa compra serão removidos permanentemente. Esta ação não pode ser desfeita.';

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

export default DeletePurchaseDialog;
