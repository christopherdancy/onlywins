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
  expiryTime?: number; // Optional expiry time for active trades
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

// Helper function to format time as MM:SS
const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ChartCard: React.FC<ChartCardProps> = ({ 
  asset, 
  avgEntryPrice, 
  activeTotalInvestment, 
  profitLossPercent,
  expiryTime
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const priceBubbleRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [displayPrice, setDisplayPrice] = useState(asset.currentMarketCap);
  const [lastIntervalChange, setLastIntervalChange] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Update display price when asset changes
  useEffect(() => {
    setDisplayPrice(asset.currentMarketCap);
  }, [asset.currentMarketCap]);
  
  // Update time remaining if in a trade with expiry
  useEffect(() => {
    if (!expiryTime) {
      setTimeRemaining(null);
      return;
    }
    
    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = expiryTime - now;
      setTimeRemaining(Math.max(0, remaining));
    };
    
    // Update immediately and then every 1000ms
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [expiryTime]);
  
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
  
  // Prepare chart data with extended projection for expiry
  const chartData = useMemo(() => {
    if (!asset) return {
      labels: [],
      datasets: [
        {
          label: '',
          data: [],
          fill: false,
          borderColor: '#4bc0c0',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0,
        }
      ]
    };
    
    const isUptrendStrategy = asset.strategy === ChartStrategy.UPTREND_WITH_DUMPS;
    
    // Determine uptrend/downtrend styling
    const lineColor = isUptrendStrategy ? 
      (isInVolatilityEvent ? '#ff6b6b' : '#4bc0c0') : 
      (isInRecoveryEvent ? '#4bc0c0' : '#ff6b6b');
    
    // Get only the needed number of points for display
    const visibleDataCount = Math.floor(asset.chartData.length * 0.75);
    const visibleData = [...asset.chartData].slice(-visibleDataCount);
    
    // Prepare labels and data values
    // Use indices as labels since the timestamps might be inconsistent between assets
    const labels = visibleData.map((_, i) => i.toString());
    const dataValues = visibleData.map(point => point.marketCap);
    
    // Ensure the market cap values are properly formatted as numbers
    const normalizedValues = dataValues.map(val => 
      typeof val === 'string' ? parseFloat(val) : val
    );
    
    return {
      labels,
      datasets: [
        {
          label: asset.name,
          data: normalizedValues,
          fill: false,
          borderColor: lineColor,
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0,
        }
      ]
    };
  }, [asset, isInVolatilityEvent, isInRecoveryEvent]);

  // Calculate expiry position for chart annotation
  const expiryPosition = useMemo(() => {
    if (!expiryTime || timeRemaining === null || !asset?.chartData?.length) return null;
    
    // Position is based on how much time is left relative to the 30-second duration
    return asset.chartData.length + (timeRemaining / 30000) * asset.chartData.length * 0.3;
  }, [asset?.chartData?.length, expiryTime, timeRemaining]);

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
  
  // Calculate current position value if in a trade
  const positionValue = useMemo(() => {
    if (!activeTotalInvestment || !avgEntryPrice || !asset) return null;
    
    // Calculate the current value of the position
    const currentPrice = asset.currentMarketCap;
    const entryToCurrentRatio = currentPrice / avgEntryPrice;
    return activeTotalInvestment * entryToCurrentRatio;
  }, [activeTotalInvestment, avgEntryPrice, asset]);

  // Calculate token quantity based on investment and price
  const tokenQuantity = useMemo(() => {
    if (!activeTotalInvestment || !avgEntryPrice) return null;
    
    // Scale factor based on market cap to make numbers more realistic
    // Higher market cap = smaller token amounts, lower market cap = larger token amounts
    let scaleFactor = 1;
    
    if (avgEntryPrice >= 1_000_000) {
      // For high market cap tokens (>$1M), multiply by a smaller factor
      scaleFactor = 100 / Math.sqrt(avgEntryPrice / 1_000_000);
    } else if (avgEntryPrice >= 100_000) {
      // Medium high market cap
      scaleFactor = 1_000 / Math.sqrt(avgEntryPrice / 100_000);
    } else if (avgEntryPrice >= 10_000) {
      // Medium market cap
      scaleFactor = 10_000 / Math.sqrt(avgEntryPrice / 10_000);
    } else if (avgEntryPrice >= 1_000) {
      // Lower market cap
      scaleFactor = 100_000 / Math.sqrt(avgEntryPrice / 1_000);
    } else {
      // Very low market cap, get lots of tokens
      scaleFactor = 1_000_000 / Math.sqrt(avgEntryPrice);
    }
    
    // Calculate how many tokens based on investment and scale factor
    const tokens = activeTotalInvestment * scaleFactor;
    
    // Format with appropriate rounding based on value
    if (tokens < 1) {
      // Unlikely with new scaling, but just in case
      return tokens.toFixed(2);
    } else if (tokens < 1000) {
      // Round to whole number for small amounts
      return Math.round(tokens).toLocaleString();
    } else if (tokens < 1_000_000) {
      // For thousands, round to nearest 10
      return Math.round(tokens / 10) * 10 >= 100000 
        ? `${(Math.round(tokens / 1000) / 10).toFixed(1)}K` 
        : Math.round(tokens / 10) * 10 >= 10000
          ? `${Math.round(tokens / 100) / 10}K`
          : Math.round(tokens / 10) * 10 >= 1000
            ? `${Math.round(tokens / 10) * 10}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : `${Math.round(tokens / 10) * 10}`;
    } else if (tokens < 10_000_000) {
      // For millions, round to nearest 1000
      return `${Math.round(tokens / 1000)}K`;
    } else if (tokens < 1_000_000_000) {
      // For 10M+, round to nearest 10000
      return `${Math.round(tokens / 10000) / 100}M`;
    } else {
      // For billions+, round to nearest million
      return `${Math.round(tokens / 1000000) / 1000}B`;
    }
  }, [activeTotalInvestment, avgEntryPrice]);

  // Format displayed price and trading info
  const formattedDisplayPrice = useMemo(() => formatSimplifiedPrice(displayPrice), [displayPrice]);
  const formattedAvgEntryPrice = useMemo(() => avgEntryPrice ? formatSimplifiedPrice(avgEntryPrice) : '', [avgEntryPrice]);
  const formattedPositionValue = useMemo(() => positionValue ? `$${positionValue.toFixed(2)}` : '', [positionValue]);

  // Chart options with annotations
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
      annotation: {
        annotations: {
          ...(avgEntryPrice ? {
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
                content: `Entry: ${formattedAvgEntryPrice}`,
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
          } : {}),
          ...(expiryPosition !== null ? {
            expiryLine: {
              type: 'line',
              scaleID: 'x',
              value: expiryPosition,
              borderColor: '#FF3B30',
              borderWidth: 2,
              borderDash: [5, 5],
              drawTime: 'afterDatasetsDraw',
              label: {
                display: true,
                position: 'end',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#FF3B30',
                font: {
                  size: 11,
                  weight: 'bold'
                },
                content: 'Expiry',
                padding: 5
              }
            }
          } : {})
        }
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        },
        // When in a trade with expiry, extend the chart to show the full 30-second period
        max: isActiveTrade ? asset.chartData.length * 1.3 : 
             (window.innerWidth < 480 ? asset.chartData.length * 1.15 : asset.chartData.length * 1.25)
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
    <div className={`chart-card ${isActiveTrade ? 'in-trade-mode' : ''}`}>
      <div className="chart-footer">
        <div className="chart-info">
          <div className="token-header">
            <img src={asset.iconUrl} alt={asset.symbol} className="token-icon" />
            <h2>{asset.name}</h2>
          </div>
          {/* Show token holdings for active trades */}
          {isActiveTrade && tokenQuantity && (
            <div className="token-holdings">
              <span className="token-quantity">{tokenQuantity}</span>
              <span className="token-symbol">{asset.symbol}</span>
            </div>
          )}
        </div>
        {/* Conditionally show either active trade info or 30-second price change */}
        {isActiveTrade && profitLossPercent !== undefined ? (
          <div className={`active-trade-info ${profitLossPercent >= 0 ? 'profit' : 'loss'}`}>
            <div className="investment-amount">{formattedPositionValue}</div>
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
        
        {/* Timer display when in active trade */}
        {isActiveTrade && timeRemaining !== null && (
          <div className={`expiry-timer ${timeRemaining < 10000 ? 'expiry-timer-ending' : ''}`}>
            <div className="expiry-time">{formatTimeRemaining(timeRemaining)}</div>
            <div className="expiry-label">Expiry</div>
          </div>
        )}
        
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
          {formattedDisplayPrice}
        </div>
      </div>
    </div>
  );
};

export default ChartCard; 