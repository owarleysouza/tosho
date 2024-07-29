import { useContext, useEffect, useState } from "react";

import shopBlankStateSVG from "@/assets/images/shop-blank-state.svg"  

import PrivateLayout from "@/layouts/PrivateLayout"
import ShopCreateDialog from '@/pages/shop/ShopCreateDialog'
import LoadingPage from "@/pages/commom/LoadingPage"
import Shop from "@/pages/shop/ShopPage"; 
import { useToast } from "@/components/ui/use-toast"
import BlankState from '@/components/commom/BlankState'

import { UserContext } from '@/context/commom/UserContext'

import { getDocs, collection, query, where, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Home = () => {

  const { user } = useContext(UserContext)
  //TODO: Create a correct Shop Type to replace DocumentData type
  const [currentShop, setCurrentShop] = useState<DocumentData>({})

  const [loading, setLoading] = useState(true)

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

  useEffect(() => { 
    getCurrentShop()
  }, [])

  if (loading) return <LoadingPage />
  
  return (
    <PrivateLayout>
      {Object.keys(currentShop).length ? 
        (<Shop shop={currentShop} />) 
        :
        (<BlankState image={shopBlankStateSVG} title="Nenhuma compra criada ainda :(">
          <ShopCreateDialog onShopCreated={getCurrentShop} />
        </BlankState>)
    } 
    </PrivateLayout> 
  )
}

export default Home

