import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Asset, ChartStrategy } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface ChartCardProps {
  asset: Asset;
  avgEntryPrice?: number; // Optional average entry price for active trades
  activeTotalInvestment?: number; // Optional total investment for active trades
  profitLossPercent?: number; // Optional profit/loss percentage for active trades
}

// Helper function for simplified k-notation
const formatSimplifiedPrice = (value: number): string => {
  // If value is too large (over 1 trillion), show as max value
  if (value >= 1_000_000_000_000) {
    return "$999.99B+";
  }
  // Billions
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  // Millions
  else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  // Thousands
  else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}k`;
  }
  // Regular number
  return `$${value.toFixed(2)}`;
};

const ChartCard: React.FC<ChartCardProps> = ({ 
  asset, 
  avgEntryPrice, 
  activeTotalInvestment, 
  profitLossPercent 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const priceBubbleRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [displayPrice, setDisplayPrice] = useState(asset.currentMarketCap);
  const [lastIntervalChange, setLastIntervalChange] = useState(0);
  
  // Update display price when asset changes
  useEffect(() => {
    setDisplayPrice(asset.currentMarketCap);
  }, [asset.currentMarketCap]);
  
  // Update last-interval price change once every 30 seconds
  useEffect(() => {
    const updateChange = () => {
      if (asset.chartData.length < 2) return;
      const now = Date.now();
      // Find the most recent point at least 30 seconds ago
      const thirtySecondsAgo = now - 30000;
      const recent = asset.chartData[asset.chartData.length - 1];
      let prev = asset.chartData[0];
      for (let i = asset.chartData.length - 2; i >= 0; i--) {
        if (asset.chartData[i].timestamp <= thirtySecondsAgo) {
          prev = asset.chartData[i];
          break;
        }
      }
      const change = ((recent.marketCap - prev.marketCap) / prev.marketCap) * 100;
      setLastIntervalChange(change);
    };
    updateChange(); // Run once on mount/asset change
    const interval = setInterval(updateChange, 30000);
    return () => clearInterval(interval);
  }, [asset.chartData]);
  
  // Determine if we're in uptrend or downtrend strategy
  const isUptrendStrategy = asset.strategy === ChartStrategy.UPTREND_WITH_DUMPS;
  
  // Get min and max market cap for scale - only from visible portion (80%)
  const visibleDataCount = Math.floor(asset.chartData.length * 0.8);
  const visibleData = [...asset.chartData].slice(-visibleDataCount);
  const minMarketCap = Math.min(...visibleData.map(point => point.marketCap));
  const maxMarketCap = Math.max(...visibleData.map(point => point.marketCap));

  // Detect significant price movements based on strategy
  const lastFewMarketCaps = asset.chartData.slice(-4).map(point => point.marketCap);
  
  // For uptrend: detect dumps (significant price drop)
  // For downtrend: detect pumps (significant price increase)
  const isInVolatilityEvent = lastFewMarketCaps.length >= 2 && (
    (isUptrendStrategy && 
      lastFewMarketCaps[lastFewMarketCaps.length - 1] < lastFewMarketCaps[lastFewMarketCaps.length - 2] * 0.95) ||
    (!isUptrendStrategy && 
      lastFewMarketCaps[lastFewMarketCaps.length - 1] > lastFewMarketCaps[lastFewMarketCaps.length - 2] * 1.05)
  );
  
  // For uptrend: detect recovery from dump
  // For downtrend: detect correction from pump
  const isInRecoveryEvent = lastFewMarketCaps.length >= 3 && (
    (isUptrendStrategy && 
      lastFewMarketCaps[lastFewMarketCaps.length - 1] > lastFewMarketCaps[lastFewMarketCaps.length - 2] * 1.05 &&
      lastFewMarketCaps[lastFewMarketCaps.length - 2] < lastFewMarketCaps[lastFewMarketCaps.length - 3] * 0.95) ||
    (!isUptrendStrategy && 
      lastFewMarketCaps[lastFewMarketCaps.length - 1] < lastFewMarketCaps[lastFewMarketCaps.length - 2] * 0.95 &&
      lastFewMarketCaps[lastFewMarketCaps.length - 2] > lastFewMarketCaps[lastFewMarketCaps.length - 3] * 1.05)
  );

  // Prepare chart price labels (just 4 evenly spaced ones)
  const priceSteps = [];
  const priceRange = maxMarketCap - minMarketCap;
  for (let i = 0; i <= 3; i++) {
    // Start with highest value at top (i=0) and decrease to lowest at bottom (i=3)
    priceSteps.push(maxMarketCap - (priceRange * i / 3));
  }
  
  // Prepare data for Chart.js
  const chartData = useMemo(() => {
    // Calculate the number of points to show (75% of the data)
    const visibleDataCount = Math.floor(asset.chartData.length * 0.75);
    
    // Get visible data points - use actual 75% of data points
    let visibleData = [...asset.chartData].slice(-visibleDataCount);
    
    // For uptrend strategy, we want to ensure the last few points are trending upward
    if (isUptrendStrategy && !isInVolatilityEvent) {
      const lastFewPoints = visibleData.slice(-5);
      for (let i = 1; i < lastFewPoints.length; i++) {
        // Make sure each point is at least 2% higher than the previous
        const minValue = lastFewPoints[i-1].marketCap * 1.02;
        if (lastFewPoints[i].marketCap < minValue) {
          lastFewPoints[i] = {
            ...lastFewPoints[i],
            marketCap: minValue
          };
        }
      }
      
      // Make the last point positioned at approximately 75% of vertical height
      const lastPoint = lastFewPoints[lastFewPoints.length - 1];
      const verticalTarget = minMarketCap + (maxMarketCap - minMarketCap) * 0.75;
      
      // Only adjust if needed - ensure it's not lower than current value
      if (lastPoint.marketCap < verticalTarget) {
        lastPoint.marketCap = verticalTarget;
      }
      
      // Replace the last few points in the visibleData
      visibleData.splice(-5, 5, ...lastFewPoints);
    }
    // For downtrend strategy, we want to ensure the last few points are trending downward
    else if (!isUptrendStrategy && !isInVolatilityEvent) {
      const lastFewPoints = visibleData.slice(-5);
      for (let i = 1; i < lastFewPoints.length; i++) {
        // Make sure each point is at least 1.5% lower than the previous
        const maxValue = lastFewPoints[i-1].marketCap * 0.985;
        if (lastFewPoints[i].marketCap > maxValue) {
          lastFewPoints[i] = {
            ...lastFewPoints[i],
            marketCap: maxValue
          };
        }
      }
      
      // Make the last point positioned at approximately 25% of vertical height
      const lastPoint = lastFewPoints[lastFewPoints.length - 1];
      const verticalTarget = minMarketCap + (maxMarketCap - minMarketCap) * 0.25;
      
      // Only adjust if needed - ensure it's not higher than current value
      if (lastPoint.marketCap > verticalTarget) {
        lastPoint.marketCap = verticalTarget;
      }
      
      // Replace the last few points in the visibleData
      visibleData.splice(-5, 5, ...lastFewPoints);
    }
    
    // Determine chart colors based on strategy and current state
    let lineColor = '#4bc0c0'; // Default teal color
    
    if (isUptrendStrategy) {
      // Uptrend strategy colors
      if (isInVolatilityEvent) {
        lineColor = '#ff6b6b'; // Red for dumps
      } else if (isInRecoveryEvent) {
        lineColor = '#00bf63'; // Green for recovery
      }
    } else {
      // Downtrend strategy colors
      if (isInVolatilityEvent) {
        lineColor = '#00bf63'; // Green for pumps
      } else if (isInRecoveryEvent) {
        lineColor = '#ff6b6b'; // Red for corrections
      } else {
        lineColor = '#ff6b6b'; // Red for general downtrend
      }
    }
    
    // Create labels (timestamps) for x-axis
    const labels = visibleData.map(point => new Date(point.timestamp).toISOString());
    
    return {
      labels,
      datasets: [
        {
          label: asset.symbol,
          data: visibleData.map(point => point.marketCap),
          fill: true,
          backgroundColor: isUptrendStrategy 
            ? 'rgba(75, 192, 192, 0.1)' 
            : 'rgba(255, 107, 107, 0.1)',
          borderColor: lineColor,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0,
        }
      ]
    };
  }, [asset, minMarketCap, maxMarketCap, isInVolatilityEvent, isInRecoveryEvent, isUptrendStrategy]);

  // Position the price bubble at the last visible point
  useEffect(() => {
    const positionBubble = () => {
      if (!chartRef.current || !priceBubbleRef.current || !chartContainerRef.current) return;
      
      const chart = chartRef.current;
      const bubbleElement = priceBubbleRef.current;
      const containerElement = chartContainerRef.current;
      
      // Get dataset meta
      const datasetMeta = chart.getDatasetMeta(0);
      
      if (chart.scales && datasetMeta && datasetMeta.data && datasetMeta.data.length > 0) {
        // Get the position of the last visible data point
        const count = datasetMeta.data.length;
        const lastVisiblePoint = datasetMeta.data[count - 1];
        
        // Position bubble at exactly this x position, centered on the bubble
        const bubbleWidth = bubbleElement.offsetWidth;
        
        // For narrow screens, adjust to ensure the bubble stays within container bounds
        const isMobile = window.innerWidth < 480;
        const containerRight = containerElement.offsetWidth;
        
        // Calculate initial x position
        let xPos = lastVisiblePoint.x - (bubbleWidth / 2);
        
        // Make sure bubble doesn't go off right edge
        if (xPos + bubbleWidth > containerRight - 5) {
          xPos = containerRight - bubbleWidth - 5;
        }
        
        // Make sure bubble doesn't go off left edge 
        if (xPos < 5) {
          xPos = 5;
        }
        
        bubbleElement.style.left = `${xPos}px`;
        bubbleElement.style.top = `${lastVisiblePoint.y - (isMobile ? 25 : 30)}px`;
      } else {
        // Fallback positioning if chart not ready
        const containerWidth = containerElement.offsetWidth;
        const bubbleWidth = bubbleElement.offsetWidth;
        
        // For mobile, position bubble more to the left
        const positionRatio = window.innerWidth < 480 ? 0.7 : 0.75;
        const xPos = Math.min(containerWidth * positionRatio - (bubbleWidth / 2), containerWidth - bubbleWidth - 5);
        
        bubbleElement.style.left = `${xPos}px`;
      }
    };
    
    // Position on render and window resize
    const initialTimer = setTimeout(positionBubble, 300);
    const handleResize = () => positionBubble();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [chartData]);

  // Check if we're in active trade mode
  const isActiveTrade = avgEntryPrice !== undefined;
  
  // Determine price bubble classes
  const priceBubbleClasses = [];
  if (isInVolatilityEvent) {
    priceBubbleClasses.push('price-dropping');
  } else if (isInRecoveryEvent) {
    priceBubbleClasses.push('price-recovering');
  }
  
  // Chart options with entry price annotation if available
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 100,
        top: 80,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      annotation: avgEntryPrice ? {
        annotations: {
          entryLine: {
            type: 'line',
            scaleID: 'y',
            value: avgEntryPrice,
            borderColor: '#FFD700',
            borderWidth: 2,
            borderDash: [5, 5],
            drawTime: 'afterDatasetsDraw',
            label: {
              display: true,
              content: `Entry: ${formatSimplifiedPrice(avgEntryPrice)}`,
              position: 'start',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#FFD700',
              font: {
                size: 12,
                weight: 'bold'
              },
              padding: 6
            }
          }
        }
      } : undefined
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        },
        // Add 25% more space on the right for projection, but scale based on screen size
        max: window.innerWidth < 480 ? asset.chartData.length * 1.15 : asset.chartData.length * 1.25
      },
      y: {
        display: false,
        grid: {
          display: false
        },
        // Set min/max to show 75% of vertical height, but less extreme for mobile
        min: minMarketCap * 0.85, 
        max: maxMarketCap * 1.15
      }
    },
    animation: {
      duration: 0 // Disable animations for performance
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-footer">
        <div className="chart-info">
          <div className="token-header">
            <img src={asset.iconUrl} alt={asset.symbol} className="token-icon" />
            <h2>{asset.name}</h2>
          </div>
        </div>
        {/* Conditionally show either active trade info or 30-second price change */}
        {isActiveTrade && profitLossPercent !== undefined ? (
          <div className={`active-trade-info ${profitLossPercent >= 0 ? 'profit' : 'loss'}`}>
            <div className="investment-amount">${activeTotalInvestment?.toFixed(2)}</div>
            <div className="profit-loss">
              {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
            </div>
          </div>
        ) : (
          <div className={`change-badge ${lastIntervalChange >= 0 ? 'positive' : 'negative'}`}>
            <div className="change-amount">
              {lastIntervalChange >= 0 ? '+' : ''}{lastIntervalChange.toFixed(2)}%
            </div>
            <div className="change-label">past 30 sec</div>
          </div>
        )}
      </div>

      {/* Chart container */}
      <div className="chart-container" ref={chartContainerRef}>
        {/* Future projection area gradient */}
        <div className="chart-projection-area"></div>
        
        {/* Chart with annotations */}
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          height={250}
        />
        
        {/* Price labels */}
        <div className="price-labels">
          {priceSteps.map((price, index) => (
            <div key={index} className="price-label">
              {formatSimplifiedPrice(price)}
            </div>
          ))}
        </div>
        
        {/* Current price bubble */}
        <div 
          ref={priceBubbleRef} 
          className={`current-price-bubble ${priceBubbleClasses.join(' ')}`}
        >
          {formatSimplifiedPrice(displayPrice)}
        </div>
      </div>
    </div>
  );
};

export default ChartCard; 