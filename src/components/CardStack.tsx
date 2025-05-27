import React, { useState, useEffect, useCallback, useRef } from 'react';
import SwipeableCard from './SwipeableCard';
import IntroCard from './IntroCard';
import ResultsCard from './ResultsCard';
import { Asset, SwipeDirection, ChartStrategy, ActiveTrade, ChartPoint } from '../types';
import { loadPreGeneratedAssets, generateRandomAsset, prepareChartDataForRealTimeSimulation } from '../utils/chartUtils';
import { useWallet } from '../contexts/WalletContext';

interface CardStackProps {
  updateGameState: (state: {
    inProgress: boolean;
    currentAsset: number;
    totalAssets: number;
  }) => void;
}

// Create a swipeable wrapper component for non-chart cards
const SwipeableWrapper: React.FC<{
  children: React.ReactNode;
  onSwiped: (direction: SwipeDirection) => void;
  isIntroCard?: boolean;
}> = ({ children, onSwiped, isIntroCard = false }) => {
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [direction, setDirection] = React.useState<SwipeDirection>({
    isLeft: false,
    isRight: false,
    isUp: false,
    isDown: false,
  });
  
  // Track swipe progress for visual effects
  const [swipeProgress, setSwipeProgress] = React.useState({ left: 0, right: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX - dragStart.x;
    const y = e.touches[0].clientY - dragStart.y;
    setDragOffset({ x, y });
    updateDirection(x, y);
    updateSwipeProgress(x);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 0) return; // No button pressed
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    setDragOffset({ x, y });
    updateDirection(x, y);
    updateSwipeProgress(x);
  };

  const handleTouchEnd = () => {
    finalizeDrag();
  };

  const handleMouseUp = () => {
    finalizeDrag();
  };

  const updateSwipeProgress = (x: number) => {
    const threshold = 100;
    const leftProgress = x < 0 ? Math.min(Math.abs(x) / threshold, 1) : 0;
    const rightProgress = x > 0 ? Math.min(x / threshold, 1) : 0;
    setSwipeProgress({ left: leftProgress, right: rightProgress });
  };

  const updateDirection = (x: number, y: number) => {
    const threshold = 30;
    setDirection({
      isLeft: x < -threshold,
      isRight: x > threshold,
      isUp: y < -threshold,
      isDown: y > threshold,
    });
  };

  const finalizeDrag = () => {
    const anyDirection = Object.values(direction).some((val) => val);
    if (anyDirection) {
      onSwiped(direction);
    }
    setDragOffset({ x: 0, y: 0 });
    setDirection({
      isLeft: false,
      isRight: false,
      isUp: false,
      isDown: false,
    });
    setSwipeProgress({ left: 0, right: 0 });
  };

  // Handle action button clicks
  const handleActionButtonClick = (action: 'left' | 'right' | 'up' | 'down') => {
    const directionObj: SwipeDirection = {
      isLeft: action === 'left',
      isRight: action === 'right',
      isUp: action === 'up',
      isDown: action === 'down',
    };
    onSwiped(directionObj);
  };

  // Calculate rotation and translation based on drag
  const cardStyle: React.CSSProperties = {
    transform: `translateX(${dragOffset.x}px) translateY(${Math.min(Math.abs(dragOffset.x) * 0.15, 30) * (dragOffset.y > 0 ? 1 : -1)}px) rotate(${
      dragOffset.x * 0.08
    }deg)`,
    transition: dragOffset.x === 0 && dragOffset.y === 0 ? 'transform 0.3s ease' : 'none',
    boxShadow: 
      swipeProgress.left > 0 
        ? `${-8 * swipeProgress.left}px 0 20px rgba(255, 107, 107, ${0.2 + swipeProgress.left * 0.2})` 
        : swipeProgress.right > 0 
          ? `${8 * swipeProgress.right}px 0 20px rgba(75, 192, 192, ${0.2 + swipeProgress.right * 0.2})` 
          : 'none'
  };

  // Overlay styles with opacity based on swipe progress
  const leftOverlayStyle: React.CSSProperties = {
    opacity: swipeProgress.left,
    transform: `translate(-50%, -50%) rotate(-12deg) scale(${0.8 + swipeProgress.left * 0.5})`,
    transition: swipeProgress.left === 0 ? 'opacity 0.3s ease, transform 0.3s ease' : 'none'
  };

  const rightOverlayStyle: React.CSSProperties = {
    opacity: swipeProgress.right,
    transform: `translate(-50%, -50%) rotate(12deg) scale(${0.8 + swipeProgress.right * 0.5})`,
    transition: swipeProgress.right === 0 ? 'opacity 0.3s ease, transform 0.3s ease' : 'none'
  };

  // Get overlay text based on card type
  const leftOverlayText = isIntroCard ? "SKIP" : "EXIT";
  const rightOverlayText = isIntroCard ? "START" : "RESTART";
  
  // Instruction text for buttons
  const actionInstructionText = isIntroCard ? "Swipe right to begin" : "Swipe right to restart";

  return (
    <div className="swipeable-card-container">
      <div
        className="swipeable-card"
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Action Overlays - Always render but control opacity with swipeProgress */}
        <div className="action-overlay center left-action" style={leftOverlayStyle}>
          {leftOverlayText}
        </div>
        
        <div className="action-overlay center right-action" style={rightOverlayStyle}>
          {rightOverlayText}
        </div>

        {children}
      </div>
    </div>
  );
};

