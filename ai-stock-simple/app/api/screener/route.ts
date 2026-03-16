import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const KEY = process.env.FMP_API_KEY

  const params = new URLSearchParams()
  params.set('apikey', KEY!)
  for (const [k, v] of searchParams.entries()) {
    params.set(k, v)
  }

  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/stock-screener?${params.toString()}`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
