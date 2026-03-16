export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changesPercentage: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: number
  avgVolume: number
  marketCap: number
  pe: number
  eps: number
  yearHigh: number
  yearLow: number
}

export interface StockProfile {
  symbol: string
  companyName: string
  sector: string
  industry: string
  country: string
  ceo: string
  employees: number
  website: string
  description: string
  image: string
  ipoDate: string
  exchange: string
  currency: string
}

export interface IncomeStatement {
  date: string
  revenue: number
  grossProfit: number
  operatingIncome: number
  netIncome: number
  eps: number
  ebitda: number
}

export interface Ratios {
  peRatio: number
  pbRatio: number
  psRatio: number
  pegRatio: number
  debtEquityRatio: number
  currentRatio: number
  quickRatio: number
  returnOnEquity: number
  returnOnAssets: number
  grossProfitMargin: number
  operatingProfitMargin: number
  netProfitMargin: number
  freeCashFlowPerShare: number
}

export interface StockAnalysis {
  quote: StockQuote
  profile: StockProfile
  income: IncomeStatement[]
  ratios: Ratios
  scores: {
    fundamentals: number
    growth: number
    profitability: number
    financial_health: number
    overall: number
  }
  verdict: 'buy' | 'hold' | 'watch' | 'avoid'
  highlights: { type: 'positive' | 'negative' | 'neutral'; text: string }[]
}

export interface NewsItem {
  title: string
  url: string
  site: string
  publishedDate: string
  sentiment: number
}

export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changesPercentage: number
}
