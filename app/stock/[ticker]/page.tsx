'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, Star, RefreshCw, ExternalLink } from 'lucide-react'
import { fmt$, fmtPct, fmtBig, fmtX, fmtAgo } from '@/lib/format'
import { clsx } from 'clsx'

const TABS = ['Resumen', 'Fundamentales', 'Valuación', 'Sentimiento', 'Noticias']

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#8899B4]">{label}</span>
        <span className="mono font-bold" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-[#1E2D4A] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / 10) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#1E2D4A] last:border-0">
      <span className="text-sm text-[#8899B4]">{label}</span>
      <span className={clsx('text-sm mono font-semibold', color ? '' : 'text-white')} style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  )
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
    buy:   { label: 'COMPRAR', color: '#00C853', bg: '#002E18', border: '#004D28' },
    hold:  { label: 'MANTENER', color: '#FFB800', bg: '#2E1F00', border: '#4D3500' },
    watch: { label: 'OBSERVAR', color: '#00D4FF', bg: '#001E3A', border: '#003066' },
    avoid: { label: 'EVITAR',   color: '#FF3860', bg: '#2E0010', border: '#4D001A' },
  }
  const c = cfg[verdict] ?? cfg.watch
  return (
    <div className="px-4 py-1.5 rounded-full text-sm font-bold border" style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
      {c.label}
    </div>
  )
}

function AIAnalysis({ ticker, data }: { ticker: string; data: any }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function generate() {
    setLoading(true); setText(''); setDone(false)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, data, lang: 'es' }),
      })
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done: d, value } = await reader.read()
        if (d) break
        setText(p => p + dec.decode(value))
      }
      setDone(true)
    } catch { setText('Error al generar análisis.') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (data) generate() }, [!!data])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#001E3A] border border-[#00D4FF]/30 flex items-center justify-center">
            <span className="text-[#00D4FF] text-xs">AI</span>
          </div>
          <span className="text-sm font-semibold text-white">Análisis con IA</span>
        </div>
        {done && (
          <button onClick={generate} className="text-xs text-[#4A5A7A] hover:text-[#8899B4] flex items-center gap-1">
            <RefreshCw size={11} /> Regenerar
          </button>
        )}
      </div>
      <p className="text-sm text-[#C8D6EF] leading-relaxed min-h-[60px]">
        {loading && !text && <span className="text-[#4A5A7A]">Generando análisis…</span>}
        {text}
        {loading && text && <span className="inline-block w-0.5 h-4 bg-[#00D4FF] ml-0.5 animate-pulse align-middle" />}
      </p>
    </div>
  )
}

