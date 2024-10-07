import { configureStore } from '@reduxjs/toolkit'

import shopReducer from './shop/shopSlice'


export const store = configureStore({
  reducer: {
    store: shopReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['shop/setNextShops'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.date'],
        // Ignore these paths in the state
        ignoredPaths: ['store.currentShop', 'store.nextShops']
      },
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState> 
export type AppDispatch = typeof store.dispatch