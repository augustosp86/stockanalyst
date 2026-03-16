const YF_BASE = 'https://query1.finance.yahoo.com'
const YF_BASE2 = 'https://query2.finance.yahoo.com'

async function yf(path: string, base = YF_BASE) {
  const url = `${base}${path}`
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`YF error: ${res.status}`)
  return res.json()
}

export async function getQuote(ticker: string) {
  try {
    const data = await yf(`/v8/finance/chart/${ticker}?interval=1d&range=1d`)
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    return {
      symbol: ticker,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose ?? meta.chartPreviousClose,
      open: meta.regularMarketOpen ?? meta.regularMarketPrice,
      dayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      dayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      avgVolume: meta.averageDailyVolume10Day ?? 0,
      marketCap: meta.marketCap ?? 0,
      change: (meta.regularMarketPrice - (meta.previousClose ?? meta.chartPreviousClose)) ,
      changesPercentage: ((meta.regularMarketPrice - (meta.previousClose ?? meta.chartPreviousClose)) / (meta.previousClose ?? meta.chartPreviousClose)) * 100,
      yearHigh: meta['52WeekHigh'] ?? meta.fiftyTwoWeekHigh ?? 0,
      yearLow: meta['52WeekLow'] ?? meta.fiftyTwoWeekLow ?? 0,
      pe: null,
      eps: null,
      beta: null,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
    }
  } catch { return null }
}

export async function getProfile(ticker: string) {
  try {
    const data = await yf(`/v11/finance/quoteSummary/${ticker}?modules=assetProfile%2Cprice%2CsummaryDetail%2CdefaultKeyStatistics`)
    const result = data?.quoteSummary?.result?.[0]
    const asset = result?.assetProfile
    const price = result?.price
    const summary = result?.summaryDetail
    const ks = result?.defaultKeyStatistics
    if (!price) return null
    return {
      symbol: ticker,
      companyName: price?.longName ?? price?.shortName ?? ticker,
      sector: asset?.sector ?? '',
      industry: asset?.industry ?? '',
      country: asset?.country ?? '',
      ceo: asset?.companyOfficers?.[0]?.name ?? '',
      fullTimeEmployees: asset?.fullTimeEmployees ?? 0,
      website: asset?.website ?? '',
      description: asset?.longBusinessSummary ?? '',
      image: `https://logo.clearbit.com/${(asset?.website ?? '').replace('https://', '').replace('http://', '').split('/')[0]}`,
      ipoDate: '',
      exchange: price?.exchangeName ?? '',
      currency: price?.currency ?? 'USD',
      marketCap: price?.marketCap?.raw ?? 0,
      pe: summary?.trailingPE?.raw ?? null,
      eps: ks?.trailingEps?.raw ?? null,
      beta: summary?.beta?.raw ?? null,
      yearHigh: summary?.fiftyTwoWeekHigh?.raw ?? 0,
      yearLow: summary?.fiftyTwoWeekLow?.raw ?? 0,
      dividendYield: summary?.dividendYield?.raw ?? 0,
    }
  } catch { return null }
}

export async function getRatios(ticker: string) {
  try {
    const data = await yf(`/v11/finance/quoteSummary/${ticker}?modules=financialData%2CdefaultKeyStatistics%2CsummaryDetail`)
    const r = data?.quoteSummary?.result?.[0]
    const fd = r?.financialData
    const ks = r?.defaultKeyStatistics
    const sd = r?.summaryDetail
    return {
      returnOnEquityTTM: fd?.returnOnEquity?.raw ?? null,
      returnOnAssetsTTM: fd?.returnOnAssets?.raw ?? null,
      grossProfitMarginTTM: fd?.grossMargins?.raw ?? null,
      operatingProfitMarginTTM: fd?.operatingMargins?.raw ?? null,
      netProfitMarginTTM: fd?.profitMargins?.raw ?? null,
      debtEquityRatioTTM: fd?.debtToEquity?.raw ? fd.debtToEquity.raw / 100 : null,
      currentRatioTTM: fd?.currentRatio?.raw ?? null,
      quickRatioTTM: fd?.quickRatio?.raw ?? null,
      freeCashFlowPerShareTTM: ks?.freeCashflow?.raw && ks?.sharesOutstanding?.raw
        ? ks.freeCashflow.raw / ks.sharesOutstanding.raw : null,
      priceEarningsRatioTTM: sd?.forwardPE?.raw ?? null,
      pegRatioTTM: ks?.pegRatio?.raw ?? null,
      pbRatioTTM: ks?.priceToBook?.raw ?? null,
      priceToSalesRatioTTM: ks?.priceToSalesTrailing12Months?.raw ?? null,
      enterpriseValueMultipleTTM: ks?.enterpriseToEbitda?.raw ?? null,
      dividendYieldTTM: sd?.dividendYield?.raw ?? null,
    }
  } catch { return null }
}

