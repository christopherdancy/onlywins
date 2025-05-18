import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import ChartCard from './ChartCard';
import { Asset, SwipeDirection } from '../types';

interface SwipeableCardProps {
  asset: Asset;
  onSwiped: (direction: SwipeDirection) => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ asset, onSwiped }) => {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipePosition, setSwipePosition] = useState({ x: 0, y: 0 });

  const handlers = useSwipeable({
    onSwiping: (event) => {
      setSwiping(true);
      setSwipePosition({ x: event.deltaX, y: event.deltaY });
      
      if (event.deltaX > 50) {
        setSwipeDirection('right');
      } else if (event.deltaX < -50) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    onSwiped: (event) => {
      setSwiping(false);
      
      if (event.deltaX > 100) {
        // Swiped right - Buy
        onSwiped({ isRight: true });
      } else if (event.deltaX < -100) {
        // Swiped left - Skip
        onSwiped({ isRight: false });
      } else {
        // Reset position if not swiped far enough
        setSwipePosition({ x: 0, y: 0 });
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  // Calculate rotation and position styles
  const cardStyle = {
    transform: swiping 
      ? `translateX(${swipePosition.x}px) rotate(${swipePosition.x * 0.05}deg)` 
      : 'translateX(0) rotate(0)',
    opacity: swiping && Math.abs(swipePosition.x) > 100 ? 1 - Math.abs(swipePosition.x) / 500 : 1,
    transition: swiping ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
  };

  // Calculate overlay styles based on swipe direction
  const overlayStyle = {
    opacity: Math.min(Math.abs(swipePosition.x) / 100, 0.8),
    backgroundColor: swipeDirection === 'right' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
    display: swipeDirection ? 'flex' : 'none',
  };

  return (
    <div className="swipeable-card-container" {...handlers}>
      <div className="swipeable-card" style={cardStyle}>
        <ChartCard asset={asset} />
        <div className="swipe-overlay" style={overlayStyle}>
          <span className="swipe-text">
            {swipeDirection === 'right' ? 'BUY' : 'SKIP'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwipeableCard; 