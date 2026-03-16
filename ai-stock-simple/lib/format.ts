export function fmt$( v: number | null | undefined ): string {
  if (v == null || isNaN(v)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

export function fmtPct(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v)) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

export function fmtBig(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  const a = Math.abs(v)
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (a >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`
  if (a >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`
  if (a >= 1e3)  return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

export function fmtX(v: number | null | undefined): string {
  if (v == null || isNaN(v) || v <= 0) return 'N/A'
  return `${v.toFixed(1)}x`
}

export function fmtAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  return `${d}d`
}
