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
    // Reducers (not component-computed arrays) so removal/restore always act
    // on the store's current state — a closure over useSelector's snapshot
    // goes stale across the RN-24 undo window and can double-insert on undo.
    removeCurrentShopProduct: (state, action: PayloadAction<{ uid: string; isDone: boolean }>) => {
      const { uid, isDone } = action.payload
      if (isDone) {
        state.currentShopCartProducts = state.currentShopCartProducts.filter(p => p.uid !== uid)
      } else {
        state.currentShopPendingProducts = state.currentShopPendingProducts.filter(p => p.uid !== uid)
      }
    },
    restoreCurrentShopProduct: (state, action: PayloadAction<Product>) => {
      const product = action.payload
      if (product.isDone) {
        if (!state.currentShopCartProducts.some(p => p.uid === product.uid)) {
          state.currentShopCartProducts.push(product)
        }
      } else {
        if (!state.currentShopPendingProducts.some(p => p.uid === product.uid)) {
          state.currentShopPendingProducts.push(product)
        }
      }
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
  removeCurrentShopProduct,
  restoreCurrentShopProduct,
  cleanStore,
} = shopSlice.actions

export default shopSlice.reducer