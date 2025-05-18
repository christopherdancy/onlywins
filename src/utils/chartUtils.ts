import { Asset, ChartData } from '../types';

// Function to format large numbers in a readable way
export const formatMarketCap = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Generate data points for a pumping chart
export const generatePumpChartData = (duration: number = 60): ChartData[] => {
  const data: ChartData[] = [];
  const now = Date.now();
  
  // Base market cap (between $100K and $10M)
  const baseMarketCap = Math.random() * 9_900_000 + 100_000;
  
  // Generate data for each point
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000; // 1 second intervals
    
    // First 40% relatively stable with slight uptrend
    if (i < duration * 0.4) {
      const smallChange = baseMarketCap * (1 + (Math.random() * 0.01 - 0.005 + (i / (duration * 4))));
      data.push({
        timestamp,
        marketCap: smallChange
      });
    } 
    // Middle 30% - starting to pump (10-15% increase)
    else if (i < duration * 0.7) {
      const previousMarketCap = data[i - 1].marketCap;
      const increaseFactor = 1 + (Math.random() * 0.03 + 0.01); // 1-4% increase per point
      data.push({
        timestamp,
        marketCap: previousMarketCap * increaseFactor
      });
    } 
    // Final 30% - parabolic pump (20%+ total increase)
    else {
      const previousMarketCap = data[i - 1].marketCap;
      // Increasing growth rate as we approach the end
      const progressInFinalPhase = (i - duration * 0.7) / (duration * 0.3);
      const increaseFactor = 1 + (Math.random() * 0.04 + 0.02 + progressInFinalPhase * 0.08);
      data.push({
        timestamp,
        marketCap: previousMarketCap * increaseFactor
      });
    }
  }
  
  return data;
};

// Generate random funny names for assets
const nameAdjectives = [
  'Moon', 'Rocket', 'Diamond', 'Cosmic', 'Galactic', 'Lambo', 'Lunar', 'Stellar', 'Epic', 'Hyper'
];

const nameNouns = [
  'Doge', 'Shiba', 'Pepe', 'Floki', 'Elon', 'Ape', 'Cat', 'Moon', 'Coin', 'Token'
];

export const generateRandomName = (): string => {
  const adjective = nameAdjectives[Math.floor(Math.random() * nameAdjectives.length)];
  const noun = nameNouns[Math.floor(Math.random() * nameNouns.length)];
  return `${adjective} ${noun}`;
};

export const generateRandomSymbol = (name: string): string => {
  // Take first letter of each word and capitalize
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

// Generate a random asset with pump chart
export const generateRandomAsset = (): Asset => {
  const name = generateRandomName();
  const chartData = generatePumpChartData();
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    name,
    symbol: generateRandomSymbol(name),
    currentMarketCap: chartData[chartData.length - 1].marketCap,
    chartData
  };
};

// Generate a collection of random assets
export const generateAssetCollection = (count: number = 10): Asset[] => {
  const assets: Asset[] = [];
  for (let i = 0; i < count; i++) {
    assets.push(generateRandomAsset());
  }
  return assets;
}; 