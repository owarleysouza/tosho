import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { useForm } from "react-hook-form" 
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { useContext, useEffect, useState } from "react";
import { UserContext } from '@/context/commom/UserContext'
import { LoaderCircle } from 'lucide-react';
import FormTextArea from '@/components/form/FormTextArea';
import { useToast } from "@/components/ui/use-toast"

import productsBlankStateSVG from "@/assets/images/products-blank-state.svg" 
import { addDoc, collection, DocumentData, getDocs, query, where } from 'firebase/firestore';

import { db } from "@/lib/firebase"; 
import LoadingPage from '../commom/LoadingPage'; 
import ProductList from './ProductList';

interface Product {
  uid: string,
  name: string, 
  quantity: number, 
  isDone: boolean
}

const Shop = ({shop}: DocumentData) => { 

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000); // Convertendo de segundos para milissegundos
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam do 0
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  const { user } = useContext(UserContext)

  const formattedDate = formatDate(shop.date?.seconds);

  const form = useForm<z.infer<typeof ProductsCreateFormSchema>>({
    resolver: zodResolver(ProductsCreateFormSchema),
    defaultValues: {
      text: "",
    },
  })

  const [products, setProducts] = useState<Product[]>([])
  const [createProductsLoading, setCreateProductsLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)

  const { toast } = useToast()

  function handleProductsInput(text: string) {
    const products = []
    const rows = text.trim().split('\n')

    for(const row of rows ){
      const [name, quantity] = row.trim().split(",")
      
      //Validate if user just typed \n
      if(name || quantity){
        products.push({
          name: name ? name : "Produto Exemplo", 
          quantity: quantity ? parseInt(quantity) : 1,
          isDone: false,
        }) 
      }
    }

    return products
  }

  async function getProducts(){
    const auxProducts: Product[] = []

    try{
      if(user){
        const pendingProductsRef = query(collection(db, `users/${user.uid}/shops/${shop.uid}/products`), where("isDone", "==", false))
        const querySnapshot = await getDocs(pendingProductsRef);
     
        querySnapshot.forEach((doc) => {
          const product = {
            uid: doc.id,
            ...doc.data()
          }
          auxProducts.push(product as Product) 
        })
        setProducts(auxProducts)
      }
    } catch (error) { 
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao carregar produtos"
      }) 
    } finally {
      setLoadingProducts(false)
    }
  }

  async function onSubmit(data: z.infer<typeof ProductsCreateFormSchema>): Promise<void>{
    const productsToAdd = handleProductsInput(data.text) 
   
    try{
      setCreateProductsLoading(true)
      if(user){ 
        const productsCollRef = collection(db, `users/${user.uid}/shops/${shop.uid}/products`)
        
        const productPromises = productsToAdd.map(async (product) =>{
          const { id } = await addDoc(productsCollRef, product)
          const newProduct = {
            uid: id,
            ...product
          }
          return newProduct
        })

        const addedProducts = await Promise.all(productPromises)
       
        setProducts([...products, ...addedProducts])

        form.reset() 
      }   
    } catch (error) { 
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu na adição de produtos"
      }) 
    } finally {
      setCreateProductsLoading(false)
    }
  } 

  useEffect( () => {
    getProducts()
  }, [])

  if(loadingProducts) return <LoadingPage />

  return (
    <div className='h-screen flex flex-col justify-center items-center space-y-3 '>
      {
      products.length ? 
        (<ProductList products={products} />)
        : 
        (
          <>
            <section className='flex flex-col items-center m-2'>
              <span className='text-xs text-slate-400'>{ formattedDate }</span>
              <span className='text-lg text-black font-bold break-all ...'>{shop.name}</span>
            </section>
            <section className='flex flex-col justify-center items-center'>
              <img src={productsBlankStateSVG} alt='Products Empty Image' />
              <span className='text-base text-slate-400'>Nenhum produto adicionado ainda</span>
            </section>
          </> 
        )
      }
      <footer className='w-80 fixed bottom-0 flex justify-center bg-secondary p-2 rounded-lg shadow-xl'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-row items-center justify-between w-full">
            <div className="w-[240px]">
              <FormTextArea
                formControl={form.control}
                name="text"
                placeholder="Digite um ou mais produtos"
              />

            </div>
            
            <Button size="sm" disabled={createProductsLoading} type="submit" className='rounded-full'>
            { createProductsLoading ? 
              (<LoaderCircle className="animate-spin" />) 
              : "Criar" }
            </Button>
    
          </form>
        </Form>
      </footer>
    </div>
  )
}

export default Shop
