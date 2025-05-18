import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Asset } from '../types';
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartCardProps {
  asset: Asset;
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

const ChartCard: React.FC<ChartCardProps> = ({ asset }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const priceBubbleRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [displayPrice, setDisplayPrice] = useState(asset.currentMarketCap);
  
  // Update display price when asset changes
  useEffect(() => {
    setDisplayPrice(asset.currentMarketCap);
  }, [asset.currentMarketCap]);
  
  // Calculate percentage increase
  const startMarketCap = asset.chartData[0].marketCap;
  const currentMarketCap = asset.currentMarketCap;
  const percentIncrease = ((currentMarketCap - startMarketCap) / startMarketCap) * 100;
  
  // Get min and max market cap for scale - only from visible portion (80%)
  const visibleDataCount = Math.floor(asset.chartData.length * 0.8);
  const visibleData = [...asset.chartData].slice(-visibleDataCount);
  const minMarketCap = Math.min(...visibleData.map(point => point.marketCap));
  const maxMarketCap = Math.max(...visibleData.map(point => point.marketCap));

  // Detect if we're currently in a dump (significant price drop)
  const lastFewMarketCaps = asset.chartData.slice(-4).map(point => point.marketCap);
  const isInDump = lastFewMarketCaps.length >= 2 && 
    lastFewMarketCaps[lastFewMarketCaps.length - 1] < lastFewMarketCaps[lastFewMarketCaps.length - 2] * 0.95;
  
  // Detect if we're in a recovery (bouncing back after a drop)
  const isInRecovery = lastFewMarketCaps.length >= 3 && 
    lastFewMarketCaps[lastFewMarketCaps.length - 1] > lastFewMarketCaps[lastFewMarketCaps.length - 2] * 1.05 &&
    lastFewMarketCaps[lastFewMarketCaps.length - 2] < lastFewMarketCaps[lastFewMarketCaps.length - 3] * 0.95;

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
    
    // Always ensure the last few points are trending upward for FOMO
    let visibleData = [...asset.chartData].slice(-visibleDataCount);
    
    // Ensure the last few points are always trending upward
    const lastFewPoints = visibleData.slice(-5);
    for (let i = 1; i < lastFewPoints.length; i++) {
      // Make sure each point is at least 2% higher than the previous
      // But skip this during dump phase to allow drops
      if (!isInDump) {
        const minValue = lastFewPoints[i-1].marketCap * 1.02;
        if (lastFewPoints[i].marketCap < minValue) {
          lastFewPoints[i] = {
            ...lastFewPoints[i],
            marketCap: minValue
          };
        }
      }
    }
    
    // Make the last point (current price) positioned at approximately 75% of vertical height too
    // But skip during dumps to allow the drop to be visible
    if (!isInDump) {
      const lastPoint = lastFewPoints[lastFewPoints.length - 1];
      const verticalTarget = minMarketCap + (maxMarketCap - minMarketCap) * 0.75;
      
      // Only adjust if needed - ensure it's not lower than current value
      if (lastPoint.marketCap < verticalTarget) {
        lastPoint.marketCap = verticalTarget;
      }
    }
    
    // Replace the last few points in the visibleData
    visibleData.splice(-5, 5, ...lastFewPoints);
    
    return {
      labels: asset.chartData.map(point => {
        const date = new Date(point.timestamp);
        return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: asset.symbol,
          data: visibleData.map(point => point.marketCap),
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: isInDump ? '#ff6b6b' : isInRecovery ? '#00bf63' : '#4bc0c0',
          tension: 0.3,
          pointHoverRadius: 0,
          borderWidth: 2,
          // Add point styling to show only the last point
          pointBackgroundColor: function(context: {dataIndex: number, dataset: {data: any[]}}) {
            // Only show the last point (at 75% of the chart)
            const index = context.dataIndex;
            const count = context.dataset.data.length;
            return index === count - 1 ? (isInDump ? '#ff6b6b' : isInRecovery ? '#00bf63' : '#4bc0c0') : 'transparent';
          },
          pointBorderColor: function(context: {dataIndex: number, dataset: {data: any[]}}) {
            const index = context.dataIndex;
            const count = context.dataset.data.length;
            return index === count - 1 ? (isInDump ? '#ff6b6b' : isInRecovery ? '#00bf63' : '#4bc0c0') : 'transparent';
          },
          pointRadius: function(context: {dataIndex: number, dataset: {data: any[]}}) {
            const index = context.dataIndex;
            const count = context.dataset.data.length;
            return index === count - 1 ? 6 : 0;
          },
          pointBorderWidth: function(context: {dataIndex: number, dataset: {data: any[]}}) {
            const index = context.dataIndex;
            const count = context.dataset.data.length;
            return index === count - 1 ? 2 : 0;
          },
        },
      ],
    };
  }, [asset, minMarketCap, maxMarketCap, isInDump, isInRecovery]);

  // Effect to position the price bubble at the exact position of the last visible data point (75%)
  useEffect(() => {
    if (!chartContainerRef.current || !priceBubbleRef.current || !chartRef.current) return;
    
    const chart = chartRef.current;
    const bubbleElement = priceBubbleRef.current;
    const containerElement = chartContainerRef.current;
    
    // Need to wait for chart to render
    const positionBubble = () => {
      if (!chart || !chart.canvas || !bubbleElement || !containerElement) return;
      
      // Get dataset meta
      const datasetMeta = chart.getDatasetMeta(0);
      
      if (chart.scales && datasetMeta && datasetMeta.data.length > 0) {
        // Get the position of the last visible data point (at 75% mark)
        const count = datasetMeta.data.length;
        const lastVisiblePoint = datasetMeta.data[count - 1];
        
        // Position bubble at exactly this x position
        const bubbleWidth = bubbleElement.offsetWidth;
        bubbleElement.style.left = `${lastVisiblePoint.x - (bubbleWidth / 2)}px`;
        bubbleElement.style.top = `${lastVisiblePoint.y - 30}px`;
      } else {
        // Fallback if chart is not ready
        const containerWidth = containerElement.offsetWidth;
        const bubbleWidth = bubbleElement.offsetWidth;
        const xPosition = containerWidth * 0.75 - (bubbleWidth / 2);
        bubbleElement.style.left = `${xPosition}px`;
      }
    };
    
    // Position initially after a short delay
    const initialTimer = setTimeout(positionBubble, 100);
    
    // Then set up a continuous update interval to handle real-time changes
    const updateInterval = setInterval(positionBubble, 100);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(updateInterval);
    };
  }, [asset, chartContainerRef, priceBubbleRef, chartRef, displayPrice]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false,
          },
          // Add 25% more space on the right for mental projection
          max: asset.chartData.length * 1.25,
        },
        y: {
          display: false,
          grid: {
            display: false,
          },
          min: minMarketCap * 0.75, // Show 75% of vertical height by adjusting min/max
          max: maxMarketCap * 1.25, // Add extra space at the top
        },
      },
      animation: false,
    };
  }, [asset.chartData, minMarketCap, maxMarketCap]);

  return (
    <div className="chart-card">

      {/* Chart container becomes the main focus */}
      <div className="chart-container" ref={chartContainerRef}>
        {/* Future projection area - just a gradient, no question mark or price */}
        <div className="chart-projection-area"></div>
        
        {/* Current price highlight - positioned at the end of the visible chart */}
        <div className="current-price-indicator">
          <div 
            className={`current-price-bubble ${isInDump ? 'price-dropping' : isInRecovery ? 'price-recovering' : ''}`} 
            ref={priceBubbleRef}
          >
            {formatSimplifiedPrice(displayPrice)}
          </div>
        </div>
        
        {/* Price labels - reduced number */}
        <div className="price-labels">
          {priceSteps.map((price, index) => (
            <div key={index} className="price-label">
              {formatSimplifiedPrice(price)}
            </div>
          ))}
        </div>
        
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
      
      {/* Footer section contains name, trending badge and change percentage */}
      <div className="chart-footer">
        <div className="chart-info">
          <div className="token-header">
            <img src={asset.iconUrl} alt={asset.symbol} className="token-icon" />
            <h2>{asset.name}</h2>
          </div>
        </div>
        <div 
          className={`change-badge ${isInDump ? 'dropping' : isInRecovery ? 'recovering' : ''}`}
          style={{ color: percentIncrease > 0 ? '#4bc0c0' : '#ff6b6b' }}
        >
          {percentIncrease > 0 ? '+' : ''}{percentIncrease.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default ChartCard; 