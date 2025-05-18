import React, { useState, useEffect } from 'react';
import SwipeableCard from './SwipeableCard';
import { Asset, SwipeDirection } from '../types';
import { generateAssetCollection, generateRandomAsset } from '../utils/chartUtils';

const CardStack: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [lastSwipedRight, setLastSwipedRight] = useState(false);

  // Initialize assets on mount
  useEffect(() => {
    setAssets(generateAssetCollection(10));
  }, []);

  const handleSwiped = (direction: SwipeDirection) => {
    // If swiped right, show "match" popup sometimes
    if (direction.isRight) {
      setLastSwipedRight(true);
      // 70% chance to show "match" on right swipe for dopamine hit
      if (Math.random() < 0.7) {
        setShowMatch(true);
        setTimeout(() => setShowMatch(false), 1500);
      }
    } else {
      setLastSwipedRight(false);
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
      {currentIndex < assets.length && (
        <SwipeableCard
          key={assets[currentIndex].id}
          asset={assets[currentIndex]}
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
              setAssets(generateAssetCollection(10));
              setCurrentIndex(0);
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