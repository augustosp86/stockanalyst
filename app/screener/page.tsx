'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Filter } from 'lucide-react'
import { fmt$, fmtPct, fmtBig, fmtX } from '@/lib/format'
import { clsx } from 'clsx'

const SECTORS = [
  'Technology','Healthcare','Financial Services','Consumer Cyclical',
  'Communication Services','Industrials','Consumer Defensive',
  'Energy','Real Estate','Utilities','Basic Materials'
]

export default function ScreenerPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    marketCapMoreThan: '', peRatioLowerThan: '', sector: '', limit: '30'
  })
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const set = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }))

  async function search() {
    setLoading(true); setSearched(true)
    const params = new URLSearchParams()
    if (filters.marketCapMoreThan) params.set('marketCapMoreThan', filters.marketCapMoreThan)
    if (filters.peRatioLowerThan) params.set('peLowerThan', filters.peRatioLowerThan)
    if (filters.sector) params.set('sector', filters.sector)
    params.set('limit', filters.limit)
    params.set('isEtf', 'false')
    params.set('isActivelyTrading', 'true')
    const KEY = '' // handled server-side
    const res = await fetch(`/api/screener?${params.toString()}`)
    const data = await res.json()
    setResults(data ?? [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="border-b border-[#1E2D4A] bg-[#0F1526] px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-[#4A5A7A] hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <Filter size={16} className="text-[#00D4FF]" />
          <h1 className="text-lg font-bold text-white">Screener de Acciones</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-[#8899B4] mb-1.5">Market Cap mínimo</label>
              <select value={filters.marketCapMoreThan} onChange={e => set('marketCapMoreThan', e.target.value)}
                className="w-full bg-[#0F1526] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00D4FF] outline-none">
                <option value="">Cualquiera</option>
                <option value="1000000000">Small cap (+$1B)</option>
                <option value="10000000000">Mid cap (+$10B)</option>
                <option value="100000000000">Large cap (+$100B)</option>
                <option value="500000000000">Mega cap (+$500B)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8899B4] mb-1.5">P/E máximo</label>
              <select value={filters.peRatioLowerThan} onChange={e => set('peRatioLowerThan', e.target.value)}
                className="w-full bg-[#0F1526] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00D4FF] outline-none">
                <option value="">Cualquiera</option>
                <option value="15">Menos de 15x</option>
                <option value="20">Menos de 20x</option>
                <option value="30">Menos de 30x</option>
                <option value="50">Menos de 50x</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8899B4] mb-1.5">Sector</label>
              <select value={filters.sector} onChange={e => set('sector', e.target.value)}
                className="w-full bg-[#0F1526] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00D4FF] outline-none">
                <option value="">Todos</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8899B4] mb-1.5">Resultados</label>
              <select value={filters.limit} onChange={e => set('limit', e.target.value)}
                className="w-full bg-[#0F1526] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00D4FF] outline-none">
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={search} disabled={loading}
              className="px-6 py-2 bg-[#00D4FF] text-[#0A0E1A] font-bold text-sm rounded-lg hover:bg-[#00B8DD] transition-colors disabled:opacity-50">
              {loading ? 'Buscando…' : 'Buscar acciones'}
            </button>
            <button onClick={() => { setFilters({ marketCapMoreThan: '', peRatioLowerThan: '', sector: '', limit: '30' }); setResults([]); setSearched(false) }}
              className="px-4 py-2 bg-[#141929] border border-[#1E2D4A] text-[#8899B4] text-sm rounded-lg hover:text-white transition-colors">
              Limpiar
            </button>
          </div>
        </div>

        {loading && (
          <div className="card overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-[#1E2D4A]">
                {Array.from({ length: 6 }).map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16 text-[#4A5A7A]">Sin resultados para esos filtros</div>
        )}

        {!loading && results.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1E2D4A]">
              <span className="text-sm text-[#8899B4]">{results.length} acciones encontradas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2D4A]">
                    {['Ticker','Empresa','Sector','Precio','Cambio','Market Cap','P/E'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#8899B4] uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((s: any) => (
                    <tr key={s.symbol} onClick={() => router.push(`/stock/${s.symbol}`)}
                      className="border-b border-[#1E2D4A] hover:bg-[#141929] cursor-pointer transition-colors">
                      <td className="px-4 py-3 mono font-bold text-[#00D4FF]">{s.symbol}</td>
                      <td className="px-4 py-3 text-white max-w-[160px]"><span className="truncate block">{s.companyName}</span></td>
                      <td className="px-4 py-3 text-[#8899B4] text-xs">{s.sector}</td>
                      <td className="px-4 py-3 mono text-white">{fmt$(s.price)}</td>
                      <td className={clsx('px-4 py-3 mono font-semibold', (s.changePercentage || 0) >= 0 ? 'text-[#00C853]' : 'text-[#FF3860]')}>
                        {fmtPct(s.changePercentage || 0)}
                      </td>
                      <td className="px-4 py-3 mono text-[#8899B4]">{fmtBig(s.marketCap)}</td>
                      <td className="px-4 py-3 mono text-[#8899B4]">{fmtX(s.peRatio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
