 
import PrivateLayout from '@/layouts/PrivateLayout'
import { Product } from '@/types'
import { formatDate } from '@/utils/formatters'
import { useContext, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { UserContext } from '@/context/commom/UserContext'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from '@/components/ui/use-toast'
import LoadingPage from '@/pages/commom/LoadingPage'; 
import ShopTotalCard from '@/components/shop/ShopTotalCard'
import ProductList from '@/components/shop/ProductList'

const ShopDetailPage = () => {
  const { user } = useContext(UserContext)

  const { shopId } = useParams()

  const { state } = useLocation() 

  const [loadingProducts, setLoadingProducts] = useState(true)

  const [products, setProducts] = useState<Product[]>([])

  async function getProducts(){
    const productsList: Product[] = [] 

    try{
      if(user){
        const productsRef = collection(db, `users/${user.uid}/shops/${shopId}/products`)
        const querySnapshot = await getDocs(productsRef);
     
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

          productsList.push(product) 
        })

        setProducts(productsList)
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

  useEffect(() => {
    getProducts()
  }, [])

  if(loadingProducts) return <LoadingPage />

  return (
    <PrivateLayout>
      <div className='mt-16 mb-3'>
        <section className='flex flex-col items-center my-3'>
          <span className='text-xs text-slate-400'>{ formatDate(state.shop.date?.seconds) }</span>
          <span className='text-lg text-black font-bold'>{state.shop.name}</span>
        </section> 

        <ShopTotalCard products={products} isVisualizer={true} /> 

        <ProductList 
          products={products}
          isVisualizer={true}
        />
      </div>
    </PrivateLayout>
  )
}

export default ShopDetailPage