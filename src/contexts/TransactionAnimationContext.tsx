import React, { createContext, useContext, useState, useCallback } from 'react';

interface TransactionAnimationContextType {
  showTransactionAnimation: (amount: number) => void;
  isAnimating: boolean;
  transactionAmount: number | null;
}

const TransactionAnimationContext = createContext<TransactionAnimationContextType | undefined>(undefined);

export const useTransactionAnimation = () => {
  const context = useContext(TransactionAnimationContext);
  if (!context) {
    throw new Error('useTransactionAnimation must be used within a TransactionAnimationProvider');
  }
  return context;
};

export const TransactionAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState<number | null>(null);

  const showTransactionAnimation = useCallback((amount: number) => {
    // Don't trigger animation if one is already in progress
    if (isAnimating) return;
    
    setTransactionAmount(amount);
    setIsAnimating(true);
    
    // Reset animation state after it completes
    setTimeout(() => {
      setIsAnimating(false);
      setTransactionAmount(null);
    }, 1500); // Match animation duration from CSS
  }, [isAnimating]);

  const value = {
    showTransactionAnimation,
    isAnimating,
    transactionAmount
  };

  return (
    <TransactionAnimationContext.Provider value={value}>
      {children}
    </TransactionAnimationContext.Provider>
  );
};

export default TransactionAnimationProvider; 