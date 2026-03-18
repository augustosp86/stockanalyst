// Yahoo Finance via RapidAPI proxy — completely free tier available
// Uses yahoo-finance2 compatible endpoints that work from Vercel

const YH = 'https://query1.finance.yahoo.com'
const YH2 = 'https://query2.finance.yahoo.com'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://finance.yahoo.com',
  'Origin': 'https://finance.yahoo.com',
}

async function yf(path: string, host = YH) {
  const res = await fetch(`${host}${path}`, {
    headers: HEADERS,
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`YF ${res.status}`)
  return res.json()
}

async function quoteSummary(ticker: string, modules: string) {
  try {
    // Try v11 first, fall back to v10
    try {
      const data = await yf(`/v11/finance/quoteSummary/${ticker}?modules=${modules}&corsDomain=finance.yahoo.com&crumb=`)
      if (data?.quoteSummary?.result?.[0]) return data.quoteSummary.result[0]
    } catch {}
    const data = await yf(`/v10/finance/quoteSummary/${ticker}?modules=${modules}`)
    return data?.quoteSummary?.result?.[0] ?? null
  } catch { return null }
}

export async function getQuote(ticker: string) {
  try {
    const data = await yf(`/v8/finance/chart/${ticker}?interval=1d&range=1d&includePrePost=false`)
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
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
      yearHigh: meta.fiftyTwoWeekHigh ?? 0,
      yearLow: meta.fiftyTwoWeekLow ?? 0,
      pe: meta.trailingPE ?? null,
      eps: null,
      beta: null,
      currency: meta.currency ?? 'USD',
      exchangeName: meta.exchangeName ?? '',
    }
  } catch { return null }
}

export async function getProfile(ticker: string) {
  try {
    const result = await quoteSummary(ticker, 'assetProfile%2Cprice%2CsummaryDetail%2CdefaultKeyStatistics')
    if (!result) return null
    const asset = result.assetProfile ?? {}
    const price = result.price ?? {}
    const summary = result.summaryDetail ?? {}
    const ks = result.defaultKeyStatistics ?? {}
    return {
      symbol: ticker,
      companyName: price.longName ?? price.shortName ?? ticker,
      sector: asset.sector ?? '',
      industry: asset.industry ?? '',
      country: asset.country ?? '',
      ceo: asset.companyOfficers?.[0]?.name ?? '',
      fullTimeEmployees: asset.fullTimeEmployees ?? 0,
      website: asset.website ?? '',
      description: asset.longBusinessSummary ?? '',
      image: '',
      ipoDate: '',
      exchange: price.exchangeName ?? '',
      currency: price.currency ?? 'USD',
      marketCap: price.marketCap?.raw ?? 0,
      pe: summary.trailingPE?.raw ?? null,
      eps: ks.trailingEps?.raw ?? null,
      beta: summary.beta?.raw ?? null,
      yearHigh: summary.fiftyTwoWeekHigh?.raw ?? 0,
      yearLow: summary.fiftyTwoWeekLow?.raw ?? 0,
      dividendYield: summary.dividendYield?.raw ?? 0,
    }
  } catch { return null }
}

export async function getRatios(ticker: string) {
  try {
    const result = await quoteSummary(ticker, 'financialData%2CdefaultKeyStatistics%2CsummaryDetail')
    if (!result) return null
    const fd = result.financialData ?? {}
    const ks = result.defaultKeyStatistics ?? {}
    const sd = result.summaryDetail ?? {}
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
    const result = await quoteSummary(ticker, 'incomeStatementHistory')
    const stmts = result?.incomeStatementHistory?.incomeStatementHistory ?? []
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
    const data = await yf(`/v1/finance/search?q=${ticker}&newsCount=15&quotesCount=0`, YH2)
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

export async function getAnalystRatings(ticker: string) {
  try {
    const result = await quoteSummary(ticker, 'recommendationTrend')
    const trend = result?.recommendationTrend?.trend?.[0]
    if (!trend) return null
    return {
      analystRatingsbuy: trend.buy ?? 0,
      analystRatingsHold: trend.hold ?? 0,
      analystRatingsSell: trend.sell ?? 0,
      analystRatingsStrongBuy: trend.strongBuy ?? 0,
      analystRatingsStrongSell: trend.strongSell ?? 0,
    }
  } catch { return null }
}

export async function getPriceTarget(ticker: string) {
  try {
    const result = await quoteSummary(ticker, 'financialData')
    const fd = result?.financialData
    if (!fd?.targetMeanPrice) return null
    return {
      priceTarget: fd.targetMeanPrice?.raw ?? null,
      priceTargetHigh: fd.targetHighPrice?.raw ?? null,
      priceTargetLow: fd.targetLowPrice?.raw ?? null,
      numberOfAnalysts: fd.numberOfAnalystOpinions?.raw ?? 0,
    }
  } catch { return null }
}

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
  const symbols = [
    { symbol: '%5EGSPC', name: 'S&P 500' },
    { symbol: '%5EIXIC', name: 'NASDAQ' },
    { symbol: '%5EDJI', name: 'Dow Jones' },
    { symbol: '%5ERUT', name: 'Russell 2000' },
  ]
  const results = await Promise.allSettled(symbols.map(async ({ symbol, name }) => {
    const data = await yf(`/v8/finance/chart/${symbol}?interval=1d&range=1d`)
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
    return {
      symbol: symbol.replace('%5E', '^'),
      name,
      price: meta.regularMarketPrice,
      changesPercentage: ((meta.regularMarketPrice - prev) / prev) * 100,
      change: meta.regularMarketPrice - prev,
    }
  }))
  return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
}

export async function getGainersLosers() {
  try {
    const [g, l] = await Promise.allSettled([
      yf(`/v1/finance/screener?scrIds=day_gainers&count=6&region=US`, YH2),
      yf(`/v1/finance/screener?scrIds=day_losers&count=6&region=US`, YH2),
    ])
    const map = (item: any) => ({
      symbol: item.symbol,
      ticker: item.symbol,
      name: item.shortName ?? item.symbol,
      companyName: item.shortName ?? item.symbol,
      price: item.regularMarketPrice ?? 0,
      changesPercentage: item.regularMarketChangePercent ?? 0,
    })
    const gainers = g.status === 'fulfilled' ? (g.value?.finance?.result?.[0]?.quotes ?? []).map(map) : []
    const losers = l.status === 'fulfilled' ? (l.value?.finance?.result?.[0]?.quotes ?? []).map(map) : []
    return { gainers, losers, active: [] }
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
      const pct = ((meta.regularMarketPrice - prev) / prev) * 100
      return { sector, changesPercentage: pct.toFixed(2) }
    } catch { return { sector, changesPercentage: '0' } }
  }))
  return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
}
