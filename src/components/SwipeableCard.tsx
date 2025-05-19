import React from 'react';
import { Asset, SwipeDirection, ActiveTrade } from '../types';
import ChartCard from './ChartCard';

interface SwipeableCardProps {
  asset: Asset;
  onSwiped: (direction: SwipeDirection) => void;
  activeTrade: ActiveTrade | null;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ asset, onSwiped, activeTrade }) => {
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [direction, setDirection] = React.useState<SwipeDirection>({
    isLeft: false,
    isRight: false,
    isUp: false,
    isDown: false,
  });

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
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 0) return; // No button pressed
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    setDragOffset({ x, y });
    updateDirection(x, y);
  };

  const handleTouchEnd = () => {
    finalizeDrag();
  };

  const handleMouseUp = () => {
    finalizeDrag();
  };

  const updateDirection = (x: number, y: number) => {
    const threshold = 50;
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
  };

  // Calculate rotation and translation based on drag
  const cardStyle: React.CSSProperties = {
    transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${
      dragOffset.x * 0.1
    }deg)`,
    transition: dragOffset.x === 0 && dragOffset.y === 0 ? 'transform 0.3s ease' : 'none',
  };

  // Calculate average entry price if we have an active trade
  const avgEntryPrice = activeTrade 
    ? activeTrade.entryPrices.reduce((sum, price) => sum + price, 0) / activeTrade.entryPrices.length
    : 0;
  
  // Calculate current profit/loss percentage if in a trade
  const profitLossPercent = activeTrade 
    ? ((asset.currentMarketCap - avgEntryPrice) / avgEntryPrice) * 100 
    : 0;

  // Card classes
  const cardClasses = [
    'swipeable-card',
    direction.isLeft ? 'swipe-left' : '',
    direction.isRight ? 'swipe-right' : '',
    activeTrade ? 'in-trade' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Live Trade Indicator */}
      {activeTrade && (
        <div className="live-trade-indicator">
          LIVE
        </div>
      )}
      
      {/* Action Overlays */}
      {direction.isLeft && (
        <div className="action-overlay left">
          {activeTrade ? 'EXIT' : 'SKIP'}
        </div>
      )}
      {direction.isRight && (
        <div className="action-overlay right">
          {activeTrade ? 'DOUBLE DOWN' : 'ENTER'}
        </div>
      )}

      {/* Asset Chart & Info with investment and profit/loss details */}
      <ChartCard 
        asset={asset} 
        avgEntryPrice={activeTrade ? avgEntryPrice : undefined}
        activeTotalInvestment={activeTrade ? activeTrade.totalInvestment : undefined}
        profitLossPercent={activeTrade ? profitLossPercent : undefined}
      />
    </div>
  );
};

export default SwipeableCard; 