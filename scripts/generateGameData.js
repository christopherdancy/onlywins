// Script to generate predefined chart data for the game
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

// Helper to add noise to market cap values
function addNoise(value, noiseLevel) {
  const noise = (Math.random() * 2 - 1) * (value * noiseLevel);
  return Math.max(1000, value + noise); // Ensure minimum value
}

// Generate chart data for a pump and dump pattern
function generatePumpAndDump(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $5k-25k)
  const baseMarketCap = 5000 + Math.random() * 20000;
  
  // Define the pattern phases
  const pumpStart = Math.floor(duration * 0.1);
  const pumpPeak = Math.floor(duration * 0.4);
  const dumpEnd = Math.floor(duration * 0.8);
  
  // Maximum pump height (3x-10x initial based on volatility)
  const pumpMultiplier = 3 + volatility * 7;
  
  for (let i = 0; i < duration; i++) {
    let marketCap;
    const timestamp = now - (duration - i) * 1000; // 1 second intervals
    
    if (i < pumpStart) {
      // Initial sideways with slight uptrend
      const progress = i / pumpStart;
      marketCap = baseMarketCap * (1 + progress * 0.3 * volatility);
    } 
    else if (i < pumpPeak) {
      // Pump phase - accelerating growth
      const progress = (i - pumpStart) / (pumpPeak - pumpStart);
      // Use a power function for accelerating growth
      const growthFactor = Math.pow(progress, 1.8) * (pumpMultiplier - 1) + 1;
      marketCap = baseMarketCap * growthFactor;
    } 
    else if (i < dumpEnd) {
      // Dump phase - rapid decline
      const progress = (i - pumpPeak) / (dumpEnd - pumpPeak);
      const peakMarketCap = baseMarketCap * pumpMultiplier;
      // Faster initial drop, then slower
      const dumpFactor = 1 - Math.pow(progress, 0.6);
      const remainingValue = baseMarketCap + (peakMarketCap - baseMarketCap) * dumpFactor;
      marketCap = remainingValue;
    } 
    else {
      // Final phase - slight recovery or continued decline
      const progress = (i - dumpEnd) / (duration - dumpEnd);
      const endCap = baseMarketCap * (0.7 + Math.random() * 0.5); // End between 70-120% of start
      const dumpEndCap = data[dumpEnd - 1].marketCap;
      marketCap = dumpEndCap + (endCap - dumpEndCap) * progress;
    }
    
    // Add noise proportional to volatility (increased)
    marketCap = addNoise(marketCap, 0.04 * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a steady rise pattern
function generateSteadyRise(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $5k-25k)
  const baseMarketCap = 5000 + Math.random() * 20000;
  
  // Final multiplier (2x-5x initial based on volatility)
  const finalMultiplier = 2 + volatility * 3;
  
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    const progress = i / (duration - 1);
    
    // Use a slightly curved function for natural-looking growth
    const growthFactor = 1 + (Math.pow(progress, 1.2) * (finalMultiplier - 1));
    let marketCap = baseMarketCap * growthFactor;
    
    // Add noise proportional to volatility (increased)
    marketCap = addNoise(marketCap, 0.05 * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a downward trend pattern
function generateDownwardTrend(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $75k-150k for room to drop)
  const baseMarketCap = 75000 + Math.random() * 75000;
  
  // Final multiplier (0.2x-0.6x of initial based on volatility)
  const finalMultiplier = 0.6 - volatility * 0.4;
  
  for (let i = 0; i < duration; i++) {
    const timestamp = now - (duration - i) * 1000;
    const progress = i / (duration - 1);
    
    // Use a curve for natural-looking decline
    const declineFactor = 1 - (Math.pow(progress, 0.7) * (1 - finalMultiplier));
    let marketCap = baseMarketCap * declineFactor;
    
    // Add noise proportional to volatility (increased)
    marketCap = addNoise(marketCap, 0.05 * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a recovery pattern
function generateRecovery(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $25k-75k)
  const baseMarketCap = 25000 + Math.random() * 50000;
  
  // Define pattern phases
  const dipStart = Math.floor(duration * 0.1);
  const dipBottom = Math.floor(duration * 0.4);
  const recoveryEnd = Math.floor(duration * 0.9);
  
  // How low the dip goes (20%-60% of initial based on volatility)
  const dipPercentage = 0.6 - volatility * 0.4;
  
  // How high the recovery goes (1.5x-3x of initial based on volatility)
  const recoveryMultiplier = 1.5 + volatility * 1.5;
  
  for (let i = 0; i < duration; i++) {
    let marketCap;
    const timestamp = now - (duration - i) * 1000;
    
    if (i < dipStart) {
      // Initial sideways with slight downtrend
      const progress = i / dipStart;
      marketCap = baseMarketCap * (1 - progress * 0.15);
    } 
    else if (i < dipBottom) {
      // Dip phase
      const progress = (i - dipStart) / (dipBottom - dipStart);
      // Use a curve for natural-looking decline
      const dipFactor = 1 - (Math.pow(progress, 0.7) * (1 - dipPercentage));
      marketCap = baseMarketCap * dipFactor;
    } 
    else if (i < recoveryEnd) {
      // Recovery phase
      const progress = (i - dipBottom) / (recoveryEnd - dipBottom);
      const bottomCap = baseMarketCap * dipPercentage;
      const finalCap = baseMarketCap * recoveryMultiplier;
      // Accelerated recovery curve
      const recoveryFactor = Math.pow(progress, 1.1);
      marketCap = bottomCap + (finalCap - bottomCap) * recoveryFactor;
    } 
    else {
      // Final phase - slight continuation or stabilization
      const progress = (i - recoveryEnd) / (duration - recoveryEnd);
      const recoveryCap = data[recoveryEnd - 1].marketCap;
      const finalAdjustment = 1 + (progress * 0.15 * (Math.random() > 0.5 ? 1 : -1));
      marketCap = recoveryCap * finalAdjustment;
    }
    
    // Add noise proportional to volatility (increased)
    marketCap = addNoise(marketCap, 0.04 * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a V-shape pattern (sharp dip and recovery)
function generateVShape(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $30k-80k)
  const baseMarketCap = 30000 + Math.random() * 50000;
  
  // V shape pivot point (30%-70% of the way through)
  const pivotPoint = Math.floor(duration * (0.3 + Math.random() * 0.4));
  
  // How low the dip goes (15%-55% of initial based on volatility)
  const dipPercentage = 0.55 - volatility * 0.4;
  
  // How high the recovery goes (1.2x-3.5x of initial based on volatility)
  const recoveryMultiplier = 1.2 + volatility * 2.3;
  
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
    
    // Add noise proportional to volatility (increased)
    marketCap = addNoise(marketCap, 0.04 * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for a double peak pattern
function generateDoublePeak(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $10k-35k)
  const baseMarketCap = 10000 + Math.random() * 25000;
  
  // Define pattern phases
  const firstPeakTime = Math.floor(duration * 0.25);
  const valleyTime = Math.floor(duration * 0.5);
  const secondPeakTime = Math.floor(duration * 0.75);
  
  // Peak heights (2.5x-6x initial based on volatility)
  const firstPeakMultiplier = 2.5 + volatility * 3.5;
  // Second peak slightly higher or lower than first
  const secondPeakMultiplier = firstPeakMultiplier * (0.8 + Math.random() * 0.6);
  
  // Valley depth (35%-70% from peak based on volatility)
  const valleyPercentage = 0.7 - volatility * 0.35;
  
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
    
    // Add noise proportional to volatility (increased)
    marketCap = addNoise(marketCap, 0.05 * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate chart data for volatile sideways movement
function generateVolatileSideways(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $15k-40k)
  const baseMarketCap = 15000 + Math.random() * 25000;
  
  // Volatility range (how much it moves up and down)
  const volatilityRange = 0.3 + volatility * 0.5; // 30-80% swings
  
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
function generateExponentialPump(duration = 120, volatility = 1.0) {
  const data = [];
  const now = Date.now();
  
  // Starting market cap (around $5k-20k)
  const baseMarketCap = 5000 + Math.random() * 15000;
  
  // Final multiplier (8x-25x initial based on volatility)
  const finalMultiplier = 8 + volatility * 17;
  
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
    marketCap = addNoise(marketCap, noiseFactor * volatility);
    
    data.push({
      timestamp,
      marketCap
    });
  }
  
  return data;
}

// Generate a chart based on specified pattern
function generateChartByPattern(pattern, duration = 120, volatility = 1.0) {
  switch (pattern) {
    case ChartPattern.PUMP_AND_DUMP:
      return generatePumpAndDump(duration, volatility);
    case ChartPattern.STEADY_RISE:
      return generateSteadyRise(duration, volatility);
    case ChartPattern.DOWNWARD_TREND:
      return generateDownwardTrend(duration, volatility);
    case ChartPattern.RECOVERY:
      return generateRecovery(duration, volatility);
    case ChartPattern.V_SHAPE:
      return generateVShape(duration, volatility);
    case ChartPattern.DOUBLE_PEAK:
      return generateDoublePeak(duration, volatility);
    case ChartPattern.VOLATILE_SIDEWAYS:
      return generateVolatileSideways(duration, volatility);
    case ChartPattern.EXPONENTIAL_PUMP:
      return generateExponentialPump(duration, volatility);
    default:
      return generatePumpAndDump(duration, volatility);
  }
}

// Random name generation for assets
const adjectives = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 
  'Hyper', 'Ultra', 'Super', 'Mega', 'Quantum',
  'Cosmic', 'Stellar', 'Astro', 'Nebula', 'Galactic',
  'Cyber', 'Digital', 'Techno', 'Crypto', 'Nexus',
  'Elite', 'Prime', 'Max', 'Pro', 'Extreme',
  'Meta', 'Core', 'Fusion', 'Pulse', 'Vortex'
];

const nouns = [
  'Coin', 'Chain', 'Token', 'Cash', 'Protocol',
  'Network', 'Swap', 'Finance', 'Connect', 'Link',
  'Node', 'Block', 'Ledger', 'Hash', 'Crypto',
  'Money', 'Wallet', 'Asset', 'Yield', 'Stake',
  'Mining', 'Oracle', 'Tendies', 'Moon', 'Rocket',
  'Lambo', 'Gem', 'Diamond', 'Ape', 'Doge'
];

function generateRandomName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

function generateRandomSymbol(name) {
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
function generateTokenIcon(symbol) {
  // Define a set of vibrant colors for crypto tokens
  const bgColors = [
    '#FF4500', '#FF8C00', '#FFD700', '#7CFC00', '#00FA9A', 
    '#00FFFF', '#00BFFF', '#0000FF', '#8A2BE2', '#FF00FF',
    '#FF1493', '#FF69B4', '#8B008B', '#4B0082', '#9370DB',
    '#1E90FF', '#32CD32', '#DAA520', '#FF6347', '#20B2AA'
  ];
  
  // Random background color
  const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
  
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
function createGameAsset(pattern, name = '', symbol = '', volatility = 1.0) {
  // Use provided name or generate one
  const assetName = name || generateRandomName();
  const assetSymbol = symbol || generateRandomSymbol(assetName);
  
  // Generate chart data
  const chartData = generateChartByPattern(pattern, 120, volatility);
  
  // Determine strategy based on last data point vs. first
  const isUptrendStrategy = 
    chartData[chartData.length - 1].marketCap > chartData[0].marketCap;
  
  return {
    id: `game-${assetSymbol.toLowerCase()}-${Date.now()}`,
    name: assetName,
    symbol: assetSymbol,
    description: `${assetName} - a volatile crypto token with great potential for trading`,
    chartData,
    currentMarketCap: chartData[chartData.length - 1].marketCap,
    iconUrl: generateTokenIcon(assetSymbol),
    strategy: isUptrendStrategy ? 
      ChartStrategy.UPTREND_WITH_DUMPS : 
      ChartStrategy.DOWNTREND_WITH_PUMPS
  };
}

// Generate a complete set of game assets with diverse patterns
function generateGameAssets(count = 25) {
  const assets = [];
  
  // Use all patterns multiple times with varied parameters
  const patterns = Object.values(ChartPattern);
  let patternIndex = 0;
  
  for (let i = 0; i < count; i++) {
    // Cycle through patterns
    const pattern = patterns[patternIndex % patterns.length];
    patternIndex++;
    
    // Vary volatility between 1.0 and 2.0 (increased volatility for more dramatic charts)
    const volatility = 1.0 + Math.random() * 1.0;
    
    assets.push(createGameAsset(pattern, '', '', volatility));
  }
  
  return assets;
}

// Where to save the generated data
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'game-data');

// Ensure the directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Number of assets to generate
const ASSET_COUNT = 25;

// Generate the assets
console.log(`Generating ${ASSET_COUNT} game assets...`);
const gameAssets = generateGameAssets(ASSET_COUNT);

// Save all assets in a single file for convenience
const allAssetsPath = path.join(OUTPUT_DIR, 'all-assets.json');
fs.writeFileSync(allAssetsPath, JSON.stringify(gameAssets, null, 2));
console.log(`Saved all assets to ${allAssetsPath}`);

// Also save each asset individually for potential selective loading
gameAssets.forEach((asset, index) => {
  const assetPath = path.join(OUTPUT_DIR, `asset-${index + 1}.json`);
  fs.writeFileSync(assetPath, JSON.stringify(asset, null, 2));
  console.log(`Saved asset ${index + 1}: ${asset.name} (${asset.symbol})`);
});

console.log('Game data generation complete!'); 