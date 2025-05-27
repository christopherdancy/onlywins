// Chart data structure
export interface ChartPoint {
  timestamp: number;
  marketCap: number;
  price?: number; // Optional price field for assets that track both
}

// For backward compatibility
export type ChartData = ChartPoint;

// Chart strategy types for different chart behaviors
export enum ChartStrategy {
  UPTREND_WITH_DUMPS = 'uptrend_with_dumps',
  DOWNTREND_WITH_PUMPS = 'downtrend_with_pumps'
}

// Asset structure
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  description: string;
  chartData: ChartPoint[];
  currentMarketCap: number;
  currentPrice?: number; // Current price per token
  totalSupply?: number; // Total token supply
  displayPrice?: boolean; // Whether to display price (true) or market cap (false)
  iconUrl: string; // SVG icon for the asset
  strategy: ChartStrategy; // Strategy to determine chart behavior
}

// Direction of card swipe
export interface SwipeDirection {
  isRight: boolean;
  isLeft?: boolean;
  isUp?: boolean;
  isDown?: boolean;
}

// Active trade information
export interface ActiveTrade {
  assetId: string;
  entryPrices: number[]; // Array of entry prices for averaging
  totalInvestment: number; // Amount invested (increases with double-downs)
  entryTime: number; // When the trade was entered
  expiryTime: number; // When the trade will automatically exit
} 