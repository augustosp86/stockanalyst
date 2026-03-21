// Strategy: Yahoo Finance /v8/finance/chart with modules param
// This endpoint returns fundamentals embedded in the chart response

const YH = 'https://query1.finance.yahoo.com'
const YH2 = 'https://query2.finance.yahoo.com'

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function yf(path: string, host = YH) {
  const res = await fetch(`${host}${path}`, {
    headers: H,
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`YF ${res.status}`)
  return res.json()
}

// Fetch full chart data with all available modules
async function fetchAll(ticker: string) {
  const enc = encodeURIComponent(ticker)
  // Use interval=1d with a long range to get more metadata
  const data = await yf(
    `/v8/finance/chart/${enc}?interval=1d&range=1y&includePrePost=false` +
    `&events=div%2Csplit%2Cearn` +
    `&modules=summaryDetail%2CassetProfile%2CfinancialData%2CdefaultKeyStatistics%2CcalendarEvents%2CincomeStatementHistory%2CcashflowStatementHistory%2CbalanceSheetHistory`
  )
  return data?.chart?.result?.[0] ?? null
}

export async function getQuote(ticker: string) {
  try {
    const chart = await fetchAll(ticker)
    if (!chart?.meta?.regularMarketPrice) return null
    const m = chart.meta
    const prev = m.previousClose ?? m.chartPreviousClose ?? m.regularMarketPrice
    const sd = chart.summaryDetail ?? {}
    const ks = chart.defaultKeyStatistics ?? {}
    return {
      symbol: ticker,
      price: m.regularMarketPrice,
      previousClose: prev,
      open: m.regularMarketOpen ?? m.regularMarketPrice,
      dayHigh: m.regularMarketDayHigh ?? m.regularMarketPrice,
      dayLow: m.regularMarketDayLow ?? m.regularMarketPrice,
      volume: m.regularMarketVolume ?? 0,
      avgVolume: m.averageDailyVolume10Day ?? 0,
      marketCap: m.marketCap ?? sd.marketCap?.raw ?? 0,
      change: m.regularMarketPrice - prev,
      changesPercentage: ((m.regularMarketPrice - prev) / prev) * 100,
      yearHigh: m.fiftyTwoWeekHigh ?? sd.fiftyTwoWeekHigh?.raw ?? 0,
      yearLow: m.fiftyTwoWeekLow ?? sd.fiftyTwoWeekLow?.raw ?? 0,
      pe: m.trailingPE ?? sd.trailingPE?.raw ?? null,
      eps: ks.trailingEps?.raw ?? null,
      beta: sd.beta?.raw ?? null,
      currency: m.currency ?? 'USD',
      exchangeName: m.exchangeName ?? '',
    }
  } catch { return null }
}

export async function getProfile(ticker: string) {
  try {
    const chart = await fetchAll(ticker)
    if (!chart) return null
    const m = chart.meta
    const a = chart.assetProfile ?? {}
    const sd = chart.summaryDetail ?? {}
    const ks = chart.defaultKeyStatistics ?? {}
    return {
      symbol: ticker,
      companyName: m.longName ?? m.shortName ?? ticker,
      sector: a.sector ?? '',
      industry: a.industry ?? '',
      country: a.country ?? '',
      ceo: a.companyOfficers?.[0]?.name ?? '',
      fullTimeEmployees: a.fullTimeEmployees ?? 0,
      website: a.website ?? '',
      description: a.longBusinessSummary ?? '',
      image: '',
      ipoDate: '',
      exchange: m.exchangeName ?? '',
      currency: m.currency ?? 'USD',
      marketCap: m.marketCap ?? sd.marketCap?.raw ?? 0,
      pe: m.trailingPE ?? sd.trailingPE?.raw ?? null,
      eps: ks.trailingEps?.raw ?? null,
      beta: sd.beta?.raw ?? null,
      yearHigh: m.fiftyTwoWeekHigh ?? sd.fiftyTwoWeekHigh?.raw ?? 0,
      yearLow: m.fiftyTwoWeekLow ?? sd.fiftyTwoWeekLow?.raw ?? 0,
      dividendYield: sd.dividendYield?.raw ?? 0,
    }
  } catch { return null }
}

export async function getRatios(ticker: string) {
  try {
    const chart = await fetchAll(ticker)
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
    const chart = await fetchAll(ticker)
    const stmts = chart?.incomeStatementHistory?.incomeStatementHistory ?? []
    return stmts.slice(0, 5).map((s: any) => ({
      date: s.endDate?.fmt ?? '',
      revenue: s.totalRevenue?.raw ?? 0,
      grossProfit: s.grossProfit?.raw ?? 0,
      operatingIncome: s.operatingIncome?.raw ?? 0,
      netIncome: s.netIncome?.raw ?? 0,
      eps: s.dilutedEPS?.raw ?? 0,
      ebitda: s.ebitda?.raw ?? 0,
    }))
  } catch { return [] }
}

export async function getNews(ticker: string) {
  try {
    const data = await yf(
      `/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=15&quotesCount=0`,
      YH2
    )
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
    const data = await yf(
      `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
      YH2
    )
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
    { ticker: '%5EGSPC', display: '^GSPC', name: 'S&P 500' },
    { ticker: '%5EIXIC', display: '^IXIC', name: 'NASDAQ' },
    { ticker: '%5EDJI',  display: '^DJI',  name: 'Dow Jones' },
    { ticker: '%5ERUT',  display: '^RUT',  name: 'Russell 2000' },
  ]
  const results = await Promise.allSettled(indices.map(async ({ ticker, display, name }) => {
    try {
      const data = await yf(`/v8/finance/chart/${ticker}?interval=1d&range=1d`)
      const m = data?.chart?.result?.[0]?.meta
      if (!m?.regularMarketPrice) return null
      const prev = m.previousClose ?? m.chartPreviousClose ?? m.regularMarketPrice
      return {
        symbol: display, name,
        price: m.regularMarketPrice,
        changesPercentage: ((m.regularMarketPrice - prev) / prev) * 100,
        change: m.regularMarketPrice - prev,
      }
    } catch { return null }
  }))
  return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
}

export async function getGainersLosers() {
  const STOCKS = ['NVDA','AAPL','MSFT','AMZN','META','GOOGL','TSLA','AMD','NFLX','JPM','V','COST','AVGO','LLY','UNH','ORCL','CRM','ADBE','INTC','BA']
  try {
    const results = await Promise.allSettled(STOCKS.map(async (sym) => {
      const data = await yf(`/v8/finance/chart/${sym}?interval=1d&range=1d`)
      const m = data?.chart?.result?.[0]?.meta
      if (!m?.regularMarketPrice) return null
      const prev = m.previousClose ?? m.chartPreviousClose ?? m.regularMarketPrice
      const pct = ((m.regularMarketPrice - prev) / prev) * 100
      return {
        symbol: sym, ticker: sym,
        name: m.longName ?? m.shortName ?? sym,
        companyName: m.longName ?? m.shortName ?? sym,
        price: m.regularMarketPrice,
        changesPercentage: pct,
      }
    }))
    const valid = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean) as any[]
    const sorted = [...valid].sort((a, b) => b.changesPercentage - a.changesPercentage)
    return {
      gainers: sorted.filter(s => s.changesPercentage > 0).slice(0, 6),
      losers: [...sorted].reverse().filter(s => s.changesPercentage < 0).slice(0, 6),
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
      const m = data?.chart?.result?.[0]?.meta
      if (!m?.regularMarketPrice) return { sector, changesPercentage: '0' }
      const prev = m.previousClose ?? m.chartPreviousClose ?? m.regularMarketPrice
      return { sector, changesPercentage: (((m.regularMarketPrice - prev) / prev) * 100).toFixed(2) }
    } catch { return { sector, changesPercentage: '0' } }
  }))
  return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
}
