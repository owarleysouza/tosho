import { useNavigate } from 'react-router-dom'

import shopBlankStateSVG from "@/assets/images/shop-blank-state.svg"

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Header from '@/components/commom/Header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import FormInput from "@/components/form/FormInput"

import { CreateShopFormSchema } from "@/utils/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"


const Home = () => {
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof CreateShopFormSchema>>({
    resolver: zodResolver(CreateShopFormSchema),
    defaultValues: {
      name: "",
      date: "",
    },
  })

  const onSubmit = () => {
    console.log("submetendo")
  }

  return (
    <div>
      <Header>
        <h1 className='text-xl font-black'>ToSho</h1>
        <Avatar className='cursor-pointer' onClick={() => navigate("/account")}>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
      </Header>

      <div className='h-screen flex flex-col justify-center items-center space-y-3 '>
        <section className='flex flex-col justify-center items-center'>
          <img src={shopBlankStateSVG} alt='Shop Empty' />
          <span className='text-base text-slate-400'>Nenhuma compra criada ainda :(</span>
        </section>
        
        <Dialog>
          <DialogTrigger>
            <Button className='w-[320px] rounded-full' onClick={() => {}}>Criar compra</Button>
          </DialogTrigger>
          <DialogContent className="w-[340px]">
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
                  placeholder="Nome"/>

                <FormInput
                  formControl={form.control}
                  name="date"
                  placeholder="Data"/>

                {/* <Button disabled={loading} type="submit" className='w-full bg-primary rounded-full'>
                { loading ? 
                  (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) 
                  : "Criar conta" }
                </Button> */}
                <DialogFooter>
                  <Button className='hover:bg-primary hover:text-white rounded-full' variant="ghost" type="submit">Cancelar</Button>
                  <Button className='rounded-full px-8' type="submit">Criar</Button>
                </DialogFooter>
              </form>
            </Form>

          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default Home

