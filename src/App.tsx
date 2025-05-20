import React from 'react';
import CardStack from './components/CardStack';
import Wallet from './components/Wallet';
import { WalletProvider } from './contexts/WalletContext';
import TransactionAnimationProvider from './contexts/TransactionAnimationContext';
import './App.css';

const App: React.FC = () => {
  return (
    <TransactionAnimationProvider>
      <WalletProvider>
        <div className="app">
          <header className="app-header">
            <h1>OnlyWins</h1>
            <Wallet />
          </header>
          <main className="app-main">
            <CardStack />
          </main>
        </div>
      </WalletProvider>
    </TransactionAnimationProvider>
  );
};

export default App;
