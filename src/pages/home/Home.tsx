import { useContext, useEffect, useState } from "react";

import shopBlankStateSVG from "@/assets/images/shop-blank-state.svg"  

import PrivateLayout from "@/layouts/PrivateLayout"
import ShopCreateDialog from '@/pages/shop/ShopCreateDialog'
import LoadingPage from "@/pages/commom/LoadingPage"
import Shop from "@/pages/shop/ShopPage"; 
import { useToast } from "@/components/ui/use-toast"
import BlankState from '@/components/commom/BlankState'

import { UserContext } from '@/context/commom/UserContext'

import { getDocs, collection, query, where, DocumentData, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Home = () => {

  const { user } = useContext(UserContext)
  //TODO: Create a correct Shop Type to replace DocumentData type
  const [currentShop, setCurrentShop] = useState<DocumentData>({})

  const [loading, setLoading] = useState(true)

  const [completeShopLoading, setCompleteShopLoading] = useState(false)

  const { toast } = useToast()
  
  async function getCurrentShop(){ 
    try{
      if(!user || !Object.keys(user).length){ 
        toast({
          variant: "destructive",
          title: "Ops! Algo de errado aconteceu",
          description: "Um erro inesperado aconteceu ao carregar o usuário"
        }) 
        return
      }
      const openShopsRef  = query(collection(db, "users", user.uid, "shops"), where("isDone", "==", false))
      const querySnapshot = await getDocs(openShopsRef);
      const currentShopDocument = querySnapshot.docs[0]

      if(currentShopDocument){
        const shop = {
          uid: currentShopDocument.id,
          ...currentShopDocument.data()
        }
        setCurrentShop(shop)
      }  
    } catch (error) { 
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao carregar a compra"
      }) 
    } finally {
      setLoading(false)
    } 
  }

  async function completeShop(shopTotal: number){ 
    try{   
      setCompleteShopLoading(true)
      if(user){
        const shopRef = doc(db, `users/${user.uid}/shops`, currentShop.uid)
      
        await updateDoc(shopRef, { isDone: true, total: shopTotal })

        setCurrentShop([])
         
        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Compra concluída com sucesso",
        })
      }
    }
    catch (error) { 
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: "Um erro inesperado aconteceu ao concluir a compra"
      }) 
    } finally{
      setCompleteShopLoading(false)
    }
  }

  useEffect(() => { 
    getCurrentShop()
  }, [])

  if (loading) return <LoadingPage />
  
  return (
    <PrivateLayout>
      {Object.keys(currentShop).length ? 
        (<Shop 
          shop={currentShop} 
          onCompleteShop={completeShop}
          completeShopLoading={completeShopLoading}
        />) 
        :
        (
          <section className="h-screen flex flex-col justify-center items-center">
            <BlankState image={shopBlankStateSVG} title="Nenhuma compra criada ainda :(">
              <ShopCreateDialog onShopCreated={getCurrentShop} />
            </BlankState>
          </section>
        )
    } 
    </PrivateLayout> 
  )
}

export default Home

