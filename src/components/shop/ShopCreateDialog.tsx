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

import { useForm } from "react-hook-form"
import { ShopCreateFormSchema } from "@/utils/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const ShopCreateDialog = () => {

  const form = useForm<z.infer<typeof ShopCreateFormSchema>>({
    resolver: zodResolver(ShopCreateFormSchema),
    defaultValues: {
      name: "",
    },
  })
 

  const onSubmit = (data: z.infer<typeof ShopCreateFormSchema>) => {
    console.log("enviando...", data)
  }

  return (
    
    <Dialog>
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
              <Button className='rounded-full px-8' type="submit">Criar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
     
  )
}

export default ShopCreateDialog
