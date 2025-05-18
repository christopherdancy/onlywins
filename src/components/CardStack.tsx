import React, { useState, useEffect } from 'react';
import SwipeableCard from './SwipeableCard';
import { Asset, SwipeDirection } from '../types';
import { generateAssetCollection, generateRandomAsset } from '../utils/chartUtils';

const CardStack: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [volatilityState, setVolatilityState] = useState({
    inDump: false,         // Currently in a dump phase
    dumpComplete: false,   // Finished the dump phase (now in recovery)
    dumpDepth: 0,          // How deep the dump will go (% drop)
    recoveryStrength: 0,   // How strong the recovery will be
    dumpCounter: 0,        // Counter for dump duration
    recoveryCounter: 0,    // Counter for recovery duration
    ticksSinceDump: 0      // Ticks since last dump event
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
    
    // Helper functions for volatility - modified for slower pace
    const nextDumpDepth = () => 0.15 + (Math.random() * 0.25); // 15-40% drop (deeper than before)
    const nextRecoveryStrength = (dumpDepth: number) => 
      dumpDepth * (0.7 + (Math.random() * 0.4)); // 70-110% of dump (potential for incomplete recovery)
    const getDumpDuration = () => 4 + Math.floor(Math.random() * 3); // 4-6 ticks (slower)
    const getRecoveryDuration = () => 6 + Math.floor(Math.random() * 5); // 6-10 ticks (slower)
    const getTicksBetweenDumps = () => 30 + Math.floor(Math.random() * 20); // 30-50 ticks (longer between)
    
    const interval = setInterval(() => {
      // Update volatility state first
      setVolatilityState(prevState => {
        let newState = { ...prevState };
        newState.ticksSinceDump += 1;
        
        // Check if we should start a new dump
        if (!newState.inDump && !newState.dumpComplete && 
            newState.ticksSinceDump >= getTicksBetweenDumps()) {
          // 20% chance of starting a dump when the counter hits (reduced from 25%)
          if (Math.random() < 0.2) {
            newState.inDump = true;
            newState.dumpDepth = nextDumpDepth();
            newState.dumpCounter = getDumpDuration();
            newState.recoveryStrength = nextRecoveryStrength(newState.dumpDepth);
            newState.ticksSinceDump = 0;
          }
        }
        
        // Handle active dump phase
        if (newState.inDump) {
          newState.dumpCounter -= 1;
          
          // Check if dump is complete
          if (newState.dumpCounter <= 0) {
            newState.inDump = false;
            newState.dumpComplete = true;
            newState.recoveryCounter = getRecoveryDuration();
          }
        }
        // Handle recovery phase
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
        
        // Create a new data point showing continued upward movement
        const lastPoint = prevAsset.chartData[prevAsset.chartData.length - 1];
        const newTimestamp = Date.now();
        
        // Calculate growth factor - ensure continuous upward momentum
        // More aggressive growth near the visible portion of the chart
        const visiblePoints = Math.floor(prevAsset.chartData.length * 0.75);
        const recentPoints = prevAsset.chartData.slice(-visiblePoints);
        
        // Determine if there's been a plateau (less than 5% growth over last 5 points)
        const plateauDetected = checkForPlateau(recentPoints);
        
        // Current market cap
        const currentMarketCap = lastPoint.marketCap;
        let newMarketCap = currentMarketCap;
        
        // Handle active dump phase
        if (volatilityState.inDump) {
          // Calculate how much to drop this tick (distribute the dump over duration)
          const dumpPercent = volatilityState.dumpDepth / volatilityState.dumpCounter;
          newMarketCap = currentMarketCap * (1 - dumpPercent * 0.8); // 80% impact per tick (more impact)
        }
        // Handle recovery phase
        else if (volatilityState.dumpComplete) {
          // Calculate recovery amount for this tick (distribute over duration)
          const recoveryPercent = volatilityState.recoveryStrength / volatilityState.recoveryCounter;
          newMarketCap = currentMarketCap * (1 + recoveryPercent * 0.75); // 75% impact per tick (gradual recovery)
        }
        // Normal growth phase
        else {
          // If market cap is getting too large, drastically reduce growth
          let growthFactor = 0;
          
          if (currentMarketCap > MAX_MARKET_CAP * 0.5) {
            // If we're over 50% of max cap, severely limit growth
            growthFactor = 0.0001 + (Math.random() * 0.0003); // Lower growth
          } else if (currentMarketCap > MAX_MARKET_CAP * 0.1) {
            // If we're over 10% of max cap, limit growth
            growthFactor = 0.0005 + (Math.random() * 0.001); // Lower growth
          } else if (plateauDetected) {
            // If plateau, create a bigger movement to break out
            growthFactor = Math.random() * 0.1 + 0.05; // 5-15% jump (less aggressive)
          } else {
            // Normal growth - still always positive
            growthFactor = Math.random() * 0.03 + 0.02; // 2-5% per tick (slower overall)
          }
          
          // Calculate new market cap with growth factor
          newMarketCap = currentMarketCap * (1 + growthFactor);
        }
        
        // Enforce maximum market cap
        newMarketCap = Math.min(newMarketCap, MAX_MARKET_CAP);
        
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

  // Helper function to detect plateau
  const checkForPlateau = (points: Array<{marketCap: number}>): boolean => {
    if (points.length < 5) return false;
    
    const last5Points = points.slice(-5);
    const startPrice = last5Points[0].marketCap;
    const endPrice = last5Points[last5Points.length - 1].marketCap;
    
    // If growth is less than 5% over last 5 points, consider it a plateau
    const growth = (endPrice - startPrice) / startPrice;
    return growth < 0.05;
  };

  // When moving to the next card, update the active asset
  useEffect(() => {
    if (assets.length > currentIndex) {
      setActiveAsset(assets[currentIndex]);
    }
  }, [currentIndex, assets]);

  const handleSwiped = (direction: SwipeDirection) => {
    // If swiped right, show "match" popup sometimes
    if (direction.isRight) {
      // 70% chance to show "match" on right swipe for dopamine hit
      if (Math.random() < 0.7) {
        setShowMatch(true);
        setTimeout(() => setShowMatch(false), 1500);
      }
    }

    // Move to next card
    setCurrentIndex(prevIndex => prevIndex + 1);

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

  return (
    <div className="card-stack">
      {/* Only render the current card to improve performance */}
      {currentIndex < assets.length && activeAsset && (
        <SwipeableCard
          key={assets[currentIndex].id}
          asset={activeAsset}
          onSwiped={handleSwiped}
        />
      )}

      {/* Match notification */}
      {showMatch && (
        <div className="match-notification">
          <h2>It's a match!</h2>
          <p>You're in the trade!</p>
        </div>
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