import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'

import { Loader2 } from "lucide-react"

interface DecisionDialogProps{
  title: string;
  description: string;
  actionLabel: string;
  open: boolean;
  loading: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}

const DecisionDialog: React.FC<DecisionDialogProps>  = ({title, description, actionLabel, open, setOpen, loading, onConfirm }) => {  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="w-[340px]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={loading} onClick={onConfirm} className='rounded-full px-8 bg-destructive'>
          { loading ? 
            (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) 
            : actionLabel }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DecisionDialog
