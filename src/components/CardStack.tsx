import React, { useState, useEffect, useCallback, useRef } from 'react';
import SwipeableCard from './SwipeableCard';
import { Asset, SwipeDirection, ChartStrategy, ActiveTrade, ChartPoint } from '../types';
import { loadPreGeneratedAssets, generateRandomAsset, prepareChartDataForRealTimeSimulation } from '../utils/chartUtils';
import { useWallet } from '../contexts/WalletContext';

const CardStack: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null); // Track active trade
  const { updateBalance } = useWallet();
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

  // Initialize assets on mount
  useEffect(() => {
    const loadInitialAssets = async () => {
      // Reset the asset loading index to ensure we start with asset-1
      (loadPreGeneratedAssets as any).lastAssetIndex = 0;
      
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
      if (initialAssets.length > 0) {
        setActiveAsset(initialAssets[0]);
      }
    };
    
    loadInitialAssets();
  }, []);

  // Effect to simulate realtime chart movement
  useEffect(() => {
    if (!activeAsset) return;
    
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
        marketCap = Math.min(marketCap, MAX_MARKET_CAP);
        marketCap = Math.max(marketCap, MIN_MARKET_CAP);
        
        // Add new point and remove oldest to keep a moving window
        const newChartData = [...prevAsset.chartData.slice(1), {
          timestamp: Date.now(),
          marketCap: marketCap
        }];
        
        return {
          ...prevAsset,
          currentMarketCap: marketCap,
          chartData: newChartData
        };
      });
    }, 1000); // Update every 1 second to match the pregenerated data timestamps
    
    return () => clearInterval(interval);
  }, [activeAsset, volatilityState]);

  // When moving to the next card, update the active asset
  useEffect(() => {
    if (assets.length > currentIndex) {
      setActiveAsset(assets[currentIndex]);
      
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
  }, [currentIndex, assets]);

  // Handle trade entry or double down
  const handleTradeEntry = useCallback(() => {
    if (!activeAsset) return;
    
    const EXPIRY_DURATION = 30000; // 30 seconds in milliseconds
    const now = Date.now();
    const ENTRY_AMOUNT = -1; // Consistent $1 investment for entering or doubling down
    
    if (activeTrade && activeTrade.assetId === activeAsset.id) {
      // Double down - add another $1 investment
      updateBalance(ENTRY_AMOUNT); // Deduct from wallet with animation
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
  }, [activeAsset, activeTrade, updateBalance, setActiveTrade]);
  
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
    setCurrentIndex(prevIndex => prevIndex + 1);
  }, [activeAsset, activeTrade, updateBalance, setActiveTrade, setCurrentIndex]);

  // Add effect to check for trade expiries
  useEffect(() => {
    if (!activeTrade || !activeAsset) return;
    
    const checkExpiry = () => {
      const now = Date.now();
      if (activeTrade && now >= activeTrade.expiryTime) {
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
    
    // Check every 100ms for more responsive expiry
    const interval = setInterval(checkExpiry, 100);
    
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
        setCurrentIndex(prevIndex => prevIndex + 1);
      }
    }

    // If we're running low on cards, load more
    loadMoreAssets();
  };

  // If no assets yet, show loading
  if (assets.length === 0) {
    return <div className="loading">Loading assets...</div>;
  }

  // Determine if current asset has an active trade
  const hasActiveTrade = activeTrade && activeAsset && activeTrade.assetId === activeAsset.id;

  return (
    <div className="card-stack">
      {/* Only render the current card to improve performance */}
      {currentIndex < assets.length && activeAsset && (
        <SwipeableCard
          key={assets[currentIndex].id}
          asset={activeAsset}
          onSwiped={handleSwiped}
          activeTrade={hasActiveTrade ? activeTrade : null}
        />
      )}

      {/* Match notification */}
      {showMatch && (
        <div className="match-notification">
          <h2>It's a match!</h2>
          <p>{hasActiveTrade ? 'Double Down!' : 'You\'re in the trade!'}</p>
        </div>
      )}

      {/* End of stack notification */}
      {currentIndex >= assets.length && (
        <div className="end-of-stack">
          <h3>No more assets to swipe!</h3>
          <button 
            onClick={async () => {
              // Reset the asset loading index to start from the beginning
              // This uses the same static property we added to loadPreGeneratedAssets
              (loadPreGeneratedAssets as any).lastAssetIndex = 0;
              
              const newAssets = await loadPreGeneratedAssets(10);
              
              // Prepare future data for each asset
              newAssets.forEach(asset => {
                const { initialData, futureData } = prepareChartDataForRealTimeSimulation(asset);
                
                // Store future data for later use
                futureDataRef.current[asset.id] = futureData;
                
                // Update the asset with only the initial data
                asset.chartData = initialData;
                asset.currentMarketCap = initialData[initialData.length - 1].marketCap;
              });
              
              setAssets(newAssets);
              setCurrentIndex(0);
              if (newAssets.length > 0) {
                setActiveAsset(newAssets[0]);
              }
            }}
          >
            Reload Assets
          </button>
        </div>
      )}
    </div>
  );
};

export default CardStack; 