'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { fmt$, fmtPct, fmtBig } from '@/lib/format'
import { clsx } from 'clsx'

export default function WatchlistPage() {
  const router = useRouter()
  const [tickers, setTickers] = useState<string[]>([])
  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('watchlist') ?? '[]')
    setTickers(saved)
    if (saved.length > 0) loadQuotes(saved)
  }, [])

  async function loadQuotes(list: string[]) {
    setLoading(true)
    const results: Record<string, any> = {}
    await Promise.all(list.map(async (t) => {
      try {
        const res = await fetch(`/api/stocks/${t}`)
        const data = await res.json()
        if (data?.quote) results[t] = data.quote
      } catch {}
    }))
    setQuotes(results)
    setLoading(false)
  }

  function remove(ticker: string) {
    const next = tickers.filter(t => t !== ticker)
    setTickers(next)
    localStorage.setItem('watchlist', JSON.stringify(next))
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="border-b border-[#1E2D4A] bg-[#0F1526] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-[#4A5A7A] hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <Star size={16} className="text-[#FFB800]" />
          <h1 className="text-lg font-bold text-white">Mi Watchlist</h1>
          <span className="text-xs text-[#4A5A7A] bg-[#141929] border border-[#1E2D4A] px-2 py-0.5 rounded-full">{tickers.length}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {tickers.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Star size={40} className="text-[#1E2D4A] mx-auto" />
            <p className="text-[#8899B4]">Tu watchlist está vacía</p>
            <p className="text-xs text-[#4A5A7A]">Buscá una acción y presioná el ★ para agregarla</p>
            <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-[#141929] border border-[#1E2D4A] text-[#00D4FF] text-sm rounded-lg hover:bg-[#162030]">
              Ir al Dashboard
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {tickers.map((ticker) => {
              const q = quotes[ticker]
              const isPos = (q?.changesPercentage ?? 0) >= 0
              return (
                <div key={ticker} className="flex items-center justify-between px-4 py-4 border-b border-[#1E2D4A] last:border-0 hover:bg-[#141929] transition-colors">
                  <button onClick={() => router.push(`/stock/${ticker}`)} className="flex items-center gap-4 flex-1 text-left">
                    <div className="w-10 h-10 rounded-lg bg-[#0F1526] border border-[#1E2D4A] flex items-center justify-center">
                      <span className="text-xs mono font-bold text-[#00D4FF]">{ticker.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold mono text-white">{ticker}</p>
                      {q && <p className="text-xs text-[#8899B4]">{fmtBig(q.marketCap)} cap</p>}
                    </div>
                    {loading && !q && <div className="skeleton h-8 w-24 rounded" />}
                    {q && (
                      <div className="text-right mr-4">
                        <p className="text-sm mono font-bold text-white">{fmt$(q.price)}</p>
                        <div className={clsx('flex items-center gap-1 justify-end text-xs mono font-semibold', isPos ? 'text-[#00C853]' : 'text-[#FF3860]')}>
                          {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {fmtPct(q.changesPercentage)}
                        </div>
                      </div>
                    )}
                  </button>
                  <button onClick={() => remove(ticker)}
                    className="p-2 text-[#4A5A7A] hover:text-[#FF3860] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
