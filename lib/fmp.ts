const YH = 'https://query1.finance.yahoo.com'
const YH2 = 'https://query2.finance.yahoo.com'

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com',
  'Origin': 'https://finance.yahoo.com',
}

async function yf(path: string, host = YH) {
  const res = await fetch(`${host}${path}`, { headers: H, next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`YF ${res.status}: ${path}`)
  return res.json()
}

// Main data source — chart API, works reliably from Vercel
async function getChart(ticker: string) {
  const data = await yf(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d&includePrePost=false&modules=summaryDetail%2CdefaultKeyStatistics%2CfinancialData%2CassetProfile`)
  return data?.chart?.result?.[0] ?? null
}

export async function getQuote(ticker: string) {
  try {
    const chart = await getChart(ticker)
    if (!chart?.meta?.regularMarketPrice) return null
    const meta = chart.meta
    const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
    const fd = chart.financialData ?? {}
    const ks = chart.defaultKeyStatistics ?? {}
    const sd = chart.summaryDetail ?? {}
    return {
      symbol: ticker,
      price: meta.regularMarketPrice,
      previousClose: prev,
      open: meta.regularMarketOpen ?? meta.regularMarketPrice,
      dayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      dayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      avgVolume: meta.averageDailyVolume10Day ?? 0,
      marketCap: meta.marketCap ?? 0,
      change: meta.regularMarketPrice - prev,
      changesPercentage: ((meta.regularMarketPrice - prev) / prev) * 100,
      yearHigh: meta.fiftyTwoWeekHigh ?? sd.fiftyTwoWeekHigh?.raw ?? 0,
      yearLow: meta.fiftyTwoWeekLow ?? sd.fiftyTwoWeekLow?.raw ?? 0,
      pe: meta.trailingPE ?? sd.trailingPE?.raw ?? null,
      eps: ks.trailingEps?.raw ?? null,
      beta: sd.beta?.raw ?? null,
      currency: meta.currency ?? 'USD',
      exchangeName: meta.exchangeName ?? '',
    }
  } catch { return null }
}

export async function getProfile(ticker: string) {
  try {
    const chart = await getChart(ticker)
    if (!chart) return null
    const meta = chart.meta
    const asset = chart.assetProfile ?? {}
    const price = chart.price ?? {}
    return {
      symbol: ticker,
      companyName: meta.longName ?? meta.shortName ?? ticker,
      sector: asset.sector ?? '',
      industry: asset.industry ?? '',
      country: asset.country ?? '',
      ceo: asset.companyOfficers?.[0]?.name ?? '',
      fullTimeEmployees: asset.fullTimeEmployees ?? 0,
      website: asset.website ?? '',
      description: asset.longBusinessSummary ?? '',
      image: '',
      ipoDate: '',
      exchange: meta.exchangeName ?? '',
      currency: meta.currency ?? 'USD',
      marketCap: meta.marketCap ?? 0,
      pe: meta.trailingPE ?? null,
      eps: chart.defaultKeyStatistics?.trailingEps?.raw ?? null,
      beta: chart.summaryDetail?.beta?.raw ?? null,
      yearHigh: meta.fiftyTwoWeekHigh ?? 0,
      yearLow: meta.fiftyTwoWeekLow ?? 0,
      dividendYield: chart.summaryDetail?.dividendYield?.raw ?? 0,
    }
  } catch { return null }
}

export async function getRatios(ticker: string) {
  try {
    const chart = await getChart(ticker)
    if (!chart) return null
    const fd = chart.financialData ?? {}
    const ks = chart.defaultKeyStatistics ?? {}
    const sd = chart.summaryDetail ?? {}
    return {
      returnOnEquityTTM: fd.returnOnEquity?.raw ?? null,
      returnOnAssetsTTM: fd.returnOnAssets?.raw ?? null,
      grossProfitMarginTTM: fd.grossMargins?.raw ?? null,
      operatingProfitMarginTTM: fd.operatingMargins?.raw ?? null,
      netProfitMarginTTM: fd.profitMargins?.raw ?? null,
      debtEquityRatioTTM: fd.debtToEquity?.raw ? fd.debtToEquity.raw / 100 : null,
      currentRatioTTM: fd.currentRatio?.raw ?? null,
      quickRatioTTM: fd.quickRatio?.raw ?? null,
      freeCashFlowPerShareTTM: ks.freeCashflow?.raw && ks.sharesOutstanding?.raw
        ? ks.freeCashflow.raw / ks.sharesOutstanding.raw : null,
      priceEarningsRatioTTM: sd.forwardPE?.raw ?? null,
      pegRatioTTM: ks.pegRatio?.raw ?? null,
      pbRatioTTM: ks.priceToBook?.raw ?? null,
      priceToSalesRatioTTM: ks.priceToSalesTrailing12Months?.raw ?? null,
      enterpriseValueMultipleTTM: ks.enterpriseToEbitda?.raw ?? null,
      dividendYieldTTM: sd.dividendYield?.raw ?? null,
    }
  } catch { return null }
}

export async function getIncomeStatements(ticker: string) {
  try {
    const data = await yf(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=3mo&range=4y`)
    const chart = data?.chart?.result?.[0]
    if (!chart) return []
    // Build synthetic income data from available meta
    const meta = chart.meta
    return [{
      date: new Date().getFullYear().toString(),
      revenue: 0,
      grossProfit: 0,
      operatingIncome: 0,
      netIncome: 0,
      eps: meta.trailingEps ?? 0,
      ebitda: 0,
    }]
  } catch { return [] }
}

