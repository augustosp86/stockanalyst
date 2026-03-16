import { NextResponse } from 'next/server'
import { getNews } from '@/lib/fmp'

export async function GET(request: Request, { params }: { params: { ticker: string } }) {
  try {
    const news = await getNews(params.ticker.toUpperCase())
    return NextResponse.json(news ?? [])
  } catch {
    return NextResponse.json([])
  }
}
