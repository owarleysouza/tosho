import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { Button } from '@/components/ui/button'

import { Form } from "@/components/ui/form"
import FormInput from "@/components/form/FormInput"
import FormDatePicker from '@/components/form/FormDatePicker'
import { Loader2 } from "lucide-react"

import { useForm } from "react-hook-form"
import { ShopCreateFormSchema } from "@/utils/formValidations"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { collection, addDoc, doc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"

import React, { useContext, useState } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { useToast } from "@/components/ui/use-toast"

interface ShopCreateDialogProps{
  onShopCreated: () => void;
}

const ShopCreateDialog: React.FC<ShopCreateDialogProps>  = ({ onShopCreated }) => {
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)

  const { user } = useContext(UserContext)

  const form = useForm<z.infer<typeof ShopCreateFormSchema>>({
    resolver: zodResolver(ShopCreateFormSchema),
    defaultValues: {
      name: "",
      isDone: false,
      total: 0
    },
  })
 
  const { toast } = useToast()

  const onSubmit = async (data: z.infer<typeof ShopCreateFormSchema>): Promise<void> => {
    try{
      setLoading(true)
      if(user){
        const docRef = doc(db, "users", user.uid)
        const colRef = collection(docRef, "shops")
        await addDoc(colRef, data)
        setOpen(false)
  
        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Compra adicionada",
        })
        onShopCreated()
      }
    } catch(error: unknown){
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao criar a compra"
      }) 
    } finally {
      setLoading(false)
    }
  } 

  return (
    
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-[320px] rounded-full'>Criar compra</Button>
      </DialogTrigger>
      <DialogContent 
        className="w-[340px]"
        onInteractOutside={(e) => {e.preventDefault()}}
      >
        <DialogHeader>
          <DialogTitle>Criar compra</DialogTitle>
          <DialogDescription>
          Adicione uma compra a ser realizada apenas digitando um <b>nome</b> e <b>data</b> para a compra.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 w-full">
            <FormInput
              formControl={form.control}
              name="name"
              placeholder="Nome"
            />

            <FormDatePicker
              formControl={form.control}
              name="date"
              placeholder="Data"
            />

            <DialogFooter>
              <Button disabled={loading} type="submit" className='rounded-full px-8'>
              { loading ? 
                (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) 
                : "Criar" }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
     
  )
}

export default ShopCreateDialog
