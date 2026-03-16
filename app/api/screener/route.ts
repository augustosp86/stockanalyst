import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sector = searchParams.get('sector') ?? ''
  const limit = parseInt(searchParams.get('limit') ?? '30')

  const SECTOR_ETF: Record<string, string> = {
    'Technology': 'XLK', 'Healthcare': 'XLV', 'Financial Services': 'XLF',
    'Consumer Cyclical': 'XLY', 'Communication Services': 'XLC',
    'Industrials': 'XLI', 'Consumer Defensive': 'XLP', 'Energy': 'XLE',
  }

  try {
    // Use Yahoo Finance screener
    const scrId = sector && SECTOR_ETF[sector] ? 'day_gainers' : 'most_actives'
    const res = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/screener?scrIds=${scrId}&count=${Math.min(limit, 100)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 },
      }
    )
    const data = await res.json()
    const quotes = data?.finance?.result?.[0]?.quotes ?? []

    const results = quotes.map((q: any) => ({
      symbol: q.symbol,
      companyName: q.shortName ?? q.longName ?? q.symbol,
      sector: q.sector ?? sector ?? 'â€”',
      marketCap: q.marketCap ?? 0,
      price: q.regularMarketPrice ?? 0,
      changePercentage: q.regularMarketChangePercent ?? 0,
      peRatio: q.trailingPE ?? null,
      volume: q.regularMarketVolume ?? 0,
    }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
