import React from 'react';
import { useWallet } from '../contexts/WalletContext';

// Simple wallet icon using SVG
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 7.5H4.5C3.675 7.5 3 8.175 3 9V18C3 18.825 3.675 19.5 4.5 19.5H19.5C20.325 19.5 21 18.825 21 18V9C21 8.175 20.325 7.5 19.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 19.5V6C18 5.60218 17.842 5.22064 17.5607 4.93934C17.2794 4.65804 16.8978 4.5 16.5 4.5H6C5.60218 4.5 5.22064 4.65804 4.93934 4.93934C4.65804 5.22064 4.5 5.60218 4.5 6V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12.75H17.25C16.837 12.75 16.5 13.087 16.5 13.5V15C16.5 15.413 16.837 15.75 17.25 15.75H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Wallet: React.FC = () => {
  const { balance, sessionProfitPercent } = useWallet();

  // Format balance to handle very large or small numbers for better display on mobile
  const formatBalance = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format the profit percentage for display
  const formatProfit = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="wallet">
      <div className="wallet-content">
        <div className="wallet-icon">
          <WalletIcon />
        </div>
        <div className="wallet-info">
          <div className="wallet-balance">
            {formatBalance(balance)}
          </div>
          <div 
            className="wallet-profit"
            style={{ 
              color: sessionProfitPercent >= 0 ? '#00bf63' : '#ff6b6b'
            }}
          >
            {formatProfit(sessionProfitPercent)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet; 