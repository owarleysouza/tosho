import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { useForm } from "react-hook-form" 
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { useState } from 'react'
import { Loader2 } from 'lucide-react';
import FormTextArea from '@/components/form/FormTextArea';

interface ShopProps { 
  name: string,
  date: number,
  image: string,
}

const Shop = ({name, date, image}: ShopProps) => { 

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Convertendo de segundos para milissegundos
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam do 0
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const formattedDate = formatDate(date);

  const form = useForm<z.infer<typeof ProductsCreateFormSchema>>({
    resolver: zodResolver(ProductsCreateFormSchema),
    defaultValues: {
      text: "",
    },
  })

  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: z.infer<typeof ProductsCreateFormSchema>): Promise<void> => {
    try{
      setLoading(true)
      console.log("dados",data)
    } catch(error: unknown){
       console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-screen flex flex-col justify-center items-center space-y-3 '>
      <section className='flex flex-col items-center'>
        <span className='text-xs text-slate-400'>{ formattedDate }</span>
        <span className='text-lg text-black font-bold'>{name}</span>
      </section>
      <section className='flex flex-col justify-center items-center'>
        <img src={image} alt='Products Empty Image' />
        <span className='text-base text-slate-400'>Nenhum produto adicionado ainda</span>
      </section>
        

      <footer className='w-80 fixed bottom-0 flex justify-center bg-secondary p-2 rounded-lg shadow-xl'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-row items-center justify-between w-full">
            <div className="w-[250px]">
              <FormTextArea
                formControl={form.control}
                name="text"
                placeholder="Digite um ou mais produtos"
              />

            </div>
            
            <Button disabled={loading} type="submit" className='rounded-full'>
            { loading ? 
              (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) 
              : "+" }
            </Button>
    
          </form>
        </Form>
      </footer>
    </div>
  )
}

export default Shop
