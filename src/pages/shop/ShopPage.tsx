import shopBlankStateSVG from "@/assets/images/shop-blank-state.svg" 
import productsBlankStateSVG from "@/assets/images/products-blank-state.svg" 
import ShopCreateDialog from '@/pages/shop/ShopCreateDialog'
import BlankState from '@/components/commom/BlankState'
import PrivateLayout from "@/layouts/PrivateLayout"

import { getDocs, collection, query, where, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useContext, useEffect, useState } from "react";
import { UserContext } from '@/context/commom/UserContext'
import Shop from "./Shop"; 
import LoadingPage from "../commom/LoadingPage"

const ShopPage = () => {

  const { user } = useContext(UserContext)

  const [currentShop, setCurrentShop] = useState<DocumentData>({})

  const [loading, setLoading] = useState(true)

  const getCurrentShop = async () => {
    if(user){
      const q = query(collection(db, "users", user.uid, "shops"), where("isDone", "==", false))
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {  
        const shop = doc.data()
        setCurrentShop(shop)
      }); 
    } 
    setLoading(false)
  }

  useEffect(() => {
    getCurrentShop()
  }, [])

  if (loading) return <LoadingPage />
  
  return (
    <PrivateLayout>
      {Object.keys(currentShop).length ? 
        (<Shop name={currentShop.name} date={currentShop.date?.seconds} image={productsBlankStateSVG} />) 
        :
        (<BlankState image={shopBlankStateSVG} title="Nenhuma compra criada ainda :(">
          <ShopCreateDialog onShopCreated={getCurrentShop} />
        </BlankState>)
    } 
    </PrivateLayout> 
  )
}

export default ShopPage