const CardStack: React.FC<CardStackProps> = ({ updateGameState }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null); // Track active trade
  const [showToast, setShowToast] = useState(false); // State for toast notification
  const [toastMessage, setToastMessage] = useState(''); // Message for toast
  const { updateBalance, balance } = useWallet();
  const [volatilityState, setVolatilityState] = useState({
    inDump: false,         // Currently in a dump phase (for uptrend) or pump phase (for downtrend)
    dumpComplete: false,   // Finished the dump/pump phase (now in recovery/correction)
    dumpDepth: 0,          // How deep the dump/pump will go (% change)
    recoveryStrength: 0,   // How strong the recovery/correction will be
    dumpCounter: 0,        // Counter for dump/pump duration
    recoveryCounter: 0,    // Counter for recovery/correction duration
    ticksSinceDump: 0      // Ticks since last volatility event
  });
  
  // Keep track of future data points for each asset
  const futureDataRef = useRef<{[key: string]: ChartPoint[]}>({});
  
  // Track game state
  const [gameProgress, setGameProgress] = useState(0); // 0=intro, 1-25=assets, 26=results
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [initialBalance, setInitialBalance] = useState(0);
  const [finalBalance, setFinalBalance] = useState(0);

  // Initialize assets on mount
  useEffect(() => {
    const loadInitialAssets = async () => {
      // Reset the asset loading index to ensure we start with asset-1
      (loadPreGeneratedAssets as any).lastAssetIndex = 0;
      
      // Load all 10 assets at once to ensure we have the complete game
      const initialAssets = await loadPreGeneratedAssets(10);
      
      // Prepare future data for each asset
      initialAssets.forEach(asset => {
        const { initialData, futureData } = prepareChartDataForRealTimeSimulation(asset);
        
        // Store future data for later use
        futureDataRef.current[asset.id] = futureData;
        
        // Update the asset with only the initial data
        asset.chartData = initialData;
        asset.currentMarketCap = initialData[initialData.length - 1].marketCap;
      });
      
      setAssets(initialAssets);
      setGameProgress(0); // Start at intro card
      setGameStarted(false);
      setGameEnded(false);
    };
    
    loadInitialAssets();
  }, []);

  // Effect to simulate realtime chart movement
  useEffect(() => {
    if (!activeAsset || !gameStarted || gameEnded) return;
    
    // Maximum reasonable market cap (10 billion)
    const MAX_MARKET_CAP = 10_000_000_000;
    
    // Minimum reasonable market cap (prevent going to zero)
    const MIN_MARKET_CAP = 5_000;
    
    const interval = setInterval(() => {
      // Update volatility state first (keeping existing volatility logic)
      setVolatilityState(prevState => {
        let newState = { ...prevState };
        newState.ticksSinceDump += 1;
        
        // Check if we should start a new volatility event
        if (!newState.inDump && !newState.dumpComplete && 
            newState.ticksSinceDump >= (20 + Math.floor(Math.random() * 10))) {
          // 20% chance of starting a volatility event when the counter hits
          if (Math.random() < 0.2) {
            newState.inDump = true;
            newState.dumpDepth = 0.15 + (Math.random() * 0.25);
            newState.dumpCounter = 3 + Math.floor(Math.random() * 2);
            newState.recoveryStrength = newState.dumpDepth * (0.7 + (Math.random() * 0.4));
            newState.ticksSinceDump = 0;
          }
        }
        
        // Handle active volatility phase
        if (newState.inDump) {
          newState.dumpCounter -= 1;
          
          // Check if volatility event is complete
          if (newState.dumpCounter <= 0) {
            newState.inDump = false;
            newState.dumpComplete = true;
            newState.recoveryCounter = 4 + Math.floor(Math.random() * 3);
          }
        }
        // Handle recovery/correction phase
        else if (newState.dumpComplete) {
          newState.recoveryCounter -= 1;
          
          // Check if recovery is complete
          if (newState.recoveryCounter <= 0) {
            newState.dumpComplete = false;
          }
        }
        
        return newState;
      });
      
      // Update the asset by feeding the next data point from pregenerated future data
      setActiveAsset(prevAsset => {
        if (!prevAsset) return null;
        
        // Get future data for this asset
        const futureData = futureDataRef.current[prevAsset.id] || [];
        
        if (futureData.length === 0) {
          // No more future data, keep the last point but update timestamp
          const lastPoint = prevAsset.chartData[prevAsset.chartData.length - 1];
          const newChartData = [...prevAsset.chartData.slice(1), {
            timestamp: Date.now(),
            marketCap: lastPoint.marketCap
          }];
          
          return {
            ...prevAsset,
            chartData: newChartData
          };
        }
        
        // Take the next point from future data
        const nextPoint = futureData.shift();
        
        // Update future data reference
        futureDataRef.current[prevAsset.id] = futureData;
        
        // Add volatility effects based on state
        let marketCap = nextPoint!.marketCap;
        
        // Apply volatility from current volatility state
        if (volatilityState.inDump) {
          const volatilityPercent = volatilityState.dumpDepth / volatilityState.dumpCounter;
          
          if (prevAsset.strategy === ChartStrategy.UPTREND_WITH_DUMPS) {
            // For uptrend: dump means price drop
            marketCap = marketCap * (1 - volatilityPercent * 0.8);
          } else {
            // For downtrend: dump means price pump
            marketCap = marketCap * (1 + volatilityPercent * 0.8);
          }
        }
        // Handle recovery/correction phase
        else if (volatilityState.dumpComplete) {
          const recoveryPercent = volatilityState.recoveryStrength / volatilityState.recoveryCounter;
          
          if (prevAsset.strategy === ChartStrategy.UPTREND_WITH_DUMPS) {
            // For uptrend: recovery means price increase
            marketCap = marketCap * (1 + recoveryPercent * 0.75);
          } else {
            // For downtrend: recovery means price decrease (correction)
            marketCap = marketCap * (1 - recoveryPercent * 0.75);
          }
        }
        
        // Enforce limits
        // marketCap = Math.min(marketCap, MAX_MARKET_CAP);
        // marketCap = Math.max(marketCap, MIN_MARKET_CAP);
        
        // Calculate price if asset has totalSupply
        let price = undefined;
        if (prevAsset.totalSupply) {
          price = marketCap / prevAsset.totalSupply;
        }
        
        // Add new point and remove oldest to keep a moving window
        const newChartData = [...prevAsset.chartData.slice(1), {
          timestamp: Date.now(),
          marketCap: marketCap,
          ...(price !== undefined && { price })
        }];
        
        return {
          ...prevAsset,
          currentMarketCap: marketCap,
          ...(price !== undefined && { currentPrice: price }),
          chartData: newChartData
        };
      });
    }, 1000); // Update every 1 second to match the pregenerated data timestamps
    
    return () => clearInterval(interval);
  }, [activeAsset, volatilityState, gameStarted, gameEnded]);

  // When moving to the next card, update the active asset
  useEffect(() => {
    if (gameProgress === 0) {
      // Intro card
      setActiveAsset(null);
      return;
    }
    
    if (gameProgress > assets.length || gameProgress === 26) {
      // Results card
      setActiveAsset(null);
      setGameEnded(true);
      setFinalBalance(balance);
      return;
    }
    
    // Regular asset card (1-indexed)
    const assetIndex = gameProgress - 1;
    if (assets.length > assetIndex) {
      setActiveAsset(assets[assetIndex]);
      
      // Reset volatility state for the new asset
      setVolatilityState({
        inDump: false,
        dumpComplete: false,
        dumpDepth: 0,
        recoveryStrength: 0,
        dumpCounter: 0,
        recoveryCounter: 0,
        ticksSinceDump: 0
      });
    }
  }, [gameProgress, assets, balance]);

  // Start the game
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameProgress(1); // Move to first asset
    setInitialBalance(10); // Always start with $100
    
    // Reset wallet balance to $10
    const resetAmount = 10 - balance;
    updateBalance(resetAmount);
  }, [balance, updateBalance]);

  // Handle trade entry or double down
  const handleTradeEntry = useCallback(() => {
    if (!activeAsset || !gameStarted || gameEnded) return;
    
    const EXPIRY_DURATION = 30000; // 30 seconds in milliseconds
    const now = Date.now();
    const ENTRY_AMOUNT = -1; // Consistent $1 investment for entering or doubling down
    
    // Check if player has enough balance to enter or double down
    if (balance < 1) {
      // Not enough funds to make the trade
      // Could add a notification here to inform the player
      return;
    }
    
    if (activeTrade && activeTrade.assetId === activeAsset.id) {
      // Double down - add another $1 investment
      updateBalance(ENTRY_AMOUNT); // Deduct from wallet with animation
      
      // Show double down toast notification
      setToastMessage("Added <span class='amount'>$1</span>");
      setShowToast(true);
      
      // Hide toast after animation
      setTimeout(() => {
        setShowToast(false);
      }, 2500);
      
      setActiveTrade({
        ...activeTrade,
        entryPrices: [...activeTrade.entryPrices, activeAsset.currentMarketCap],
        totalInvestment: activeTrade.totalInvestment + 1,
        // Reset expiry time on double down to give more time
        expiryTime: now + EXPIRY_DURATION
      });
    } else {
      // New trade entry
      updateBalance(ENTRY_AMOUNT); // Deduct from wallet with animation
      setActiveTrade({
        assetId: activeAsset.id,
        entryPrices: [activeAsset.currentMarketCap],
        totalInvestment: 1,
        entryTime: now,
        expiryTime: now + EXPIRY_DURATION
      });
    }
    
    // Show match notification
    // setShowMatch(true);
    // setTimeout(() => setShowMatch(false), 1500);
  }, [activeAsset, activeTrade, updateBalance, setActiveTrade, gameStarted, gameEnded, balance]);
  
  // Handle trade exit and calculate profits - wrap in useCallback
  const handleTradeExit = useCallback(() => {
    if (!activeAsset || !activeTrade || activeTrade.assetId !== activeAsset.id) return;
    
    // Calculate profit/loss
    const avgEntryPrice = activeTrade.entryPrices.reduce((sum, price) => sum + price, 0) / 
                        activeTrade.entryPrices.length;
    const currentPrice = activeAsset.currentMarketCap;
    const profitPercent = (currentPrice - avgEntryPrice) / avgEntryPrice;
    
    // Calculate final position value based on current price
    const positionValue = activeTrade.totalInvestment * (1 + profitPercent);
    
    // Use position value as return amount (minimum return is 10% of investment)
    const returnAmount = Math.max(positionValue, activeTrade.totalInvestment * 0.1);
    
    // Update wallet balance and trigger animation in Wallet component
    updateBalance(returnAmount);
    
    // Exit trade
    setActiveTrade(null);
    
    // Move to next asset
    setGameProgress(prevProgress => {
      const newProgress = prevProgress + 1;
      // If we've gone through all assets, show results
      if (newProgress > assets.length) {
        return 26; // Results screen
      }
      return newProgress;
    });
  }, [activeAsset, activeTrade, updateBalance, setActiveTrade, assets.length]);

  // Add effect to check for trade expiries
  useEffect(() => {
    if (!activeTrade || !activeAsset) return;
    
    const checkExpiry = () => {
      const now = Date.now();
      
      
      if (activeTrade && now >= activeTrade.expiryTime) {
        console.log('Trade expired! Executing auto-exit.');
        // Automatically exit the trade when it expires
        handleTradeExit();
        
        // Show a notification that the trade expired
        const notification = document.createElement('div');
        notification.className = 'expiry-notification';
        notification.innerHTML = `
          <div class="expiry-message">Position Expired</div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after animation completes
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 500);
        }, 1500);
      }
    };
    
    // Check more frequently (every 50ms) for more responsive expiry
    const interval = setInterval(checkExpiry, 50);
    
    // Run the check immediately when the effect runs
    checkExpiry();
    
    return () => clearInterval(interval);
  }, [activeTrade, activeAsset, handleTradeExit]);

  // If we're running low on cards, generate more
  const loadMoreAssets = async () => {
    if (currentIndex >= assets.length - 3) {
      const newAssets = await loadPreGeneratedAssets(3);
      
      // Prepare future data for each new asset
      newAssets.forEach(asset => {
        const { initialData, futureData } = prepareChartDataForRealTimeSimulation(asset);
        
        // Store future data for later use
        futureDataRef.current[asset.id] = futureData;
        
        // Update the asset with only the initial data
        asset.chartData = initialData;
        asset.currentMarketCap = initialData[initialData.length - 1].marketCap;
      });
      
      setAssets(prevAssets => [...prevAssets, ...newAssets]);
    }
  };

  const handleSwiped = (direction: SwipeDirection) => {
    // Handle intro card
    if (gameProgress === 0) {
      if (direction.isRight) {
        startGame();
      }
      return;
    }
    
    // Handle results card
    if (gameProgress === 26) {
      if (direction.isRight) {
        // Reset game
        resetGame();
        return;
      }
    }
    
    // Regular asset card
    if (!activeAsset) return;
    
    if (direction.isRight) {
      // Is this the currently active trade? Double down
      // Otherwise enter new trade
      handleTradeEntry();
    } else if (direction.isLeft) {
      // If we have an active trade for this asset, exit it
      if (activeTrade && activeTrade.assetId === activeAsset.id) {
        handleTradeExit();
      } else {
        // Just skip to next card
        setGameProgress(prevProgress => {
          const newProgress = prevProgress + 1;
          // If we've gone through all assets, show results
          if (newProgress > assets.length) {
            return 26; // Results screen
          }
          return newProgress;
        });
      }
    }

    // If we're running low on cards, load more
    loadMoreAssets();
  };

  // Function to reset the game
  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameEnded(false);
    setGameProgress(0);
    
    // Reset wallet balance to $100
    const resetAmount = 10 - balance;
    updateBalance(resetAmount);
  }, [balance, updateBalance]);

  // Determine what to render based on game progress
  const renderCard = () => {
    if (gameProgress === 0) {
      // Intro card should be swipeable
      return (
        <SwipeableWrapper onSwiped={handleSwiped} isIntroCard={true}>
          <IntroCard onStart={startGame} />
        </SwipeableWrapper>
      );
    }
    
    if (gameProgress === 26 || gameProgress > assets.length) {
      // Results card should be swipeable
      return (
        <SwipeableWrapper onSwiped={handleSwiped}>
          <ResultsCard 
            initialBalance={initialBalance} 
            finalBalance={finalBalance} 
            onRestart={resetGame} 
          />
        </SwipeableWrapper>
      );
    }
    
    // Regular asset card
    const hasActiveTrade = activeTrade && activeAsset && activeTrade.assetId === activeAsset.id;
    
    return activeAsset ? (
      <SwipeableCard
        key={activeAsset.id}
        asset={activeAsset}
        onSwiped={handleSwiped}
        activeTrade={hasActiveTrade ? activeTrade : null}
        showToast={showToast}
        toastMessage={toastMessage}
      />
    ) : (
      <div className="loading">Loading asset...</div>
    );
  };

  // Determine if current asset has an active trade
  const hasActiveTrade = activeTrade && activeAsset && activeTrade.assetId === activeAsset.id;

  // Inform parent component about game progress changes
  useEffect(() => {
    if (gameProgress === 0) {
      // Intro card
      updateGameState({
        inProgress: false,
        currentAsset: 0,
        totalAssets: assets.length
      });
    } else if (gameProgress > assets.length || gameProgress === 26) {
      // Results card
      updateGameState({
        inProgress: false,
        currentAsset: 0,
        totalAssets: assets.length
      });
    } else {
      // Regular asset card
      updateGameState({
        inProgress: true,
        currentAsset: gameProgress,
        totalAssets: assets.length
      });
    }
  }, [gameProgress, assets.length]); // Removed updateGameState from dependencies

  return (
    <div className="card-stack">
      {/* Card rendering */}
      {renderCard()}

      {/* Match notification */}
      {showMatch && (
        <div className="match-notification">
          <h2>It's a match!</h2>
          <p>{hasActiveTrade ? 'Double Down!' : 'You\'re in the trade!'}</p>
        </div>
      )}
    </div>
  );
};

export default CardStack; 