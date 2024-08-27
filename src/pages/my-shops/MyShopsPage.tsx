import { useContext, useEffect, useState } from "react";

import { UserContext } from '@/context/commom/UserContext'

import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, DocumentData, getDocs, query, where } from 'firebase/firestore';

import PrivateLayout from '@/layouts/PrivateLayout'
import { toast } from '@/components/ui/use-toast';
import LoadingPage from '@/pages/commom/LoadingPage';
import ShopCard from "@/pages/my-shops/ShopCard";


const MyShopsPage = () => {
  const { user } = useContext(UserContext)

  //TODO: Create a correct Shop Type to replace DocumentData type
  const [shops, setShops] = useState<DocumentData[]>([])

  const [loading, setLoading] = useState(true)

  const [removeShopLoading, setRemoveShopLoading] = useState(false)

  async function getShops(){ 
    const myShops: DocumentData[] = []
    try{
      if(!user || !Object.keys(user).length){ 
        toast({
          variant: "destructive",
          title: "Ops! Algo de errado aconteceu",
          description: "Um erro inesperado aconteceu ao carregar o usuário"
        }) 
        return
      }
      const shopsRef  = query(collection(db, "users", user.uid, "shops"), where("isDone", "==", true))
      const querySnapshot = await getDocs(shopsRef);
 
      //TODO: Type this shop later
      querySnapshot.forEach((doc) => {
        const {name, date, total} = doc.data()
        const shop = {
          uid: doc.id,
          name,
          date,
          total
        }

        myShops.push(shop)
      })
 
      myShops.sort((a, b) => b.date.seconds - a.date.seconds)
      setShops(myShops)
    } catch (error) { 
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao carregar as compras"
      }) 
    } finally {
      setLoading(false)
    } 
  }

  async function removeShop(shopUid: string){
    try{
      setRemoveShopLoading(true)
      if(user){
        const shopRef = doc(db, `users/${user.uid}/shops`, shopUid)
        await deleteDoc(shopRef)

        setShops(shops.filter((shop) => shop.uid != shopUid))

          toast({
            variant: "success",
            title: "Sucesso!",
            description: "Compra excluída",
          })
      }
    }catch(error){
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao excluir a compra"
      })
    } finally{
      setRemoveShopLoading(false)
    }
  }

  useEffect(() => {
    getShops()
  }, [])

  if (loading) return <LoadingPage />

  return (
    <PrivateLayout>
      <div className='flex flex-col items-center mt-16'> 
        <span className='text-lg text-black font-bold my-3'>Compras concluídas</span>
        <section className='space-y-2'>
          {
            shops.map((shop) => 
              (
                <ShopCard 
                  key={shop.uid}
                  shop={shop}
                  onRemoveShop={removeShop}
                  removeShopLoading={removeShopLoading}
                />
              )
            )
          }
        </section>
      </div>
    </PrivateLayout>
    
  )
}

export default MyShopsPage
