import shopBlankStateSVG from "@/assets/images/shop-blank-state.svg" 
import ShopCreateDialog from '@/pages/shop/ShopCreateDialog'
import BlankState from '@/components/commom/BlankState'
import PrivateLayout from "@/layouts/PrivateLayout"

const ShopPage = () => {

  return (
    <PrivateLayout>
      <BlankState image={shopBlankStateSVG} title="Nenhuma compra criada ainda :(">
        <ShopCreateDialog />
      </BlankState> 
    </PrivateLayout> 
  )
}

export default ShopPage

