export interface ChartData {
  timestamp: number;
  marketCap: number;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  currentMarketCap: number;
  chartData: ChartData[];
}

export interface SwipeDirection {
  isRight: boolean;
} 