export async function getIncomeStatements(ticker: string) {
  try {
    const data = await yf(`/v11/finance/quoteSummary/${ticker}?modules=incomeStatementHistory`)
    const stmts = data?.quoteSummary?.result?.[0]?.incomeStatementHistory?.incomeStatementHistory ?? []
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
    const data = await yf(`/v1/finance/search?q=${ticker}&newsCount=15&quotesCount=0`, YF_BASE2)
    return (data?.news ?? []).slice(0, 15).map((n: any) => ({
      title: n.title,
      url: n.link,
      site: n.publisher,
      publishedDate: new Date(n.providerPublishTime * 1000).toISOString(),
      text: '',
    }))
  } catch { return [] }
}

export async function getAnalystRatings(ticker: string) {
  try {
    const data = await yf(`/v11/finance/quoteSummary/${ticker}?modules=recommendationTrend`)
    const trend = data?.quoteSummary?.result?.[0]?.recommendationTrend?.trend?.[0]
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
    const data = await yf(`/v11/finance/quoteSummary/${ticker}?modules=financialData`)
    const fd = data?.quoteSummary?.result?.[0]?.financialData
    if (!fd?.targetMeanPrice) return null
    return {
      priceTarget: fd.targetMeanPrice?.raw ?? null,
      priceTargetHigh: fd.targetHighPrice?.raw ?? null,
      priceTargetLow: fd.targetLowPrice?.raw ?? null,
      numberOfAnalysts: fd.numberOfAnalystOpinions?.raw ?? 0,
    }
  } catch { return null }
}

export async function searchStocks(query: string) {
  try {
    const data = await yf(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`, YF_BASE2)
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
  try {
    const symbols = ['^GSPC', '^IXIC', '^DJI', '^RUT']
    const results = await Promise.all(symbols.map(async (s) => {
      try {
        const data = await yf(`/v8/finance/chart/${encodeURIComponent(s)}?interval=1d&range=1d`)
        const meta = data?.chart?.result?.[0]?.meta
        if (!meta) return null
        const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
        return {
          symbol: s,
          price: meta.regularMarketPrice,
          changesPercentage: ((meta.regularMarketPrice - prev) / prev) * 100,
          change: meta.regularMarketPrice - prev,
        }
      } catch { return null }
    }))
    return results.filter(Boolean)
  } catch { return [] }
}

export async function getGainersLosers() {
  try {
    const [g, l] = await Promise.all([
      yf(`/v1/finance/screener?scrIds=day_gainers&count=6`, YF_BASE2),
      yf(`/v1/finance/screener?scrIds=day_losers&count=6`, YF_BASE2),
    ])
    const map = (item: any) => ({
      symbol: item.symbol,
      ticker: item.symbol,
      name: item.shortName ?? item.longName ?? item.symbol,
      companyName: item.shortName ?? item.longName ?? item.symbol,
      price: item.regularMarketPrice ?? 0,
      changesPercentage: item.regularMarketChangePercent ?? 0,
    })
    return {
      gainers: (g?.finance?.result?.[0]?.quotes ?? []).map(map),
      losers: (l?.finance?.result?.[0]?.quotes ?? []).map(map),
      active: [],
    }
  } catch { return { gainers: [], losers: [], active: [] } }
}

export async function getDCF(_ticker: string) {
  return null
}

export async function getSectorPerformance() {
  try {
    const sectors = [
      { symbol: 'XLK', sector: 'Technology' },
      { symbol: 'XLV', sector: 'Healthcare' },
      { symbol: 'XLF', sector: 'Financial Services' },
      { symbol: 'XLY', sector: 'Consumer Cyclical' },
      { symbol: 'XLC', sector: 'Communication Services' },
      { symbol: 'XLI', sector: 'Industrials' },
      { symbol: 'XLP', sector: 'Consumer Defensive' },
      { symbol: 'XLE', sector: 'Energy' },
    ]
    const results = await Promise.all(sectors.map(async ({ symbol, sector }) => {
      try {
        const data = await yf(`/v8/finance/chart/${symbol}?interval=1d&range=1d`)
        const meta = data?.chart?.result?.[0]?.meta
        if (!meta) return { sector, changesPercentage: '0' }
        const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice
        const pct = ((meta.regularMarketPrice - prev) / prev) * 100
        return { sector, changesPercentage: pct.toFixed(2) }
      } catch { return { sector, changesPercentage: '0' } }
    }))
    return results
  } catch { return [] }
}
