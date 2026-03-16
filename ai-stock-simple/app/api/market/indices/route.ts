import { NextResponse } from 'next/server'

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI',  name: 'Dow Jones' },
  { symbol: '^RUT',  name: 'Russell 2000' },
]

export async function GET() {
  try {
    const KEY = process.env.FMP_API_KEY
    const symbols = INDICES.map(i => i.symbol).join(',')
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbols)}?apikey=${KEY}`,
      { next: { revalidate: 30 } }
    )
    const data = await res.json()
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
