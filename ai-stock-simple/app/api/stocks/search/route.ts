import { NextResponse } from 'next/server'
import { searchStocks } from '@/lib/fmp'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json([])
  try {
    const results = await searchStocks(q)
    return NextResponse.json(results ?? [])
  } catch {
    return NextResponse.json([])
  }
}