export async function getNews(ticker: string) {
  try {
    const data = await yf(`/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=15&quotesCount=0`, YH2)
    return (data?.news ?? []).slice(0, 15).map((n: any) => ({
      title: n.title,
      url: n.link,
      site: n.publisher,
      publishedDate: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      text: '',
    }))
  } catch { return [] }
}

export async function getAnalystRatings(_ticker: string) { return null }
export async function getPriceTarget(_ticker: string) { return null }
export async function getDCF(_ticker: string) { return null }

export async function searchStocks(query: string) {
  try {
    const data = await yf(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`, YH2)
    return (data?.quotes ?? [])
      .filter((q: any) => q.quoteType === 'EQUITY')
      .slice(0, 8)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        exchangeShortName: q.exchange ?? '',
        stockExchange: q.exchDisp ?? '',
      }))
  } catch { return [] }
}

export async function getIndices() {
  const indices = [
    { symbol: '%5EGSPC', display: '^GSPC', name: 'S&P 500' },
    { symbol: '%5EIXIC', display: '^IXIC', name: 'NASDAQ' },
    { symbol: '%5EDJI',  display: '^DJI',  name: 'Dow Jones' },
    { symbol: '%5ERUT',  display: '^RUT',  name: 'Russell 2000' },
  ]
  const results = await Promise.allSettled(indices.map(async ({ symbol, display, name }) => {
    try {
      const data = await yf(`/v8/finance/chart/${symbol}?interval=1d&range=1d`)
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta?.regularMarketPrice) return null
      const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
      return {
        symbol: display, name,
        price: meta.regularMarketPrice,
        changesPercentage: ((meta.regularMarketPrice - prev) / prev) * 100,
        change: meta.regularMarketPrice - prev,
      }
    } catch { return null }
  }))
  return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
}

// Gainers/losers: use fixed popular stocks and get live prices
export async function getGainersLosers() {
  const POPULAR = ['NVDA','AAPL','MSFT','AMZN','META','GOOGL','TSLA','AMD','NFLX','JPM','V','COST','AVGO','LLY','UNH']
  try {
    const quotes = await Promise.allSettled(POPULAR.map(async (sym) => {
      try {
        const data = await yf(`/v8/finance/chart/${sym}?interval=1d&range=1d`)
        const meta = data?.chart?.result?.[0]?.meta
        if (!meta?.regularMarketPrice) return null
        const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
        const pct = ((meta.regularMarketPrice - prev) / prev) * 100
        return {
          symbol: sym, ticker: sym,
          name: meta.longName ?? meta.shortName ?? sym,
          companyName: meta.longName ?? meta.shortName ?? sym,
          price: meta.regularMarketPrice,
          changesPercentage: pct,
        }
      } catch { return null }
    }))
    const valid = quotes
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter(Boolean) as any[]
    const sorted = [...valid].sort((a, b) => b.changesPercentage - a.changesPercentage)
    return {
      gainers: sorted.filter(s => s.changesPercentage > 0).slice(0, 6),
      losers: sorted.filter(s => s.changesPercentage < 0).reverse().slice(0, 6),
      active: [],
    }
  } catch { return { gainers: [], losers: [], active: [] } }
}

export async function getSectorPerformance() {
  const etfs = [
    { symbol: 'XLK', sector: 'Technology' },
    { symbol: 'XLV', sector: 'Healthcare' },
    { symbol: 'XLF', sector: 'Financial Services' },
    { symbol: 'XLY', sector: 'Consumer Cyclical' },
    { symbol: 'XLC', sector: 'Communication Services' },
    { symbol: 'XLI', sector: 'Industrials' },
    { symbol: 'XLP', sector: 'Consumer Defensive' },
    { symbol: 'XLE', sector: 'Energy' },
  ]
  const results = await Promise.allSettled(etfs.map(async ({ symbol, sector }) => {
    try {
      const data = await yf(`/v8/finance/chart/${symbol}?interval=1d&range=1d`)
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta?.regularMarketPrice) return { sector, changesPercentage: '0' }
      const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
      return { sector, changesPercentage: (((meta.regularMarketPrice - prev) / prev) * 100).toFixed(2) }
    } catch { return { sector, changesPercentage: '0' } }
  }))
  return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
}
