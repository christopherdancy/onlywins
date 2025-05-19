import React, { useState, useEffect } from 'react';
import SwipeableCard from './SwipeableCard';
import { Asset, SwipeDirection, ChartStrategy, ActiveTrade } from '../types';
import { generateAssetCollection, generateRandomAsset } from '../utils/chartUtils';
import { useWallet } from '../contexts/WalletContext';

const CardStack: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
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

  // Initialize assets on mount
  useEffect(() => {
    const initialAssets = generateAssetCollection(10);
    setAssets(initialAssets);
    if (initialAssets.length > 0) {
      setActiveAsset(initialAssets[0]);
    }
  }, []);

  // Effect to simulate realtime chart movement
  useEffect(() => {
    if (!activeAsset) return;
    
    // Maximum reasonable market cap (10 billion)
    const MAX_MARKET_CAP = 10_000_000_000;
    
    // Minimum reasonable market cap (prevent going to zero)
    const MIN_MARKET_CAP = 5_000;
    
    // Get current strategy
    const isUptrendStrategy = activeAsset.strategy === ChartStrategy.UPTREND_WITH_DUMPS;
    
    // Helper functions for volatility - modified for different strategies
    const nextVolatilityDepth = () => {
      if (isUptrendStrategy) {
        // For uptrend: 15-40% dumps
        return 0.15 + (Math.random() * 0.25);
      } else {
        // For downtrend: 15-40% pumps
        return 0.15 + (Math.random() * 0.25);
      }
    };
    
    const nextRecoveryStrength = (volatilityDepth: number) => {
      if (isUptrendStrategy) {
        // For uptrend: 70-110% recovery after dump (not always full recovery)
        return volatilityDepth * (0.7 + (Math.random() * 0.4));
      } else {
        // For downtrend: 60-90% correction after pump (usually substantial correction)
        return volatilityDepth * (0.6 + (Math.random() * 0.3));
      }
    };
    
    const getVolatilityDuration = () => 4 + Math.floor(Math.random() * 3); // 4-6 ticks for both strategies
    const getRecoveryDuration = () => 6 + Math.floor(Math.random() * 5); // 6-10 ticks for both strategies
    const getTicksBetweenEvents = () => 30 + Math.floor(Math.random() * 20); // 30-50 ticks between events
    
    const interval = setInterval(() => {
      // Update volatility state first
      setVolatilityState(prevState => {
        let newState = { ...prevState };
        newState.ticksSinceDump += 1;
        
        // Check if we should start a new volatility event
        if (!newState.inDump && !newState.dumpComplete && 
            newState.ticksSinceDump >= getTicksBetweenEvents()) {
          // 20% chance of starting a volatility event when the counter hits
          if (Math.random() < 0.2) {
            newState.inDump = true;
            newState.dumpDepth = nextVolatilityDepth();
            newState.dumpCounter = getVolatilityDuration();
            newState.recoveryStrength = nextRecoveryStrength(newState.dumpDepth);
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
            newState.recoveryCounter = getRecoveryDuration();
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
      
      // Then update the asset with the newly updated volatility state
      setActiveAsset(prevAsset => {
        if (!prevAsset) return null;
        
        // Create a new data point showing continued movement based on strategy
        const lastPoint = prevAsset.chartData[prevAsset.chartData.length - 1];
        const newTimestamp = Date.now();
        
        // Calculate growth factor based on strategy
        // More aggressive growth near the visible portion of the chart
        const visiblePoints = Math.floor(prevAsset.chartData.length * 0.75);
        const recentPoints = prevAsset.chartData.slice(-visiblePoints);
        
        // Determine if there's been a plateau (less than 5% change over last 5 points)
        const plateauDetected = checkForPlateau(recentPoints, isUptrendStrategy);
        
        // Current market cap
        const currentMarketCap = lastPoint.marketCap;
        let newMarketCap = currentMarketCap;
        
        // Handle active volatility phase
        if (volatilityState.inDump) {
          // Calculate change for this tick
          const volatilityPercent = volatilityState.dumpDepth / volatilityState.dumpCounter;
          
          if (isUptrendStrategy) {
            // For uptrend: dump means price drop
            newMarketCap = currentMarketCap * (1 - volatilityPercent * 0.8);
          } else {
            // For downtrend: dump means price pump
            newMarketCap = currentMarketCap * (1 + volatilityPercent * 0.8);
          }
        }
        // Handle recovery/correction phase
        else if (volatilityState.dumpComplete) {
          // Calculate recovery amount for this tick
          const recoveryPercent = volatilityState.recoveryStrength / volatilityState.recoveryCounter;
          
          if (isUptrendStrategy) {
            // For uptrend: recovery means price increase
            newMarketCap = currentMarketCap * (1 + recoveryPercent * 0.75);
          } else {
            // For downtrend: recovery means price decrease (correction)
            newMarketCap = currentMarketCap * (1 - recoveryPercent * 0.75);
          }
        }
        // Normal movement phase
        else {
          if (isUptrendStrategy) {
            // UPTREND STRATEGY: Normal upward growth
            let growthFactor = 0;
            
            if (currentMarketCap > MAX_MARKET_CAP * 0.5) {
              // If we're over 50% of max cap, severely limit growth
              growthFactor = 0.0001 + (Math.random() * 0.0003);
            } else if (currentMarketCap > MAX_MARKET_CAP * 0.1) {
              // If we're over 10% of max cap, limit growth
              growthFactor = 0.0005 + (Math.random() * 0.001);
            } else if (plateauDetected) {
              // If plateau, create a bigger movement to break out
              growthFactor = Math.random() * 0.1 + 0.05; // 5-15% jump
            } else {
              // Normal growth - still always positive
              growthFactor = Math.random() * 0.03 + 0.02; // 2-5% per tick
            }
            
            // Calculate new market cap with growth factor
            newMarketCap = currentMarketCap * (1 + growthFactor);
          } else {
            // DOWNTREND STRATEGY: Normal downward movement
            let dropFactor = 0;
            
            if (currentMarketCap < MIN_MARKET_CAP * 2) {
              // If we're close to minimum, limit further drops
              dropFactor = 0.0001 + (Math.random() * 0.0005);
            } else if (plateauDetected) {
              // If plateau, create a bigger movement to break out downward
              dropFactor = Math.random() * 0.08 + 0.04; // 4-12% drop
            } else {
              // Normal drop - still generally negative
              dropFactor = Math.random() * 0.025 + 0.015; // 1.5-4% per tick
            }
            
            // Calculate new market cap with drop factor
            newMarketCap = currentMarketCap * (1 - dropFactor);
            
            // Occasional mini-pumps (5% chance) to create hope
            if (Math.random() < 0.05) {
              newMarketCap *= (1 + Math.random() * 0.06); // 0-6% mini pump
            }
          }
        }
        
        // Enforce limits
        newMarketCap = Math.min(newMarketCap, MAX_MARKET_CAP);
        newMarketCap = Math.max(newMarketCap, MIN_MARKET_CAP);
        
        // Add new point and remove oldest to keep a moving window
        const newChartData = [...prevAsset.chartData.slice(1), {
          timestamp: newTimestamp,
          marketCap: newMarketCap
        }];
        
        return {
          ...prevAsset,
          currentMarketCap: newMarketCap,
          chartData: newChartData
        };
      });
    }, 400); // Slower updates (400ms instead of 200ms)
    
    return () => clearInterval(interval);
  }, [activeAsset, volatilityState]);

  // Helper function to detect plateau based on strategy
  const checkForPlateau = (points: Array<{marketCap: number}>, isUptrend: boolean): boolean => {
    if (points.length < 5) return false;
    
    const last5Points = points.slice(-5);
    const startPrice = last5Points[0].marketCap;
    const endPrice = last5Points[last5Points.length - 1].marketCap;
    
    // Calculate growth/drop as percentage
    const changePercent = (endPrice - startPrice) / startPrice;
    
    if (isUptrend) {
      // For uptrend: plateau means not enough growth (less than 5%)
      return changePercent < 0.05;
    } else {
      // For downtrend: plateau means not enough drop (less than 5%)
      return changePercent > -0.05;
    }
  };

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
  const handleTradeEntry = () => {
    if (!activeAsset) return;
    
    if (activeTrade && activeTrade.assetId === activeAsset.id) {
      // Double down - add another $1 investment
      updateBalance(-1); // Deduct from wallet
      setActiveTrade({
        ...activeTrade,
        entryPrices: [...activeTrade.entryPrices, activeAsset.currentMarketCap],
        totalInvestment: activeTrade.totalInvestment + 1
      });
    } else {
      // New trade entry
      updateBalance(-1); // Deduct from wallet
      setActiveTrade({
        assetId: activeAsset.id,
        entryPrices: [activeAsset.currentMarketCap],
        totalInvestment: 1,
        entryTime: Date.now()
      });
    }
  };
  
  // Handle trade exit and calculate profits
  const handleTradeExit = () => {
    if (!activeAsset || !activeTrade || activeTrade.assetId !== activeAsset.id) return;
    
    // Calculate profit/loss
    const avgEntryPrice = activeTrade.entryPrices.reduce((sum, price) => sum + price, 0) / 
                        activeTrade.entryPrices.length;
    const currentPrice = activeAsset.currentMarketCap;
    const profitPercent = (currentPrice - avgEntryPrice) / avgEntryPrice;
    
    // Calculate return amount (minimum return is 10% of investment)
    const returnAmount = Math.max(activeTrade.totalInvestment * (1 + profitPercent), activeTrade.totalInvestment * 0.1);
    
    // Update wallet balance
    updateBalance(returnAmount);
    
    // Exit trade
    setActiveTrade(null);
    
    // Move to next asset
    setCurrentIndex(prevIndex => prevIndex + 1);
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

    // If we're running low on cards, generate more
    if (currentIndex >= assets.length - 3) {
      setAssets(prevAssets => [
        ...prevAssets,
        generateRandomAsset(),
        generateRandomAsset(),
        generateRandomAsset()
      ]);
    }
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

      {/* End of stack notification */}
      {currentIndex >= assets.length && (
        <div className="end-of-stack">
          <h3>No more assets to swipe!</h3>
          <button 
            onClick={() => {
              const newAssets = generateAssetCollection(10);
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