// Chart data structure
export interface ChartPoint {
  timestamp: number;
  marketCap: number;
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