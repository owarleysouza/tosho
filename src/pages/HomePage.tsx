import shopBlankStateSVG from "@/assets/images/shop-blank-state.svg" 
import ShopCreateDialog from '@/components/shop/ShopCreateDialog'
import BlankState from '@/components/commom/BlankState'
import PrivateLayout from "@/layouts/PrivateLayout"

const Home = () => {

  return (
    <PrivateLayout>
      <BlankState image={shopBlankStateSVG} title="Nenhuma compra criada ainda :(">
        <ShopCreateDialog />
      </BlankState> 
    </PrivateLayout> 
  )
}

export default Home

