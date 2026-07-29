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

import { useMediaQuery } from '@/hooks/useMediaQuery';

interface CompleteShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  pendingCount: number;
}

const CompleteShopDialog: React.FC<CompleteShopDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  pendingCount,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const title = 'Concluir compra?';
  // RN-25 asks for confirmation before an irreversible action — it doesn't
  // say block on incomplete items. Real shopping trips run out of stock, so
  // this is a heads-up, not a gate.
  const description =
    pendingCount > 0
      ? `${pendingCount} ${
          pendingCount === 1
            ? 'item ainda não foi marcado'
            : 'itens ainda não foram marcados'
        }. Você pode concluir mesmo assim — a compra será movida para o histórico.`
      : 'A compra será movida para o histórico.';

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
        onClick={onConfirm}
        className="rounded-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Concluir'}
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

export default CompleteShopDialog;
