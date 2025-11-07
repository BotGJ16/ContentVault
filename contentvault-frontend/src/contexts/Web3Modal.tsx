'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { useDispatch } from 'react-redux';
import { connectWallet, disconnectWallet, setBalance } from '@/store/slices/walletSlice';

// Web3Modal configuration
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your_project_id';

const chains = [mainnet, sepolia];
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata: {
    name: 'ContentVault',
    description: 'Decentralized Content Monetization Platform',
    url: 'https://contentvault.io',
    icons: ['https://contentvault.io/icon.png'],
  },
});

// Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#3b82f6',
    '--w3m-color-mix-strength': 40,
  },
});

interface Web3ModalContextType {
  isReady: boolean;
}

const Web3ModalContext = createContext<Web3ModalContextType>({ isReady: false });

interface Web3ModalProviderProps {
  children: ReactNode;
}

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Listen for wallet connection events
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          dispatch(disconnectWallet());
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        // Handle chain change
        window.location.reload();
      });
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [dispatch]);

  if (!isReady) {
    return null;
  }

  return (
    <Web3ModalContext.Provider value={{ isReady }}>
      <WagmiConfig config={wagmiConfig}>
        {children}
      </WagmiConfig>
    </Web3ModalContext.Provider>
  );
}

export const useWeb3Modal = () => {
  const context = useContext(Web3ModalContext);
  if (!context) {
    throw new Error('useWeb3Modal must be used within Web3ModalProvider');
  }
  return context;
};