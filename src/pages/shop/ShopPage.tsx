import { useContext, useEffect, useState } from "react";

import { UseFormReturn } from "react-hook-form" 
import { ProductsCreateFormSchema } from '@/utils/formValidations';
import { z } from "zod"
import { Product } from '@/types';

import { UserContext } from '@/context/commom/UserContext'

import productsBlankStateSVG from "@/assets/images/products-blank-state.svg" 
import cartBlankStateSVG from "@/assets/images/cart-blank-state.svg" 

import BlankState from '@/components/commom/BlankState';
import ProductFormFooter from '@/components/form/ProductFormFooter';
import LoadingPage from '../commom/LoadingPage'; 
import { useToast } from "@/components/ui/use-toast"
import ProductList from '@/pages/shop/ProductList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ShopTotalCard from "@/pages/shop/ShopTotalCard";

import { db } from "@/lib/firebase"; 
import { addDoc, collection, DocumentData, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const ShopPage = ({shop}: DocumentData) => { 
  const { user } = useContext(UserContext)

  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("list")
  
  const [pendingProducts, setPendingProducts] = useState<Product[]>([])
  const [cartProducts, setCartProducts] = useState<Product[]>([])
  
  const [createProductsLoading, setCreateProductsLoading] = useState(false)
  
  const [loadingProducts, setLoadingProducts] = useState(true)
  
  const [removeProductLoading, setRemoveProductLoading] = useState(false)
  
  const [editProductLoading, setEditProductLoading] = useState(false)
  
  const formattedDate = formatDate(shop.date?.seconds);

  //These two methods can be moved to an util or helper file?!
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000); // Convertendo de segundos para milissegundos
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam do 0
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

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
          category: "others",
          isDone: false,
        }) 
      }
    }

    return products
  }

  async function getProducts(){
    const pendingList: Product[] = []
    const checkedList: Product[] = []

    try{
      //Verification if products is empty for avoid to do a get on firestore again and replicate the products on redux state. Try to improve this approach later
      if(user && !pendingProducts.length && !cartProducts.length){
        const pendingProductsRef = collection(db, `users/${user.uid}/shops/${shop.uid}/products`)
        const querySnapshot = await getDocs(pendingProductsRef);
     
        querySnapshot.forEach((doc) => {
          const {name, quantity, category, isDone, description, price} = doc.data()
          const product: Product = {
            uid: doc.id,
            name,
            quantity,
            category,
            isDone,
            description, 
            price
          }

          product.isDone ? checkedList.push(product) : pendingList.push(product)
        })

        setPendingProducts(pendingList)
        setCartProducts(checkedList)
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

  async function onSubmitProduct(data: z.infer<typeof ProductsCreateFormSchema>, form: UseFormReturn<{text: string;}>): Promise<void>{
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
        setPendingProducts(pendingProducts.concat(addedProducts))

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

  async function toggleProductStatus(toggleProduct: Product, status: boolean){
    try{   
      if(user){
        const productRef = doc(db, `users/${user.uid}/shops/${shop.uid}/products`, toggleProduct.uid)
      
        await updateDoc(productRef, { isDone: status })

        status === true 
        ? setPendingProducts(pendingProducts.filter((product) => product.uid != toggleProduct.uid))
        : setCartProducts(cartProducts.filter((product) => product.uid != toggleProduct.uid))
        
        toggleProduct.isDone = status
        
        status === true 
          ? setCartProducts(cartProducts.concat(toggleProduct))
          : setPendingProducts(pendingProducts.concat(toggleProduct))

          toast({
            variant: "success",
            title: "Sucesso!",
            description: status ? "Produto adicionado ao carrinho" : "Produto removido do carrinho",
          })
      }
    }
    catch (error) { 
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao mudar o status do produto"
      }) 
    } 
  }

  async function removeProduct(productUid: string, productIsDone: boolean){
    try{
      setRemoveProductLoading(true)
      if(user){
        const productRef = doc(db, `users/${user.uid}/shops/${shop.uid}/products`, productUid)
        await deleteDoc(productRef)

        productIsDone 
          ? setCartProducts(cartProducts.filter((product) => product.uid != productUid)) 
          : setPendingProducts(pendingProducts.filter((product) => product.uid != productUid))

          toast({
            variant: "success",
            title: "Sucesso!",
            description: "Produto excluído",
          })
      }
    }catch(error){
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao excluir o produto"
      })
    } finally{
      setRemoveProductLoading(false)
    }
  }
 
  async function editProduct(product: Product){
    try{
      setEditProductLoading(true)
      if(user){
        const productRef = doc(db, `users/${user.uid}/shops/${shop.uid}/products`, product.uid)
        await updateDoc(productRef, {
          name: product.name,
          quantity: product.quantity,
          category: product.category,
          description: product.description, 
          price: product.price
        })
        //TODO: This can be improved
        if(product.isDone){
          setCartProducts(
            cartProducts.map((element) =>  element.uid === product.uid ? {...element, ...product} : element)
          ) 
        } else {
          setPendingProducts(
            pendingProducts.map((element) =>  element.uid === product.uid ? {...element, ...product} : element)
          ) 
        }
 
          toast({
            variant: "success",
            title: "Sucesso!",
            description: "Produto editado",
          })
      }
    }catch(error){
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao editar o produto"
      })
    } finally{
      setEditProductLoading(false)
    }
  }

  useEffect( () => {
    getProducts()
  }, [])

  if(loadingProducts) return <LoadingPage />

  return (
    <div className='mt-16'>
      <section className='flex flex-col items-center my-3'>
        <span className='text-xs text-slate-400'>{ formattedDate }</span>
        <span className='text-lg text-black font-bold'>{shop.name}</span>
      </section>        

      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-80 bg-secondary">
          <TabsTrigger value="list" className="w-1/2 data-[state=active]:bg-accent">Lista</TabsTrigger>
          <TabsTrigger value="cart" className="w-1/2 data-[state=active]:bg-accent">Carrinho</TabsTrigger>
        </TabsList>
        <TabsContent value="list" forceMount={true} hidden={"list" !== activeTab}>
          <section className='flex flex-col justify-center items-center space-y-3'>
            {
              pendingProducts.length ? 
                <ProductList
                  products={pendingProducts}
                  onProductStatusChange={toggleProductStatus} 
                  onRemoveProduct={removeProduct}
                  removeProductLoading={removeProductLoading}
                  onEditProduct={editProduct}
                  editProductLoading={editProductLoading}
                />
                : 
                <BlankState image={productsBlankStateSVG} title="Nenhum produto pendente na lista" />
            }
        
            <ProductFormFooter createProductsLoading={createProductsLoading} onProductsAdd={onSubmitProduct} />
          </section>
        </TabsContent>
        <TabsContent value="cart" forceMount={true} hidden={"cart" !== activeTab}>
          <section className='pb-2'>
            <ShopTotalCard products={cartProducts} />
            
            {
              cartProducts.length ?
                <ProductList
                  products={cartProducts}
                  onProductStatusChange={toggleProductStatus} 
                  onRemoveProduct={removeProduct}
                  removeProductLoading={removeProductLoading}
                  onEditProduct={editProduct}
                  editProductLoading={editProductLoading}
                />
                :  
                <BlankState image={cartBlankStateSVG} title="Nenhum produto no carrinho :(" />
            }
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ShopPage