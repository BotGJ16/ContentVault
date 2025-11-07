import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  provider: any | null;
  signer: any | null;
  isConnecting: boolean;
  error: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  balance: '0',
  chainId: null,
  provider: null,
  signer: null,
  isConnecting: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state, action: PayloadAction<{
      address: string;
      balance: string;
      chainId: number;
      provider: any;
      signer: any;
    }>) => {
      state.isConnected = true;
      state.address = action.payload.address;
      state.balance = action.payload.balance;
      state.chainId = action.payload.chainId;
      state.provider = action.payload.provider;
      state.signer = action.payload.signer;
      state.isConnecting = false;
      state.error = null;
    },
    disconnectWallet: (state) => {
      state.isConnected = false;
      state.address = null;
      state.balance = '0';
      state.chainId = null;
      state.provider = null;
      state.signer = null;
      state.isConnecting = false;
      state.error = null;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
    },
    setChainId: (state, action: PayloadAction<number>) => {
      state.chainId = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnecting = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  connectWallet,
  disconnectWallet,
  setConnecting,
  setBalance,
  setChainId,
  setError,
  clearError,
} = walletSlice.actions;

export default walletSlice.reducer;