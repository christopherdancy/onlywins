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

// Generate random crypto icon
export const generateTokenIcon = (symbol: string): string => {
  // Define a set of vibrant colors for crypto tokens
  const bgColors = [
    '#FF4500', '#FF8C00', '#FFD700', '#7CFC00', '#00FA9A', 
    '#00FFFF', '#00BFFF', '#0000FF', '#8A2BE2', '#FF00FF',
    '#FF1493', '#FF69B4', '#8B008B', '#4B0082', '#9370DB',
    '#1E90FF', '#32CD32', '#DAA520', '#FF6347', '#20B2AA'
  ];
  
  // Random background color
  const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
  
  // Generate random pattern elements for the icon
  const generatePattern = () => {
    const patterns = [
      // Circle in the middle
      `<circle cx="50" cy="50" r="${20 + Math.random() * 15}" fill="${shadeColor(bgColor, -20)}" />`,
      
      // Multiple smaller circles
      Array.from({length: 3 + Math.floor(Math.random() * 5)}, (_, i) => {
        const r = 5 + Math.random() * 10;
        const angle = (i / 5) * Math.PI * 2;
        const distance = 15 + Math.random() * 20;
        const x = 50 + Math.cos(angle) * distance;
        const y = 50 + Math.sin(angle) * distance;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${shadeColor(bgColor, -30)}" />`;
      }).join(''),
      
      // Hexagon pattern
      `<polygon points="50,30 70,40 70,60 50,70 30,60 30,40" fill="${shadeColor(bgColor, -20)}" />`,
      
      // Triangle pattern
      `<polygon points="50,25 75,75 25,75" fill="${shadeColor(bgColor, -20)}" />`,
      
      // Diamond pattern
      `<polygon points="50,20 80,50 50,80 20,50" fill="${shadeColor(bgColor, -20)}" />`
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  };
  
  // Add random decorative elements
  const generateDecorations = () => {
    const decorations = [];
    const numDecorations = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numDecorations; i++) {
      const options = [
        // Small dot
        `<circle cx="${20 + Math.random() * 60}" cy="${20 + Math.random() * 60}" r="${2 + Math.random() * 4}" fill="#FFF" opacity="0.6" />`,
        
        // Small line
        (() => {
          const x1 = 30 + Math.random() * 40;
          const y1 = 30 + Math.random() * 40;
          const length = 10 + Math.random() * 20;
          const angle = Math.random() * Math.PI * 2;
          const x2 = x1 + Math.cos(angle) * length;
          const y2 = y1 + Math.sin(angle) * length;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFF" stroke-width="2" opacity="0.5" />`;
        })(),
        
        // Small square
        `<rect x="${30 + Math.random() * 40}" y="${30 + Math.random() * 40}" width="${5 + Math.random() * 10}" height="${5 + Math.random() * 10}" fill="#FFF" opacity="0.5" />`
      ];
      
      decorations.push(options[Math.floor(Math.random() * options.length)]);
    }
    
    return decorations.join('');
  };
  
  // Get first letter of symbol for the icon
  const letter = symbol.charAt(0);
  
  // Generate the SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="50" r="50" fill="${bgColor}" />
      ${generatePattern()}
      ${generateDecorations()}
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${letter}</text>
    </svg>
  `;
  
  // Convert to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Helper function to lighten or darken a color
function shadeColor(color: string, percent: number): string {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.min(255, Math.max(0, R + R * percent / 100));
  G = Math.min(255, Math.max(0, G + G * percent / 100));
  B = Math.min(255, Math.max(0, B + B * percent / 100));

  return "#" + ((1 << 24) + (Math.round(R) << 16) + (Math.round(G) << 8) + Math.round(B)).toString(16).slice(1);
}

// Generate data points for a chart that's already in mid-pump
export const generatePumpChartData = (duration: number = 60): ChartData[] => {
  const data: ChartData[] = [];
  const now = Date.now();
  
  // Base market cap (between $20K and $40K for easier reading)
  const baseMarketCap = Math.random() * 20_000 + 20_000;
  
  // Maximum reasonable market cap (10 billion)
  const MAX_MARKET_CAP = 10_000_000_000;
  
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
    
    // Cap market cap at maximum reasonable value
    marketCap = Math.min(marketCap, MAX_MARKET_CAP);
    
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
        
        // Make sure we don't exceed the maximum cap
        data[i + j].marketCap = Math.min(data[i + j].marketCap, MAX_MARKET_CAP);
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
  const symbol = generateRandomSymbol(name);
  const chartData = generatePumpChartData();
  const iconUrl = generateTokenIcon(symbol);
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    name,
    symbol,
    iconUrl,
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