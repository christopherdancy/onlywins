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

// Generate data points for a chart that's already in mid-pump
export const generatePumpChartData = (duration: number = 60): ChartData[] => {
  const data: ChartData[] = [];
  const now = Date.now();
  
  // Base market cap (between $20K and $40K for easier reading)
  const baseMarketCap = Math.random() * 20_000 + 20_000;
  
  // Generate data for each point - ensure continuous upward movement
  // to avoid plateau patterns
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000; // 1 second intervals
    let marketCap;
    
    // First 20% - early accumulation phase with shallow but steady uptrend
    if (i < duration * 0.2) {
      // Initial growth rate increases steadily
      const progressFactor = i / (duration * 0.2); // 0 to 1 factor
      const growthRate = 1 + (0.008 + progressFactor * 0.012 + Math.random() * 0.006); // Increased minimums
      marketCap = i === 0 
        ? baseMarketCap 
        : data[i-1].marketCap * growthRate;
    } 
    // Middle 55% - accelerating growth phase with no plateaus
    else if (i < duration * 0.75) {
      // Growth should accelerate through this phase
      const progressInMidPhase = (i - (duration * 0.2)) / (duration * 0.55);
      
      // Base factor increases from 2% to 6% through this phase (increased minimums)
      const baseFactor = 0.02 + progressInMidPhase * 0.04;
      
      // Add randomness but ensure minimum growth
      const randomFactor = Math.random() * 0.03;
      const growthRate = 1 + baseFactor + randomFactor;
      
      marketCap = data[i-1].marketCap * growthRate;
      
      // Insert occasional larger jumps (15% chance) - increased frequency
      if (Math.random() < 0.15) {
        marketCap *= (1 + Math.random() * 0.08); // Bigger jumps
      }
    } 
    // Final 25% - parabolic phase with increasing slope
    else {
      // Growth rate increases more dramatically in final phase
      const progressInFinalPhase = (i - duration * 0.75) / (duration * 0.25);
      const pumpFactor = 0.05 + progressInFinalPhase * 0.10; // 5% to 15% - increased
      
      // Add volatility but ensure it always moves up
      const volatility = Math.random() * 0.04; // Increased volatility 
      const growthRate = 1 + pumpFactor + volatility;
      
      marketCap = data[i-1].marketCap * growthRate;
      
      // Ensure the last few points always accelerate upward
      if (i >= duration - 5) {
        const pointsFromEnd = duration - i;
        // Add extra growth in final points (more as we get closer to the end)
        const extraGrowth = (5 - pointsFromEnd) * 0.015; // 1.5% to 7.5% extra growth
        marketCap *= (1 + extraGrowth);
      }
    }
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  // More aggressive plateau detection and correction
  for (let i = 0; i < data.length - 5; i++) {
    const segment = data.slice(i, i + 5);
    const startPrice = segment[0].marketCap;
    const endPrice = segment[segment.length - 1].marketCap;
    const growth = (endPrice - startPrice) / startPrice;
    
    // If a plateau is detected, increase the values to create an uptrend
    if (growth < 0.05) { // More aggressive threshold (5% instead of 3%)
      // Apply a fix by increasing each point progressively
      for (let j = 1; j < segment.length; j++) {
        // Each point gets progressively higher adjustment
        const adjustment = 1 + (j * 0.015); // Increased adjustment factor
        data[i + j].marketCap *= adjustment;
      }
    }
  }
  
  return data;
};

// Generate random funny names for assets
const nameAdjectives = [
  'Moon', 'Rocket', 'Diamond', 'Cosmic', 'Galactic', 'Lambo', 'Lunar', 'Stellar', 'Epic', 'Hyper',
  'Alpha', 'Meta', 'Mega', 'Ultra', 'Super', 'Turbo', 'Nitro', 'Quantum', 'Cyber', 'Degen'
];

const nameNouns = [
  'Doge', 'Shiba', 'Pepe', 'Floki', 'Elon', 'Ape', 'Cat', 'Moon', 'Coin', 'Token',
  'Wojak', 'Chad', 'Pump', 'Lambo', 'Rocket', 'Gainz', 'Tendies', 'Mars', 'Fomo', 'Yolo'
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