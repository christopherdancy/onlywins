import React from 'react';
import { Line } from 'react-chartjs-2';
import { Asset } from '../types';
import { formatMarketCap } from '../utils/chartUtils';
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

const ChartCard: React.FC<ChartCardProps> = ({ asset }) => {
  // Prepare data for Chart.js
  const chartData = {
    labels: asset.chartData.map(point => {
      const date = new Date(point.timestamp);
      return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: asset.symbol,
        data: asset.chartData.map(point => point.marketCap),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: '#4bc0c0',
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Market Cap: ${formatMarketCap(context.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => formatMarketCap(typeof value === 'number' ? value : Number(value)),
        },
      },
    },
    animation: {
      duration: 0, // Disable animations for better performance
    },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h2>{asset.name} <span className="symbol">{asset.symbol}</span></h2>
        <div className="market-cap">Market Cap: {formatMarketCap(asset.currentMarketCap)}</div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ChartCard; 