export default function StockPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Resumen')
  const [watchlist, setWatchlist] = useState<string[]>([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('watchlist') ?? '[]')
    setWatchlist(saved)
  }, [])

  useEffect(() => {
    setLoading(true)
    const t = ticker.toUpperCase()
    Promise.all([
      fetch(`/api/stocks/${t}`).then(r => r.json()),
      fetch(`/api/stocks/${t}/news`).then(r => r.json()),
    ]).then(([stockData, newsData]) => {
      setData(stockData)
      setNews(newsData ?? [])
      setLoading(false)
    })
  }, [ticker])

  const toggleWatchlist = () => {
    const t = ticker.toUpperCase()
    const next = watchlist.includes(t) ? watchlist.filter(x => x !== t) : [...watchlist, t]
    setWatchlist(next)
    localStorage.setItem('watchlist', JSON.stringify(next))
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#8899B4] text-sm">Analizando {ticker.toUpperCase()}…</p>
      </div>
    </div>
  )

  if (!data || data.error) return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center gap-4">
      <p className="text-[#FF3860] font-mono text-2xl">404</p>
      <p className="text-[#8899B4]">Ticker no encontrado</p>
      <button onClick={() => router.push('/')} className="text-[#00D4FF] text-sm hover:underline">← Volver al Dashboard</button>
    </div>
  )

  const q = data.quote
  const p = data.profile
  const r = data.ratios
  const s = data.scores
  const inc = data.income ?? []
  const an = data.analyst
  const pt = data.priceTarget
  const dcf = data.dcf
  const isPos = q.changesPercentage >= 0
  const inWatchlist = watchlist.includes(ticker.toUpperCase())

  const latest = inc[0] ?? {}
  const prev = inc[1] ?? {}
  const revGrowth = prev.revenue ? ((latest.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : null
  const epsGrowth = prev.eps && prev.eps > 0 ? ((latest.eps - prev.eps) / prev.eps) * 100 : null

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0E1A]/95 backdrop-blur-sm border-b border-[#1E2D4A]">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/')} className="text-[#4A5A7A] hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-white">{p?.companyName ?? ticker.toUpperCase()}</h1>
                  <span className="text-xs mono text-[#00D4FF] bg-[#001E3A] border border-[#00D4FF]/20 px-2 py-0.5 rounded">
                    {ticker.toUpperCase()}
                  </span>
                  <span className="text-xs text-[#4A5A7A]">{p?.exchange}</span>
                </div>
                <p className="text-xs text-[#8899B4] mt-0.5">{p?.sector} · {p?.industry}</p>
              </div>
            </div>

            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold mono text-white">{fmt$(q.price)}</span>
                  <div className={clsx('flex items-center gap-1 text-sm mono font-semibold', isPos ? 'text-[#00C853]' : 'text-[#FF3860]')}>
                    {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPos ? '+' : ''}{fmtPct(q.changesPercentage)}
                  </div>
                </div>
                <div className="flex gap-3 text-xs mono text-[#4A5A7A] mt-0.5">
                  <span>H: <span className="text-[#00C853]">{fmt$(q.dayHigh)}</span></span>
                  <span>L: <span className="text-[#FF3860]">{fmt$(q.dayLow)}</span></span>
                  <span>Vol: {fmtBig(q.volume).replace('$', '')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <VerdictBadge verdict={data.verdict} />
                <button onClick={toggleWatchlist}
                  className={clsx('p-2 rounded-lg border transition-all', inWatchlist ? 'bg-[#2E1F00] border-[#4D3500] text-[#FFB800]' : 'bg-[#141929] border-[#1E2D4A] text-[#4A5A7A] hover:text-white')}>
                  <Star size={16} fill={inWatchlist ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Score + AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Score */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#8899B4] uppercase tracking-wider">Puntuación</p>
              <div className="text-center">
                <p className="text-3xl font-bold mono text-white">{s.overall.toFixed(1)}</p>
                <p className="text-xs text-[#4A5A7A]">/10</p>
              </div>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Fundamentales" value={s.fundamentals} color="#00D4FF" />
              <ScoreBar label="Crecimiento" value={s.growth} color="#00FF87" />
              <ScoreBar label="Rentabilidad" value={s.profitability} color="#FFB800" />
              <ScoreBar label="Salud financiera" value={s.financial_health} color="#7C3AED" />
            </div>
          </div>

          {/* AI Analysis */}
          <div className="lg:col-span-2">
            <AIAnalysis ticker={ticker.toUpperCase()} data={data} />

            {/* Highlights */}
            {data.highlights?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                {data.highlights.map((h: any, i: number) => (
                  <div key={i} className={clsx('flex items-start gap-2 p-3 rounded-lg border text-xs', {
                    'bg-[#002E18] border-[#004D28] text-[#00C853]': h.type === 'positive',
                    'bg-[#2E0010] border-[#4D001A] text-[#FF3860]': h.type === 'negative',
                    'bg-[#2E1F00] border-[#4D3500] text-[#FFB800]': h.type === 'neutral',
                  })}>
                    <span className="mt-0.5 flex-shrink-0">{h.type === 'positive' ? '↑' : h.type === 'negative' ? '↓' : '→'}</span>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[#1E2D4A] bg-[#0F1526]">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                  tab === t ? 'border-[#00D4FF] text-[#00D4FF]' : 'border-transparent text-[#8899B4] hover:text-white')}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* RESUMEN */}
            {tab === 'Resumen' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Precio</p>
                  <Metric label="Apertura" value={fmt$(q.open)} />
                  <Metric label="Cierre anterior" value={fmt$(q.previousClose)} />
                  <Metric label="Máximo 52 sem." value={fmt$(q.yearHigh)} color="#00C853" />
                  <Metric label="Mínimo 52 sem." value={fmt$(q.yearLow)} color="#FF3860" />
                  <Metric label="Market Cap" value={fmtBig(q.marketCap)} />
                  <Metric label="Volumen prom." value={fmtBig(q.avgVolume).replace('$', '')} />
                </div>
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Empresa</p>
                  <Metric label="CEO" value={p?.ceo ?? '—'} />
                  <Metric label="País" value={p?.country ?? '—'} />
                  <Metric label="Empleados" value={p?.fullTimeEmployees?.toLocaleString() ?? '—'} />
                  <Metric label="IPO" value={p?.ipoDate ?? '—'} />
                  <Metric label="Sector" value={p?.sector ?? '—'} />
                  <Metric label="Beta" value={q.beta?.toFixed(2) ?? '—'} />
                </div>
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Descripción</p>
                  <p className="text-xs text-[#8899B4] leading-relaxed line-clamp-6">{p?.description ?? '—'}</p>
                </div>
              </div>
            )}

            {/* FUNDAMENTALES */}
            {tab === 'Fundamentales' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Crecimiento</p>
                  <Metric label="Crecimiento ingresos" value={revGrowth !== null ? fmtPct(revGrowth) : '—'} color={revGrowth && revGrowth > 0 ? '#00C853' : '#FF3860'} />
                  <Metric label="Crecimiento EPS" value={epsGrowth !== null ? fmtPct(epsGrowth) : '—'} color={epsGrowth && epsGrowth > 0 ? '#00C853' : '#FF3860'} />
                  <Metric label="Ingresos TTM" value={fmtBig(latest.revenue)} />
                  <Metric label="EBITDA" value={fmtBig(latest.ebitda)} />
                  <Metric label="Utilidad neta" value={fmtBig(latest.netIncome)} color={latest.netIncome > 0 ? '#00C853' : '#FF3860'} />
                </div>
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Rentabilidad</p>
                  <Metric label="ROE" value={fmtPct(r?.returnOnEquityTTM * 100)} color={(r?.returnOnEquityTTM * 100) > 15 ? '#00C853' : '#FFB800'} />
                  <Metric label="ROA" value={fmtPct(r?.returnOnAssetsTTM * 100)} />
                  <Metric label="Margen bruto" value={fmtPct(r?.grossProfitMarginTTM * 100)} />
                  <Metric label="Margen operativo" value={fmtPct(r?.operatingProfitMarginTTM * 100)} />
                  <Metric label="Margen neto" value={fmtPct(r?.netProfitMarginTTM * 100)} color={(r?.netProfitMarginTTM * 100) > 10 ? '#00C853' : '#FFB800'} />
                </div>
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Salud financiera</p>
                  <Metric label="Deuda / Capital" value={fmtX(r?.debtEquityRatioTTM)} color={(r?.debtEquityRatioTTM) < 1 ? '#00C853' : '#FF3860'} />
                  <Metric label="Ratio corriente" value={r?.currentRatioTTM?.toFixed(2) ?? '—'} color={(r?.currentRatioTTM) > 1.5 ? '#00C853' : '#FFB800'} />
                  <Metric label="Ratio rápido" value={r?.quickRatioTTM?.toFixed(2) ?? '—'} />
                  <Metric label="FCF por acción" value={fmt$(r?.freeCashFlowPerShareTTM)} color={(r?.freeCashFlowPerShareTTM) > 0 ? '#00C853' : '#FF3860'} />
                  <Metric label="Dividend yield" value={r?.dividendYieldTTM ? fmtPct(r.dividendYieldTTM * 100) : '0%'} />
                </div>
              </div>
            )}

            {/* VALUACIÓN */}
            {tab === 'Valuación' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Múltiplos</p>
                  <Metric label="P/E" value={fmtX(q.pe)} />
                  <Metric label="P/E forward" value={fmtX(r?.priceEarningsRatioTTM)} />
                  <Metric label="PEG" value={fmtX(r?.pegRatioTTM)} />
                  <Metric label="EV/EBITDA" value={fmtX(r?.enterpriseValueMultipleTTM)} />
                  <Metric label="P/Ventas" value={fmtX(r?.priceToSalesRatioTTM)} />
                  <Metric label="P/Book" value={fmtX(r?.pbRatioTTM)} />
                </div>
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Precio objetivo</p>
                  {dcf?.dcf && (
                    <div className="card p-4 mb-3 border-[#00D4FF]/20">
                      <p className="text-xs text-[#8899B4] mb-1">Valor intrínseco (DCF)</p>
                      <p className="text-2xl font-bold mono text-white">{fmt$(dcf.dcf)}</p>
                      <p className={clsx('text-sm mono font-bold mt-1', dcf.dcf > q.price ? 'text-[#00C853]' : 'text-[#FF3860]')}>
                        {dcf.dcf > q.price ? '+' : ''}{fmtPct(((dcf.dcf - q.price) / q.price) * 100)} potencial
                      </p>
                    </div>
                  )}
                  {pt?.priceTarget && (
                    <div className="card p-4">
                      <p className="text-xs text-[#8899B4] mb-1">Consenso analistas ({pt.numberOfAnalysts} analistas)</p>
                      <p className="text-2xl font-bold mono text-white">{fmt$(pt.priceTarget)}</p>
                      <p className={clsx('text-sm mono font-bold mt-1', pt.priceTarget > q.price ? 'text-[#00C853]' : 'text-[#FF3860]')}>
                        {pt.priceTarget > q.price ? '+' : ''}{fmtPct(((pt.priceTarget - q.price) / q.price) * 100)} vs precio actual
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SENTIMIENTO */}
            {tab === 'Sentimiento' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-3">Recomendaciones de analistas</p>
                  {an ? (
                    <div className="space-y-3">
                      {[
                        { label: 'Comprar', value: an.analystRatingsbuy, color: '#00C853', bg: '#002E18' },
                        { label: 'Mantener', value: an.analystRatingsHold, color: '#FFB800', bg: '#2E1F00' },
                        { label: 'Vender', value: an.analystRatingsSell, color: '#FF3860', bg: '#2E0010' },
                        { label: 'Strong Buy', value: an.analystRatingsStrongBuy, color: '#00FF87', bg: '#002E18' },
                        { label: 'Strong Sell', value: an.analystRatingsStrongSell, color: '#FF6B35', bg: '#2E1500' },
                      ].map(item => {
                        const total = (an.analystRatingsbuy || 0) + (an.analystRatingsHold || 0) + (an.analystRatingsSell || 0) + (an.analystRatingsStrongBuy || 0) + (an.analystRatingsStrongSell || 0)
                        const pct = total > 0 ? ((item.value || 0) / total) * 100 : 0
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-xs text-[#8899B4] w-20">{item.label}</span>
                            <div className="flex-1 h-2 bg-[#1E2D4A] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                            </div>
                            <span className="text-xs mono font-bold w-6 text-right" style={{ color: item.color }}>{item.value || 0}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : <p className="text-sm text-[#4A5A7A]">Sin datos de analistas</p>}
                </div>
                <div>
                  <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-3">Resumen del mercado</p>
                  <div className="space-y-2">
                    {[
                      { label: '52 semanas', value: `${fmt$(q.yearLow)} — ${fmt$(q.yearHigh)}` },
                      { label: 'Beta', value: q.beta?.toFixed(2) ?? '—', color: q.beta > 1.5 ? '#FF3860' : q.beta > 1 ? '#FFB800' : '#00C853' },
                      { label: 'EPS TTM', value: fmt$(q.eps) },
                      { label: 'Próx. earnings', value: data?.earningsDate ?? '—' },
                    ].map(m => <Metric key={m.label} {...m} />)}
                  </div>
                </div>
              </div>
            )}

            {/* NOTICIAS */}
            {tab === 'Noticias' && (
              <div className="space-y-2">
                {news.length === 0
                  ? <p className="text-sm text-[#4A5A7A]">Sin noticias recientes</p>
                  : news.map((n: any, i: number) => {
                    const sentiment = (() => {
                      const t = (n.title + ' ' + (n.text ?? '')).toLowerCase()
                      const pos = ['beat', 'surge', 'growth', 'profit', 'record', 'buy', 'upgrade'].filter(w => t.includes(w)).length
                      const neg = ['miss', 'fall', 'loss', 'decline', 'sell', 'downgrade', 'lawsuit'].filter(w => t.includes(w)).length
                      return pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral'
                    })()
                    return (
                      <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#0F1526] hover:bg-[#141929] border border-[#1E2D4A] hover:border-[#243352] transition-all group">
                        <div className={clsx('flex-shrink-0 w-1 h-full min-h-[40px] rounded-full', {
                          'bg-[#00C853]': sentiment === 'positive',
                          'bg-[#FF3860]': sentiment === 'negative',
                          'bg-[#FFB800]': sentiment === 'neutral',
                        })} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white group-hover:text-[#00D4FF] transition-colors line-clamp-2 font-medium">{n.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#4A5A7A]">{n.site}</span>
                            <span className="text-xs text-[#4A5A7A]">·</span>
                            <span className="text-xs text-[#4A5A7A]">{fmtAgo(n.publishedDate)}</span>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-[#4A5A7A] flex-shrink-0 mt-1" />
                      </a>
                    )
                  })
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
