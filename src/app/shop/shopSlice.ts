import { Product } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ShopState{
  value: Product[]
}

const initialState: ShopState = {
  value: []
}

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    addProducts: (state, action: PayloadAction<Product[]>) => {
      state.value = state.value.concat(action.payload)  
    },
    cleanProducts: state => {
      state.value = []
    }
  }
})

export const { addProducts, cleanProducts } = shopSlice.actions

export default shopSlice.reducer