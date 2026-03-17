const AV = 'https://www.alphavantage.co/query'
const KEY = process.env.ALPHA_VANTAGE_KEY

async function av(params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, apikey: KEY! }).toString()
  const res = await fetch(`${AV}?${qs}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`AV error: ${res.status}`)
  return res.json()
}

// Single call that returns everything — saves API quota
async function getOverview(ticker: string) {
  const data = await av({ function: 'OVERVIEW', symbol: ticker })
  if (!data?.Symbol || data?.Note || data?.Information) return null
  return data
}

export async function getQuote(ticker: string) {
  try {
    const data = await av({ function: 'GLOBAL_QUOTE', symbol: ticker })
    if (data?.Note || data?.Information) return null
    const q = data?.['Global Quote']
    if (!q || !q['05. price']) return null
    return {
      symbol: ticker,
      price: parseFloat(q['05. price']),
      previousClose: parseFloat(q['08. previous close']),
      open: parseFloat(q['02. open']),
      dayHigh: parseFloat(q['03. high']),
      dayLow: parseFloat(q['04. low']),
      volume: parseInt(q['06. volume']),
      avgVolume: 0,
      marketCap: 0,
      change: parseFloat(q['09. change']),
      changesPercentage: parseFloat(q['10. change percent']?.replace('%', '')),
      yearHigh: 0,
      yearLow: 0,
      pe: null,
      eps: null,
      beta: null,
      currency: 'USD',
      exchangeName: '',
    }
  } catch { return null }
}

export async function getProfile(ticker: string) {
  try {
    const data = await getOverview(ticker)
    if (!data) return null
    return {
      symbol: ticker,
      companyName: data.Name ?? ticker,
      sector: data.Sector ?? '',
      industry: data.Industry ?? '',
      country: data.Country ?? '',
      ceo: '',
      fullTimeEmployees: parseInt(data.FullTimeEmployees) || 0,
      website: '',
      description: data.Description ?? '',
      image: '',
      ipoDate: data.IPODate ?? '',
      exchange: data.Exchange ?? '',
      currency: data.Currency ?? 'USD',
      marketCap: parseInt(data.MarketCapitalization) || 0,
      pe: parseFloat(data.TrailingPE) || null,
      eps: parseFloat(data.EPS) || null,
      beta: parseFloat(data.Beta) || null,
      yearHigh: parseFloat(data['52WeekHigh']) || 0,
      yearLow: parseFloat(data['52WeekLow']) || 0,
      dividendYield: parseFloat(data.DividendYield) || 0,
    }
  } catch { return null }
}

export async function getRatios(ticker: string) {
  try {
    const data = await getOverview(ticker)
    if (!data) return null
    return {
      returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM) || null,
      returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM) || null,
      grossProfitMarginTTM: null,
      operatingProfitMarginTTM: parseFloat(data.OperatingMarginTTM) || null,
      netProfitMarginTTM: parseFloat(data.ProfitMargin) || null,
      debtEquityRatioTTM: null,
      currentRatioTTM: null,
      quickRatioTTM: null,
      freeCashFlowPerShareTTM: null,
      priceEarningsRatioTTM: parseFloat(data.ForwardPE) || null,
      pegRatioTTM: parseFloat(data.PEGRatio) || null,
      pbRatioTTM: parseFloat(data.PriceToBookRatio) || null,
      priceToSalesRatioTTM: parseFloat(data.PriceToSalesRatioTTM) || null,
      enterpriseValueMultipleTTM: parseFloat(data.EVToEBITDA) || null,
      dividendYieldTTM: parseFloat(data.DividendYield) || null,
    }
  } catch { return null }
}

export async function getIncomeStatements(ticker: string) {
  try {
    const data = await av({ function: 'INCOME_STATEMENT', symbol: ticker })
    if (data?.Note || data?.Information) return []
    return (data?.annualReports ?? []).slice(0, 5).map((r: any) => ({
      date: r.fiscalDateEnding ?? '',
      revenue: parseInt(r.totalRevenue) || 0,
      grossProfit: parseInt(r.grossProfit) || 0,
      operatingIncome: parseInt(r.operatingIncome) || 0,
      netIncome: parseInt(r.netIncome) || 0,
      eps: parseFloat(r.reportedEPS) || 0,
      ebitda: parseInt(r.ebitda) || 0,
    }))
  } catch { return [] }
}

export async function getNews(ticker: string) {
  try {
    const data = await av({ function: 'NEWS_SENTIMENT', tickers: ticker, limit: '10' })
    if (data?.Note || data?.Information) return []
    return (data?.feed ?? []).slice(0, 10).map((n: any) => ({
      title: n.title,
      url: n.url,
      site: n.source,
      publishedDate: n.time_published
        ? new Date(n.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toISOString()
        : new Date().toISOString(),
      text: n.summary ?? '',
    }))
  } catch { return [] }
}

export async function getAnalystRatings(_ticker: string) { return null }
export async function getPriceTarget(_ticker: string) { return null }
export async function getDCF(_ticker: string) { return null }

export async function searchStocks(query: string) {
  try {
    const data = await av({ function: 'SYMBOL_SEARCH', keywords: query })
    if (data?.Note || data?.Information) return []
    return (data?.bestMatches ?? []).slice(0, 8).map((r: any) => ({
      symbol: r['1. symbol'],
      name: r['2. name'],
      exchangeShortName: r['4. region'],
      stockExchange: r['3. type'],
    }))
  } catch { return [] }
}

export async function getIndices() {
  const symbols = [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'QQQ', name: 'NASDAQ 100' },
    { symbol: 'DIA', name: 'Dow Jones' },
    { symbol: 'IWM', name: 'Russell 2000' },
  ]
  const results = await Promise.all(symbols.map(async ({ symbol, name }) => {
    try {
      const data = await av({ function: 'GLOBAL_QUOTE', symbol })
      if (data?.Note || data?.Information) return null
      const q = data?.['Global Quote']
      if (!q?.['05. price']) return null
      return {
        symbol, name,
        price: parseFloat(q['05. price']),
        changesPercentage: parseFloat(q['10. change percent']?.replace('%', '') ?? '0'),
        change: parseFloat(q['09. change'] ?? '0'),
      }
    } catch { return null }
  }))
  return results.filter(Boolean)
}

export async function getGainersLosers() {
  try {
    const data = await av({ function: 'TOP_GAINERS_LOSERS' })
    if (data?.Note || data?.Information) return { gainers: [], losers: [], active: [] }
    const map = (item: any) => ({
      symbol: item.ticker, ticker: item.ticker,
      name: item.ticker, companyName: item.ticker,
      price: parseFloat(item.price) || 0,
      changesPercentage: parseFloat(item.change_percentage?.replace('%', '')) || 0,
    })
    return {
      gainers: (data?.top_gainers ?? []).slice(0, 6).map(map),
      losers: (data?.top_losers ?? []).slice(0, 6).map(map),
      active: [],
    }
  } catch { return { gainers: [], losers: [], active: [] } }
}

export async function getSectorPerformance() {
  try {
    const data = await av({ function: 'SECTOR' })
    if (data?.Note || data?.Information) return []
    const perf = data?.['Rank A: Real-Time Performance'] ?? {}
    return Object.entries(perf).map(([sector, change]) => ({
      sector,
      changesPercentage: String(change).replace('%', ''),
    }))
  } catch { return [] }
}
