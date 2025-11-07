import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import contentSlice from './slices/contentSlice';
import walletSlice from './slices/walletSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    content: contentSlice,
    wallet: walletSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['wallet/connectWallet', 'wallet/disconnectWallet'],
        ignoredPaths: ['wallet.provider', 'wallet.signer'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;