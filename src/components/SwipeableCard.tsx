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
    const threshold = 100; // Lower threshold so text appears quicker (was 150)
    const leftProgress = x < 0 ? Math.min(Math.abs(x) / threshold, 1) : 0;
    const rightProgress = x > 0 ? Math.min(x / threshold, 1) : 0;
    setSwipeProgress({ left: leftProgress, right: rightProgress });
  };

  const updateDirection = (x: number, y: number) => {
    const threshold = 30; // Reduced from 50 to make detection more responsive
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
    activeTrade ? 'in-trade' : '',
  ].filter(Boolean).join(' ');

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
      {/* Remove lock indicator section but keep LIVE indicator */}
      {activeTrade && (
        <div className="live-trade-indicator">
          CURRENT TRADE
        </div>
      )}
      
      {/* Action Overlays - Always render but control opacity with swipeProgress */}
      <div className="action-overlay center left-action" style={leftOverlayStyle}>
        {activeTrade ? 'EXIT' : 'SKIP'}
      </div>
      
      <div className="action-overlay center right-action" style={rightOverlayStyle}>
        {activeTrade ? 'DOUBLE DOWN' : 'ENTER'}
      </div>

      {/* Asset Chart & Info with investment and profit/loss details */}
      <ChartCard 
        asset={asset} 
        avgEntryPrice={activeTrade ? avgEntryPrice : undefined}
        activeTotalInvestment={activeTrade ? activeTrade.totalInvestment : undefined}
        profitLossPercent={activeTrade ? profitLossPercent : undefined}
        expiryTime={activeTrade ? activeTrade.expiryTime : undefined}
      />
    </div>
  );
};

export default SwipeableCard; 