const BASE = 'https://financialmodelingprep.com/api/v3'
const KEY = process.env.FMP_API_KEY

async function fmp(endpoint: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ ...params, apikey: KEY! }).toString()
  const url = `${BASE}${endpoint}?${qs}`
  const res = await fetch(url, { next: { revalidate: 300 } }) // cache 5 min
  if (!res.ok) throw new Error(`FMP error: ${res.status}`)
  return res.json()
}

export async function getQuote(ticker: string) {
  const data = await fmp(`/quote/${ticker}`)
  return data?.[0] ?? null
}

export async function getProfile(ticker: string) {
  const data = await fmp(`/profile/${ticker}`)
  return data?.[0] ?? null
}

export async function getIncomeStatements(ticker: string) {
  return fmp(`/income-statement/${ticker}`, { limit: '5' })
}

export async function getRatios(ticker: string) {
  const data = await fmp(`/ratios-ttm/${ticker}`)
  return data?.[0] ?? null
}

export async function getNews(ticker: string) {
  return fmp(`/stock_news`, { tickers: ticker, limit: '15' })
}

export async function getAnalystRatings(ticker: string) {
  const data = await fmp(`/analyst-stock-recommendations/${ticker}`, { limit: '1' })
  return data?.[0] ?? null
}

export async function getPriceTarget(ticker: string) {
  const data = await fmp(`/price-target`, { symbol: ticker })
  return data?.[0] ?? null
}

export async function searchStocks(query: string) {
  return fmp(`/search`, { query, limit: '8', exchange: 'NASDAQ,NYSE' })
}

export async function getIndices() {
  return fmp(`/quotes/index`)
}

export async function getGainersLosers() {
  const [gainers, losers, active] = await Promise.all([
    fmp(`/gainers`),
    fmp(`/losers`),
    fmp(`/actives`),
  ])
  return { gainers: gainers?.slice(0, 6), losers: losers?.slice(0, 6), active: active?.slice(0, 6) }
}

export async function getDCF(ticker: string) {
  const data = await fmp(`/discounted-cash-flow/${ticker}`)
  return data?.[0] ?? null
}

export async function getSectorPerformance() {
  return fmp(`/sector-performance`)
}
