import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { Product } from "@/types";
import { DocumentData } from "firebase/firestore";

interface ShopState{
  currentShop: DocumentData;
  currentShopPendingProducts: Product[];
  currentShopCartProducts: Product[];
}

const initialState: ShopState = {
  currentShop: {},
  currentShopPendingProducts: [],
  currentShopCartProducts: [],
}

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    addCurrentShop: (state, action: PayloadAction<DocumentData>) => {
      state.currentShop = action.payload
    },
    completeCurrentShop: state => {
      state.currentShop = {}
      state.currentShopPendingProducts = []
      state.currentShopCartProducts = [] 
    },
    setCurrentShopPendingProducts: (state, action: PayloadAction<Product[]>) => {
      state.currentShopPendingProducts = action.payload
    }, 
    setCurrentShopCartProducts: (state, action: PayloadAction<Product[]>) => {
      state.currentShopCartProducts = action.payload
    },
    cleanStore: state => {
      state.currentShop = {}
      state.currentShopPendingProducts = []
      state.currentShopCartProducts = [] 
    }
  }
})

export const {
  addCurrentShop,
  completeCurrentShop,
  setCurrentShopPendingProducts,
  setCurrentShopCartProducts, 
  cleanStore,
} = shopSlice.actions

export default shopSlice.reducer