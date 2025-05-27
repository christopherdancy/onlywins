import React, { useState, useEffect } from 'react';
import CardStack from './components/CardStack';
import Wallet from './components/Wallet';
import { WalletProvider } from './contexts/WalletContext';
import TransactionAnimationProvider from './contexts/TransactionAnimationContext';
import './App.css';

const App: React.FC = () => {
  // Track game progress for the header
  const [gameState, setGameState] = useState({
    inProgress: false,
    currentAsset: 0,
    totalAssets: 25
  });

  // Create a ref we can pass to child components to communicate progress
  const gameStateRef = React.useRef(gameState);

  // Update the ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Function to update game state from CardStack component
  const updateGameState = (state: {
    inProgress: boolean;
    currentAsset: number;
    totalAssets: number;
  }) => {
    setGameState(state);
  };

  return (
    <TransactionAnimationProvider>
      <WalletProvider>
        <div className="app">
          <header className="app-header">
            <h1>😈 FEEN</h1>
            
            {/* Game progress display */}
            {gameState.inProgress && (
              <div className="game-progress">
                <span className="progress-text">
                  Asset {gameState.currentAsset} of {gameState.totalAssets}
                </span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(gameState.currentAsset / gameState.totalAssets) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            <Wallet />
          </header>
          <main className="app-main">
            <CardStack updateGameState={updateGameState} />
          </main>
        </div>
      </WalletProvider>
    </TransactionAnimationProvider>
  );
};

export default App;
