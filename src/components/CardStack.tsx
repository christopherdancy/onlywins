import React, { useState, useEffect } from 'react';
import SwipeableCard from './SwipeableCard';
import { Asset, SwipeDirection } from '../types';
import { generateAssetCollection, generateRandomAsset } from '../utils/chartUtils';

const CardStack: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);

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
    
    const interval = setInterval(() => {
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
        
        // Force upward momentum - NEVER allow price to go down
        let growthFactor;
        if (plateauDetected) {
          // If plateau, create a bigger movement to break out
          growthFactor = Math.random() * 0.18 + 0.1; // 10-28% jump to break the plateau
        } else {
          // Normal growth - still always positive
          growthFactor = Math.random() * 0.07 + 0.04; // 4-11% per tick, increased minimum
        }
        
        // Calculate new market cap with growth factor
        let newMarketCap = lastPoint.marketCap * (1 + growthFactor);
        
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
    }, 200); // Update more frequently for smoother movement
    
    return () => clearInterval(interval);
  }, [activeAsset]);

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