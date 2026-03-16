export function calcScores(ratios: any, income: any[], quote: any) {
  const latest = income?.[0] ?? {}
  const prev = income?.[1] ?? {}

  // Growth score
  const revGrowth = prev.revenue ? ((latest.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : 0
  const epsGrowth = prev.eps && prev.eps > 0 ? ((latest.eps - prev.eps) / prev.eps) * 100 : 0
  let growth = 5
  if (revGrowth > 20) growth += 2
  else if (revGrowth > 10) growth += 1
  else if (revGrowth < 0) growth -= 2
  if (epsGrowth > 15) growth += 1.5
  else if (epsGrowth < 0) growth -= 1
  growth = clamp(growth)

  // Profitability score
  let profitability = 5
  const netMargin = ratios?.netProfitMarginTTM * 100
  const roe = ratios?.returnOnEquityTTM * 100
  if (netMargin > 20) profitability += 2
  else if (netMargin > 10) profitability += 1
  else if (netMargin < 0) profitability -= 2
  if (roe > 20) profitability += 1.5
  else if (roe > 10) profitability += 0.5
  else if (roe < 5) profitability -= 1
  profitability = clamp(profitability)

  // Financial health
  let health = 6
  const de = ratios?.debtEquityRatioTTM
  const cr = ratios?.currentRatioTTM
  if (de > 3) health -= 2
  else if (de > 1.5) health -= 1
  else if (de < 0.3) health += 1
  if (cr < 1) health -= 1.5
  else if (cr > 2) health += 0.5
  health = clamp(health)

  // Fundamentals (valuation)
  let fundamentals = 5
  const pe = quote?.pe
  if (pe && pe > 0 && pe < 15) fundamentals += 1.5
  else if (pe && pe > 50) fundamentals -= 1
  if (ratios?.pegRatioTTM > 0 && ratios.pegRatioTTM < 1) fundamentals += 1
  fundamentals = clamp(fundamentals)

  const overall = (growth + profitability + health + fundamentals) / 4

  return {
    growth: round(growth),
    profitability: round(profitability),
    financial_health: round(health),
    fundamentals: round(fundamentals),
    overall: round(overall),
  }
}

export function getVerdict(scores: any, quote: any): 'buy' | 'hold' | 'watch' | 'avoid' {
  if (scores.overall >= 7.5) return 'buy'
  if (scores.overall >= 6) return 'hold'
  if (scores.overall >= 4.5) return 'watch'
  return 'avoid'
}

export function getHighlights(ratios: any, income: any[], quote: any) {
  const latest = income?.[0] ?? {}
  const prev = income?.[1] ?? {}
  const highlights: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = []

  const revGrowth = prev.revenue ? ((latest.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : null
  if (revGrowth !== null) {
    if (revGrowth > 20) highlights.push({ type: 'positive', text: `Ingresos crecieron ${revGrowth.toFixed(1)}% interanual` })
    else if (revGrowth < 0) highlights.push({ type: 'negative', text: `Ingresos cayeron ${Math.abs(revGrowth).toFixed(1)}% interanual` })
  }

  const netMargin = ratios?.netProfitMarginTTM * 100
  if (netMargin > 20) highlights.push({ type: 'positive', text: `Alto margen neto de ${netMargin.toFixed(1)}%` })
  else if (netMargin < 0) highlights.push({ type: 'negative', text: `Operando con pérdidas — margen negativo` })

  const de = ratios?.debtEquityRatioTTM
  if (de < 0.3) highlights.push({ type: 'positive', text: `Balance sólido con deuda mínima (D/E: ${de?.toFixed(2)}x)` })
  else if (de > 3) highlights.push({ type: 'negative', text: `Alto endeudamiento (D/E: ${de?.toFixed(2)}x)` })

  const pe = quote?.pe
  if (pe && pe > 0 && pe < 15) highlights.push({ type: 'positive', text: `Valuación atractiva — P/E de ${pe.toFixed(1)}x` })
  else if (pe && pe > 50) highlights.push({ type: 'neutral', text: `Valuación premium — P/E de ${pe.toFixed(1)}x` })

  return highlights.slice(0, 3)
}

function clamp(n: number) { return Math.max(1, Math.min(10, n)) }
function round(n: number) { return Math.round(n * 10) / 10 }
