import React, { createContext, useState, useContext, ReactNode } from 'react';

interface WalletContextType {
  balance: number;
  startingBalance: number;
  sessionProfitPercent: number;
  updateBalance: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  initialBalance?: number;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ 
  children, 
  initialBalance = 100 // Default $100 starting balance
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [startingBalance] = useState(initialBalance);

  // Calculate session profit percentage
  const sessionProfitPercent = ((balance - startingBalance) / startingBalance) * 100;

  // Update wallet balance (positive for gain, negative for spending)
  const updateBalance = (amount: number) => {
    setBalance(prevBalance => prevBalance + amount);
  };

  return (
    <WalletContext.Provider value={{ 
      balance, 
      startingBalance,
      sessionProfitPercent,
      updateBalance 
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 