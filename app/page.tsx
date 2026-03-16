'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Activity, Search } from 'lucide-react'
import { fmt$, fmtPct } from '@/lib/format'
import { clsx } from 'clsx'

function MarketBadge({ open }: { open: boolean }) {
  return (
    <div className={clsx(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
      open ? 'bg-[#002E18] text-[#00C853] border-[#004D28]' : 'bg-[#141929] text-[#8899B4] border-[#1E2D4A]'
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', open ? 'bg-[#00C853] animate-pulse' : 'bg-[#8899B4]')} />
      {open ? 'Mercado Abierto' : 'Mercado Cerrado'}
    </div>
  )
}

function IndexCard({ name, symbol, price, change, pct }: any) {
  const pos = pct >= 0
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-[#4A5A7A] mono">{symbol}</span>
      <span className="text-xs text-[#8899B4]">{name}</span>
      <span className="text-lg font-bold mono text-white mt-1">{fmt$(price)}</span>
      <span className={clsx('text-sm font-semibold mono', pos ? 'text-[#00C853]' : 'text-[#FF3860]')}>
        {pos ? '+' : ''}{fmtPct(pct)}
      </span>
    </div>
  )
}

function MoverRow({ item, onClick }: { item: any; onClick: () => void }) {
  const pos = item.changesPercentage >= 0
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#162030] transition-colors border-b border-[#1E2D4A] last:border-0 text-left">
      <div>
        <p className="text-sm font-bold mono text-white">{item.ticker || item.symbol}</p>
        <p className="text-xs text-[#8899B4] truncate max-w-[160px]">{item.companyName || item.name}</p>
      </div>
      <div className="text-right">
        <p className="text-sm mono font-semibold text-white">{fmt$(item.price || item.lastSalePrice)}</p>
        <p className={clsx('text-xs mono font-bold', pos ? 'text-[#00C853]' : 'text-[#FF3860]')}>
          {pos ? '+' : ''}{fmtPct(item.changesPercentage)}
        </p>
      </div>
    </button>
  )
}

function FearGreedGauge({ value, rating }: { value: number; rating: string }) {
  const color = value < 30 ? '#FF3860' : value < 50 ? '#FF6B35' : value < 70 ? '#FFB800' : '#00C853'
  const angle = (value / 100) * 180 - 90
  const rad = (angle * Math.PI) / 180
  const cx = 80, cy = 80, r = 60
  const x = cx + r * Math.cos(rad)
  const y = cy + r * Math.sin(rad)
  return (
    <div className="card p-4 flex flex-col items-center">
      <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-2">Miedo & Codicia</p>
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="#1E2D4A" strokeWidth="14" />
        <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${(value / 100) * 188} 188`} opacity="0.8" />
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="white" />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="monospace">{value}</text>
      </svg>
      <span className="text-sm font-bold mt-1" style={{ color }}>{rating}</span>
    </div>
  )
}

function SearchBar() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (q.length < 1) { setResults([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data?.slice(0, 7) ?? [])
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 bg-[#141929] border border-[#1E2D4A] rounded-xl px-4 py-3 focus-within:border-[#00D4FF]">
        <Search size={16} className="text-[#4A5A7A]" />
        <input
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#4A5A7A]"
          placeholder="Buscar ticker o empresa… (ej: AAPL, NVDA)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0F1526] border border-[#1E2D4A] rounded-xl shadow-2xl z-50 overflow-hidden">
          {results.map((r: any) => (
            <button key={r.symbol} onMouseDown={() => { router.push(`/stock/${r.symbol}`); setQ(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141929] text-left border-b border-[#1E2D4A] last:border-0">
              <span className="text-sm font-bold mono text-[#00D4FF] w-16">{r.symbol}</span>
              <span className="text-sm text-[#8899B4] truncate">{r.name}</span>
              <span className="ml-auto text-xs text-[#4A5A7A]">{r.exchangeShortName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [indices, setIndices] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/market').then(r => r.json()).then(setData)
    fetch('/api/market/indices').then(r => r.json()).then(d => setIndices(d ?? []))
  }, [])

  const indexMap: Record<string, string> = {
    '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'Dow Jones', '^RUT': 'Russell 2000'
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Header */}
      <div className="border-b border-[#1E2D4A] bg-[#0F1526] px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-[#00D4FF] mono">AI</span> Stock Analyst
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <MarketBadge open={data?.marketOpen ?? false} />
              {data?.fearGreed && <span className="text-xs text-[#4A5A7A]">VIX: —</span>}
            </div>
          </div>
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Indices */}
        <section>
          <h2 className="text-xs font-semibold text-[#8899B4] uppercase tracking-wider mb-3">Índices principales</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {indices.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)
              : indices.map((idx: any) => (
                <IndexCard key={idx.symbol}
                  symbol={idx.symbol}
                  name={indexMap[idx.symbol] ?? idx.symbol}
                  price={idx.price}
                  change={idx.change}
                  pct={idx.changesPercentage}
                />
              ))
            }
          </div>
        </section>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gainers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E2D4A]">
              <TrendingUp size={14} className="text-[#00C853]" />
              <span className="text-sm font-semibold text-white">Mayores subas</span>
            </div>
            {data?.movers?.gainers?.map((m: any) => (
              <MoverRow key={m.ticker || m.symbol} item={m}
                onClick={() => router.push(`/stock/${m.ticker || m.symbol}`)} />
            )) ?? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 mx-4 my-2 rounded" />)}
          </div>

          {/* Losers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E2D4A]">
              <TrendingDown size={14} className="text-[#FF3860]" />
              <span className="text-sm font-semibold text-white">Mayores bajas</span>
            </div>
            {data?.movers?.losers?.map((m: any) => (
              <MoverRow key={m.ticker || m.symbol} item={m}
                onClick={() => router.push(`/stock/${m.ticker || m.symbol}`)} />
            )) ?? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 mx-4 my-2 rounded" />)}
          </div>

          {/* Right column: Fear&Greed + Sectors */}
          <div className="space-y-4">
            {data?.fearGreed
              ? <FearGreedGauge value={data.fearGreed.value} rating={data.fearGreed.rating} />
              : <div className="skeleton h-40 rounded-xl" />
            }

            <div className="card p-4">
              <p className="text-xs text-[#8899B4] uppercase tracking-wider mb-3">Sectores hoy</p>
              <div className="space-y-2">
                {data?.sectors?.slice(0, 8).map((s: any) => {
                  const pct = parseFloat(s.changesPercentage ?? s.change ?? '0')
                  const pos = pct >= 0
                  return (
                    <div key={s.sector} className="flex items-center justify-between text-xs">
                      <span className="text-[#8899B4] truncate max-w-[160px]">{s.sector}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#1E2D4A] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(Math.abs(pct) * 5, 100)}%`,
                            backgroundColor: pos ? '#00C853' : '#FF3860'
                          }} />
                        </div>
                        <span className={clsx('mono font-semibold w-14 text-right', pos ? 'text-[#00C853]' : 'text-[#FF3860]')}>
                          {pos ? '+' : ''}{pct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Popular tickers */}
        <section>
          <h2 className="text-xs font-semibold text-[#8899B4] uppercase tracking-wider mb-3">Acciones populares</h2>
          <div className="flex flex-wrap gap-2">
            {['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AMD','NFLX','JPM','V','BRK-B'].map(t => (
              <button key={t} onClick={() => router.push(`/stock/${t}`)}
                className="px-3 py-1.5 bg-[#141929] border border-[#1E2D4A] hover:border-[#00D4FF] hover:text-[#00D4FF] text-[#8899B4] rounded-lg text-xs font-bold mono transition-colors">
                {t}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
