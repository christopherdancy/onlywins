// Script to generate predefined chart data for the Bitcoin conference demo
// Includes well-known crypto assets mixed with volatile meme coins
const fs = require('fs');
const path = require('path');

// Define chart patterns
const ChartPattern = {
  PUMP_AND_DUMP: 'pump_and_dump',
  STEADY_RISE: 'steady_rise',
  DOWNWARD_TREND: 'downward_trend',
  RECOVERY: 'recovery',
  V_SHAPE: 'v_shape',
  DOUBLE_PEAK: 'double_peak',
  VOLATILE_SIDEWAYS: 'volatile_sideways',
  EXPONENTIAL_PUMP: 'exponential_pump'
};

// Chart strategy types
const ChartStrategy = {
  UPTREND_WITH_DUMPS: 'uptrend_with_dumps',
  DOWNTREND_WITH_PUMPS: 'downtrend_with_pumps'
};

// Well-known crypto assets with their real colors and characteristics
const KNOWN_ASSETS = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'The original cryptocurrency and digital gold standard',
    color: '#F7931A',
    basePrice: 110000, // ~$110k
    totalSupply: 21000000, // 21M BTC
    volatility: 0.6 // Lower volatility for established asset
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'The world computer powering decentralized applications',
    color: '#627EEA',
    basePrice: 2600, // ~$2600
    totalSupply: 120000000, // ~120M ETH
    volatility: 0.7
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    description: 'High-performance blockchain for decentralized apps and crypto',
    color: '#9945FF',
    basePrice: 170, // ~$170
    totalSupply: 580000000, // ~580M SOL
    volatility: 1.0
  },
  {
    name: 'XRP',
    symbol: 'XRP',
    description: 'Digital asset for global payments and liquidity',
    color: '#23292F',
    basePrice: 2.3, // ~$2.30
    totalSupply: 100000000000, // 100B XRP
    volatility: 0.8
  },
  {
    name: 'Dogecoin',
    symbol: 'DOGE',
    description: 'The meme coin that started it all - much wow!',
    color: '#C2A633',
    basePrice: 0.22, // ~$0.22
    totalSupply: 150000000000, // ~150B DOGE
    volatility: 1.2
  }
];

// Helper to add noise to price values
function addNoise(value, noiseLevel) {
  const noise = (Math.random() * 2 - 1) * (value * noiseLevel);
  return Math.max(0.0001, value + noise); // Ensure minimum value
}

// Helper to calculate market cap from price and supply
function calculateMarketCap(price, totalSupply) {
  return price * totalSupply;
}

// Helper to determine if we should use price or market cap display
function shouldDisplayPrice(marketCap) {
  return marketCap > 10000000000; // Display price if market cap > $10B (for well-known assets)
}

