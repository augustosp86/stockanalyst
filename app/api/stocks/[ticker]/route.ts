import { NextResponse } from 'next/server'
import { getQuote, getProfile, getRatios, getIncomeStatements } from '@/lib/fmp'
import { calcScores, getVerdict, getHighlights } from '@/lib/scores'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  try {
    // All use the same cached fetchAll() call internally — only 1 real HTTP request
    const [quote, profile, ratios, income] = await Promise.allSettled([
      getQuote(ticker),
      getProfile(ticker),
      getRatios(ticker),
      getIncomeStatements(ticker),
    ])

    const q = quote.status === 'fulfilled' ? quote.value : null
    const p = profile.status === 'fulfilled' ? profile.value : null
    const rat = ratios.status === 'fulfilled' ? ratios.value : null
    const inc = income.status === 'fulfilled' ? income.value : []

    if (!q) return NextResponse.json({ error: 'Ticker no encontrado' }, { status: 404 })

    const enrichedQuote = {
      ...q,
      marketCap: q.marketCap || p?.marketCap || 0,
      yearHigh: q.yearHigh || p?.yearHigh || 0,
      yearLow: q.yearLow || p?.yearLow || 0,
      pe: q.pe || p?.pe || null,
      eps: q.eps || p?.eps || null,
      beta: q.beta || p?.beta || null,
    }

    const scores = calcScores(rat, inc, enrichedQuote)
    const verdict = getVerdict(scores, enrichedQuote)
    const highlights = getHighlights(rat, inc, enrichedQuote)

    return NextResponse.json({
      quote: enrichedQuote,
      profile: p,
      income: inc,
      ratios: rat,
      analyst: null,
      priceTarget: null,
      dcf: null,
      scores,
      verdict,
      highlights,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
