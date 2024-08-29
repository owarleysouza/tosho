import { configureStore } from '@reduxjs/toolkit'

import shopReducer from './shop/shopSlice'


export const store = configureStore({
  reducer: {
    shop: shopReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.date'],
        // Ignore these paths in the state
        ignoredPaths: ['shop.currentShop']
      },
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState> 
export type AppDispatch = typeof store.dispatch