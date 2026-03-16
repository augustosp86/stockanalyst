import { NextResponse } from 'next/server'
import { getQuote, getProfile, getIncomeStatements, getRatios, getAnalystRatings, getPriceTarget, getDCF } from '@/lib/fmp'
import { calcScores, getVerdict, getHighlights } from '@/lib/scores'

export async function GET(request: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()

  try {
    const [quote, profile, income, ratios, analyst, priceTarget, dcf] = await Promise.allSettled([
      getQuote(ticker),
      getProfile(ticker),
      getIncomeStatements(ticker),
      getRatios(ticker),
      getAnalystRatings(ticker),
      getPriceTarget(ticker),
      getDCF(ticker),
    ])

    const q = quote.status === 'fulfilled' ? quote.value : null
    const p = profile.status === 'fulfilled' ? profile.value : null
    const inc = income.status === 'fulfilled' ? income.value : []
    const rat = ratios.status === 'fulfilled' ? ratios.value : null
    const an = analyst.status === 'fulfilled' ? analyst.value : null
    const pt = priceTarget.status === 'fulfilled' ? priceTarget.value : null
    const d = dcf.status === 'fulfilled' ? dcf.value : null

    if (!q) return NextResponse.json({ error: 'Ticker no encontrado' }, { status: 404 })

    const scores = calcScores(rat, inc, q)
    const verdict = getVerdict(scores, q)
    const highlights = getHighlights(rat, inc, q)

    return NextResponse.json({
      quote: q,
      profile: p,
      income: inc,
      ratios: rat,
      analyst: an,
      priceTarget: pt,
      dcf: d,
      scores,
      verdict,
      highlights,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