// Generate chart data for a pump and dump pattern
function generatePumpAndDump(duration = 120, volatility = 1.0, basePrice = 0.25, totalSupply = 100000000) {
  const data = [];
  const now = Date.now();
  
  // Define the pattern phases
  const pumpStart = Math.floor(duration * 0.1);
  const pumpPeak = Math.floor(duration * 0.4);
  const dumpEnd = Math.floor(duration * 0.8);
  
  // Calculate base market cap for scaling logic
  const baseMarketCap = calculateMarketCap(basePrice, totalSupply);
  
  // Maximum pump height (2x-6x initial based on volatility, scaled for large caps)
  const pumpMultiplier = baseMarketCap > 1000000000 ? 
    1.5 + volatility * 2 : // Large caps: 1.5x-3.5x
    3 + volatility * 7;    // Small caps: 3x-10x
  
  for (let i = 0; i < duration; i++) {
    let price;
    const timestamp = now - (duration - i) * 1000; // 1 second intervals
    
    if (i < pumpStart) {
      // Initial sideways with slight uptrend
      const progress = i / pumpStart;
      price = basePrice * (1 + progress * 0.3 * volatility);
    } 
    else if (i < pumpPeak) {
      // Pump phase - accelerating growth
      const progress = (i - pumpStart) / (pumpPeak - pumpStart);
      // Use a power function for accelerating growth
      const growthFactor = Math.pow(progress, 1.8) * (pumpMultiplier - 1) + 1;
      price = basePrice * growthFactor;
    } 
    else if (i < dumpEnd) {
      // Dump phase - rapid decline
      const progress = (i - pumpPeak) / (dumpEnd - pumpPeak);
      const peakPrice = basePrice * pumpMultiplier;
      // Faster initial drop, then slower
      const dumpFactor = 1 - Math.pow(progress, 0.6);
      const remainingValue = basePrice + (peakPrice - basePrice) * dumpFactor;
      price = remainingValue;
    } 
    else {
      // Final phase - slight recovery or continued decline
      const progress = (i - dumpEnd) / (duration - dumpEnd);
      const endPrice = basePrice * (0.7 + Math.random() * 0.5); // End between 70-120% of start
      const dumpEndPrice = data[dumpEnd - 1].price;
      price = dumpEndPrice + (endPrice - dumpEndPrice) * progress;
    }
    
    // Add noise proportional to volatility (scaled for market cap)
    const noiseLevel = baseMarketCap > 1000000000 ? 0.02 * volatility : 0.04 * volatility;
    price = addNoise(price, noiseLevel);
    
    // Calculate market cap from price
    const marketCap = calculateMarketCap(price, totalSupply);
    
    data.push({
      timestamp,
      price,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a steady rise pattern
function generateSteadyRise(duration = 120, volatility = 1.0, basePrice = 0.25, totalSupply = 100000000) {
  const data = [];
  const now = Date.now();
  
  // Calculate base market cap for scaling logic
  const baseMarketCap = calculateMarketCap(basePrice, totalSupply);
  
  // Final multiplier (scaled based on market cap size)
  const finalMultiplier = baseMarketCap > 1000000000 ? 
    1.2 + volatility * 1.5 : // Large caps: 1.2x-2.7x
    2 + volatility * 3;      // Small caps: 2x-5x
  
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    const progress = i / (duration - 1);
    
    // Use a slightly curved function for natural-looking growth
    const growthFactor = 1 + (Math.pow(progress, 1.2) * (finalMultiplier - 1));
    let price = basePrice * growthFactor;
    
    // Add noise proportional to volatility (scaled for market cap)
    const noiseLevel = baseMarketCap > 1000000000 ? 0.025 * volatility : 0.05 * volatility;
    price = addNoise(price, noiseLevel);
    
    // Calculate market cap from price
    const marketCap = calculateMarketCap(price, totalSupply);
    
    data.push({
      timestamp,
      price,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a downward trend pattern
function generateDownwardTrend(duration = 120, volatility = 1.0, basePrice = 1.5, totalSupply = 100000000) {
  const data = [];
  const now = Date.now();
  
  // Calculate base market cap for scaling logic
  const baseMarketCap = calculateMarketCap(basePrice, totalSupply);
  
  // Final multiplier (scaled based on market cap size)
  const finalMultiplier = baseMarketCap > 1000000000 ? 
    0.8 - volatility * 0.2 : // Large caps: 0.6x-0.8x
    0.6 - volatility * 0.4;  // Small caps: 0.2x-0.6x
  
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    const progress = i / (duration - 1);
    
    // Use a curve for natural-looking decline
    const declineFactor = 1 - (Math.pow(progress, 0.7) * (1 - finalMultiplier));
    let price = basePrice * declineFactor;
    
    // Add noise proportional to volatility (scaled for market cap)
    const noiseLevel = baseMarketCap > 1000000000 ? 0.025 * volatility : 0.05 * volatility;
    price = addNoise(price, noiseLevel);
    
    // Calculate market cap from price
    const marketCap = calculateMarketCap(price, totalSupply);
    
    data.push({
      timestamp,
      price,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a recovery pattern
function generateRecovery(duration = 120, volatility = 1.0, basePrice = 0.5, totalSupply = 100000000) {
  const data = [];
  const now = Date.now();
  
  // Calculate base market cap for scaling logic
  const baseMarketCap = calculateMarketCap(basePrice, totalSupply);
  
  // Define pattern phases
  const dipStart = Math.floor(duration * 0.1);
  const dipBottom = Math.floor(duration * 0.4);
  const recoveryEnd = Math.floor(duration * 0.9);
  
  // How low the dip goes (scaled for market cap)
  const dipPercentage = baseMarketCap > 1000000000 ? 
    0.8 - volatility * 0.2 : // Large caps: 0.6x-0.8x
    0.6 - volatility * 0.4;  // Small caps: 0.2x-0.6x
  
  // How high the recovery goes (scaled for market cap)
  const recoveryMultiplier = baseMarketCap > 1000000000 ? 
    1.1 + volatility * 0.8 : // Large caps: 1.1x-1.9x
    1.5 + volatility * 1.5;  // Small caps: 1.5x-3x
  
  for (let i = 0; i < duration; i++) {
    let price;
    const timestamp = now - (duration - i) * 1000;
    
    if (i < dipStart) {
      // Initial sideways with slight downtrend
      const progress = i / dipStart;
      price = basePrice * (1 - progress * 0.15);
    } 
    else if (i < dipBottom) {
      // Dip phase
      const progress = (i - dipStart) / (dipBottom - dipStart);
      // Use a curve for natural-looking decline
      const dipFactor = 1 - (Math.pow(progress, 0.7) * (1 - dipPercentage));
      price = basePrice * dipFactor;
    } 
    else if (i < recoveryEnd) {
      // Recovery phase
      const progress = (i - dipBottom) / (recoveryEnd - dipBottom);
      const bottomPrice = basePrice * dipPercentage;
      const finalPrice = basePrice * recoveryMultiplier;
      // Accelerated recovery curve
      const recoveryFactor = Math.pow(progress, 1.1);
      price = bottomPrice + (finalPrice - bottomPrice) * recoveryFactor;
    } 
    else {
      // Final phase - slight continuation or stabilization
      const progress = (i - recoveryEnd) / (duration - recoveryEnd);
      const recoveryPrice = data[recoveryEnd - 1].price;
      const finalAdjustment = 1 + (progress * 0.15 * (Math.random() > 0.5 ? 1 : -1));
      price = recoveryPrice * finalAdjustment;
    }
    
    // Add noise proportional to volatility (scaled for market cap)
    const noiseLevel = baseMarketCap > 1000000000 ? 0.02 * volatility : 0.04 * volatility;
    price = addNoise(price, noiseLevel);
    
    // Calculate market cap from price
    const marketCap = calculateMarketCap(price, totalSupply);
    
    data.push({
      timestamp,
      price,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a V-shape pattern (sharp dip and recovery)
function generateVShape(duration = 120, volatility = 1.0, baseMarketCap = 50000) {
  const data = [];
  const now = Date.now();
  
  // V shape pivot point (30%-70% of the way through)
  const pivotPoint = Math.floor(duration * (0.3 + Math.random() * 0.4));
  
  // How low the dip goes (scaled for market cap)
  const dipPercentage = baseMarketCap > 1000000000 ? 
    0.75 - volatility * 0.2 : // Large caps: 0.55x-0.75x
    0.55 - volatility * 0.4;  // Small caps: 0.15x-0.55x
  
  // How high the recovery goes (scaled for market cap)
  const recoveryMultiplier = baseMarketCap > 1000000000 ? 
    1.1 + volatility * 1.2 : // Large caps: 1.1x-2.3x
    1.2 + volatility * 2.3;  // Small caps: 1.2x-3.5x
  
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    let marketCap;
    
    if (i < pivotPoint) {
      // Downward phase
      const progress = i / pivotPoint;
      // Accelerating downtrend
      const dipFactor = 1 - (Math.pow(progress, 1.4) * (1 - dipPercentage));
      marketCap = baseMarketCap * dipFactor;
    } 
    else {
      // Upward phase
      const progress = (i - pivotPoint) / (duration - pivotPoint);
      const bottomCap = baseMarketCap * dipPercentage;
      const finalCap = baseMarketCap * recoveryMultiplier;
      // Accelerating recovery
      const recoveryFactor = Math.pow(progress, 0.7); // Faster initial recovery
      marketCap = bottomCap + (finalCap - bottomCap) * recoveryFactor;
    }
    
    // Add noise proportional to volatility (scaled for market cap)
    const noiseLevel = baseMarketCap > 1000000000 ? 0.02 * volatility : 0.04 * volatility;
    marketCap = addNoise(marketCap, noiseLevel);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a double peak pattern
function generateDoublePeak(duration = 120, volatility = 1.0, baseMarketCap = 25000) {
  const data = [];
  const now = Date.now();
  
  // Define pattern phases
  const firstPeakTime = Math.floor(duration * 0.25);
  const valleyTime = Math.floor(duration * 0.5);
  const secondPeakTime = Math.floor(duration * 0.75);
  
  // Peak heights (scaled for market cap)
  const firstPeakMultiplier = baseMarketCap > 1000000000 ? 
    1.3 + volatility * 2.2 : // Large caps: 1.3x-3.5x
    2.5 + volatility * 3.5;  // Small caps: 2.5x-6x
  
  // Second peak slightly higher or lower than first
  const secondPeakMultiplier = firstPeakMultiplier * (0.8 + Math.random() * 0.6);
  
  // Valley depth (scaled for market cap)
  const valleyPercentage = baseMarketCap > 1000000000 ? 
    0.8 - volatility * 0.15 : // Large caps: 0.65x-0.8x
    0.7 - volatility * 0.35;  // Small caps: 0.35x-0.7x
  
  for (let i = 0; i < duration; i++) {
    let marketCap;
    const timestamp = now - (duration - i) * 1000;
    
    if (i < firstPeakTime) {
      // First rise
      const progress = i / firstPeakTime;
      // Accelerating growth curve
      const growthFactor = Math.pow(progress, 1.4) * (firstPeakMultiplier - 1) + 1;
      marketCap = baseMarketCap * growthFactor;
    } 
    else if (i < valleyTime) {
      // Dip after first peak
      const progress = (i - firstPeakTime) / (valleyTime - firstPeakTime);
      const peakCap = baseMarketCap * firstPeakMultiplier;
      const valleyCap = peakCap * valleyPercentage;
      // Faster initial drop
      const dipFactor = Math.pow(progress, 0.6);
      marketCap = peakCap - (peakCap - valleyCap) * dipFactor;
    } 
    else if (i < secondPeakTime) {
      // Second rise
      const progress = (i - valleyTime) / (secondPeakTime - valleyTime);
      const valleyCap = data[valleyTime - 1].marketCap;
      const peakCap = baseMarketCap * secondPeakMultiplier;
      // Accelerating growth curve
      const growthFactor = Math.pow(progress, 1.2);
      marketCap = valleyCap + (peakCap - valleyCap) * growthFactor;
    } 
    else {
      // Final decline
      const progress = (i - secondPeakTime) / (duration - secondPeakTime);
      const peakCap = data[secondPeakTime - 1].marketCap;
      // End between 40-80% of second peak based on volatility
      const finalPercentage = 0.8 - volatility * 0.4;
      const finalCap = peakCap * finalPercentage;
      // Faster initial drop
      const dropFactor = Math.pow(progress, 0.55);
      marketCap = peakCap - (peakCap - finalCap) * dropFactor;
    }
    
    // Add noise proportional to volatility (scaled for market cap)
    const noiseLevel = baseMarketCap > 1000000000 ? 0.025 * volatility : 0.05 * volatility;
    marketCap = addNoise(marketCap, noiseLevel);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for volatile sideways movement
function generateVolatileSideways(duration = 120, volatility = 1.0, baseMarketCap = 25000) {
  const data = [];
  const now = Date.now();
  
  // Volatility range (scaled for market cap)
  const volatilityRange = baseMarketCap > 1000000000 ? 
    0.15 + volatility * 0.25 : // Large caps: 15-40% swings
    0.3 + volatility * 0.5;    // Small caps: 30-80% swings
  
  // Generate using a sine wave with random adjustments
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    
    // Base sine wave
    const sineValue = Math.sin(i / (duration / (8 + Math.random() * 6))); // 8-14 oscillations
    
    // Add some random walks for less predictable movements
    let randomWalk = 0;
    if (i > 0) {
      const prevRandomWalk = (data[i-1].marketCap / baseMarketCap) - 1;
      // Random walk with mean reversion
      randomWalk = prevRandomWalk * 0.75 + (Math.random() * 0.15 - 0.075);
    }
    
    // Combine sine and random walk (weight based on volatility)
    const combinedEffect = (sineValue * 0.6 + randomWalk * 0.4) * volatilityRange;
    
    // Final market cap
    let marketCap = baseMarketCap * (1 + combinedEffect);
    
    // Add small noise
    marketCap = addNoise(marketCap, 0.02);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for an exponential pump pattern
function generateExponentialPump(duration = 120, volatility = 1.0, baseMarketCap = 15000) {
  const data = [];
  const now = Date.now();
  
  // Final multiplier (scaled for market cap)
  const finalMultiplier = baseMarketCap > 1000000000 ? 
    2 + volatility * 8 :  // Large caps: 2x-10x
    8 + volatility * 17;  // Small caps: 8x-25x
  
  // Acceleration point (60-80% through the data)
  const accelerationPoint = Math.floor(duration * (0.6 + Math.random() * 0.2));
  
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    let marketCap;
    
    if (i < accelerationPoint) {
      // Initial slow growth phase
      const progress = i / accelerationPoint;
      // Slow start with mild acceleration
      const growthFactor = 1 + Math.pow(progress, 1.4) * (finalMultiplier * 0.25 - 1);
      marketCap = baseMarketCap * growthFactor;
    } 
    else {
      // Explosive growth phase
      const progress = (i - accelerationPoint) / (duration - accelerationPoint);
      const prePumpCap = data[accelerationPoint - 1].marketCap;
      const finalCap = baseMarketCap * finalMultiplier;
      // Exponential curve for parabolic rise
      const growthFactor = Math.pow(progress, 1.6);
      marketCap = prePumpCap + (finalCap - prePumpCap) * growthFactor;
    }
    
    // Add noise proportional to volatility (less noise at the end to preserve the clean pump)
    const noiseFactor = Math.max(0.02, 0.05 * (1 - i/duration));
    const noiseLevel = baseMarketCap > 1000000000 ? noiseFactor * 0.5 : noiseFactor;
    marketCap = addNoise(marketCap, noiseLevel * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate a chart based on specified pattern
function generateChartByPattern(pattern, duration = 120, volatility = 1.0, basePrice = 0.25, totalSupply = 100000000) {
  switch (pattern) {
    case ChartPattern.PUMP_AND_DUMP:
      return generatePumpAndDump(duration, volatility, basePrice, totalSupply);
    case ChartPattern.STEADY_RISE:
      return generateSteadyRise(duration, volatility, basePrice, totalSupply);
    case ChartPattern.DOWNWARD_TREND:
      return generateDownwardTrend(duration, volatility, basePrice, totalSupply);
    case ChartPattern.RECOVERY:
      return generateRecovery(duration, volatility, basePrice, totalSupply);
    case ChartPattern.V_SHAPE:
      return generateVShape(duration, volatility, basePrice, totalSupply);
    case ChartPattern.DOUBLE_PEAK:
      return generateDoublePeak(duration, volatility, basePrice, totalSupply);
    case ChartPattern.VOLATILE_SIDEWAYS:
      return generateVolatileSideways(duration, volatility, basePrice, totalSupply);
    case ChartPattern.EXPONENTIAL_PUMP:
      return generateExponentialPump(duration, volatility, basePrice, totalSupply);
    default:
      return generatePumpAndDump(duration, volatility, basePrice, totalSupply);
  }
}

// Random name generation for meme coins
const memeAdjectives = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 
  'Hyper', 'Ultra', 'Super', 'Mega', 'Quantum',
  'Cosmic', 'Stellar', 'Astro', 'Nebula', 'Galactic',
  'Cyber', 'Digital', 'Techno', 'Crypto', 'Nexus',
  'Elite', 'Prime', 'Max', 'Pro', 'Extreme',
  'Meta', 'Core', 'Fusion', 'Pulse', 'Vortex'
];

const memeNouns = [
  'Coin', 'Chain', 'Token', 'Cash', 'Protocol',
  'Network', 'Swap', 'Finance', 'Connect', 'Link',
  'Node', 'Block', 'Ledger', 'Hash', 'Crypto',
  'Money', 'Wallet', 'Asset', 'Yield', 'Stake',
  'Mining', 'Oracle', 'Tendies', 'Moon', 'Rocket',
  'Lambo', 'Gem', 'Diamond', 'Ape', 'Pepe'
];

function generateRandomMemeName() {
  const adjective = memeAdjectives[Math.floor(Math.random() * memeAdjectives.length)];
  const noun = memeNouns[Math.floor(Math.random() * memeNouns.length)];
  return `${adjective} ${noun}`;
}

function generateRandomMemeSymbol(name) {
  // Extract first letters of each word
  const words = name.split(' ');
  let symbol = '';
  
  // Use 2-4 letters
  for (let i = 0; i < Math.min(words.length, 2); i++) {
    symbol += words[i].substring(0, 2).toUpperCase();
  }
  
  return symbol;
}

// Generate a token icon as a simple SVG data URL
function generateTokenIcon(symbol, color = null) {
  // Define a set of vibrant colors for meme tokens
  const memeColors = [
    '#FF4500', '#FF8C00', '#FFD700', '#7CFC00', '#00FA9A', 
    '#00FFFF', '#00BFFF', '#0000FF', '#8A2BE2', '#FF00FF',
    '#FF1493', '#FF69B4', '#8B008B', '#4B0082', '#9370DB',
    '#1E90FF', '#32CD32', '#DAA520', '#FF6347', '#20B2AA'
  ];
  
  // Use provided color or random color
  const bgColor = color || memeColors[Math.floor(Math.random() * memeColors.length)];
  
  // Get first letter of symbol for the icon
  const letter = symbol.charAt(0);
  
  // Simple SVG with the first letter of the symbol
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="50" r="50" fill="${bgColor}" />
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${letter}</text>
    </svg>
  `;
  
  // Convert to data URL
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Create a game asset with the specified pattern
function createGameAsset(pattern, name = '', symbol = '', description = '', volatility = 1.0, basePrice = null, totalSupply = null, color = null) {
  // Use provided values or generate random ones for meme coins
  const assetName = name || generateRandomMemeName();
  const assetSymbol = symbol || generateRandomMemeSymbol(assetName);
  const assetDescription = description || `${assetName} - a volatile crypto token with great potential for trading`;
  const assetBasePrice = basePrice || (0.001 + Math.random() * 0.999); // Default $0.001-$1.00 for meme coins
  const assetTotalSupply = totalSupply || (1000000 + Math.random() * 999000000); // 1M-1B supply for meme coins
  
  // Generate chart data
  const chartData = generateChartByPattern(pattern, 120, volatility, assetBasePrice, assetTotalSupply);
  
  // Determine strategy based on last data point vs. first
  const isUptrendStrategy = 
    chartData[chartData.length - 1].price > chartData[0].price;
  
  const finalData = chartData[chartData.length - 1];
  const finalMarketCap = finalData.marketCap;
  
  return {
    id: `game-${assetSymbol.toLowerCase()}-${Date.now()}`,
    name: assetName,
    symbol: assetSymbol,
    description: assetDescription,
    chartData,
    currentPrice: finalData.price,
    currentMarketCap: finalMarketCap,
    totalSupply: assetTotalSupply,
    displayPrice: shouldDisplayPrice(finalMarketCap),
    iconUrl: generateTokenIcon(assetSymbol, color),
    strategy: isUptrendStrategy ? 
      ChartStrategy.UPTREND_WITH_DUMPS : 
      ChartStrategy.DOWNTREND_WITH_PUMPS
  };
}

// Generate conference-specific game assets (5 known + 5 meme coins)
function generateConferenceGameAssets() {
  const assets = [];
  
  // Add the 5 well-known crypto assets with varied patterns
  const patterns = Object.values(ChartPattern);
  
  KNOWN_ASSETS.forEach((knownAsset, index) => {
    // Use different patterns for each known asset
    const pattern = patterns[index % patterns.length];
    
    assets.push(createGameAsset(
      pattern,
      knownAsset.name,
      knownAsset.symbol,
      knownAsset.description,
      knownAsset.volatility,
      knownAsset.basePrice,
      knownAsset.totalSupply,
      knownAsset.color
    ));
  });
  
  // Add 5 volatile meme coins
  for (let i = 0; i < 5; i++) {
    // Use remaining patterns or cycle through again
    const pattern = patterns[(KNOWN_ASSETS.length + i) % patterns.length];
    
    // Higher volatility for meme coins
    const volatility = 1.5 + Math.random() * 1.0; // 1.5x-2.5x volatility
    
    assets.push(createGameAsset(pattern, '', '', '', volatility));
  }
  
  return assets;
}

// Where to save the generated data
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'game-data');

// Ensure the directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate the conference assets
console.log('Generating 10 conference game assets (5 known + 5 meme coins)...');
const conferenceAssets = generateConferenceGameAssets();

// Save conference assets
const conferenceAssetsPath = path.join(OUTPUT_DIR, 'conference-assets.json');
fs.writeFileSync(conferenceAssetsPath, JSON.stringify(conferenceAssets, null, 2));
console.log(`Saved conference assets to ${conferenceAssetsPath}`);

// Also save each asset individually for potential selective loading
conferenceAssets.forEach((asset, index) => {
  const assetPath = path.join(OUTPUT_DIR, `conference-asset-${index + 1}.json`);
  fs.writeFileSync(assetPath, JSON.stringify(asset, null, 2));
  console.log(`Saved asset ${index + 1}: ${asset.name} (${asset.symbol})`);
});

console.log('Conference game data generation complete!');
console.log('\nGenerated assets:');
conferenceAssets.forEach((asset, index) => {
  const marketCapFormatted = asset.currentMarketCap > 1000000000 ? 
    `$${(asset.currentMarketCap / 1000000000).toFixed(1)}B` :
    asset.currentMarketCap > 1000000 ? 
    `$${(asset.currentMarketCap / 1000000).toFixed(1)}M` :
    `$${(asset.currentMarketCap / 1000).toFixed(1)}K`;
  
  console.log(`${index + 1}. ${asset.name} (${asset.symbol}) - ${marketCapFormatted}`);
}); 