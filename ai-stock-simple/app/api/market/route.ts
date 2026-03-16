import { NextResponse } from 'next/server'
import { getGainersLosers, getSectorPerformance } from '@/lib/fmp'

export async function GET() {
  try {
    const [movers, sectors] = await Promise.allSettled([
      getGainersLosers(),
      getSectorPerformance(),
    ])

    // Fear & Greed from CNN
    let fearGreed = { value: 50, rating: 'Neutral' }
    try {
      const fg = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
        next: { revalidate: 300 }
      })
      if (fg.ok) {
        const fgData = await fg.json()
        fearGreed = {
          value: Math.round(fgData?.fear_and_greed?.score ?? 50),
          rating: fgData?.fear_and_greed?.rating ?? 'Neutral',
        }
      }
    } catch {}

    return NextResponse.json({
      movers: movers.status === 'fulfilled' ? movers.value : { gainers: [], losers: [], active: [] },
      sectors: sectors.status === 'fulfilled' ? sectors.value : [],
      fearGreed,
      marketOpen: isMarketOpen(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

function isMarketOpen(): boolean {
  const now = new Date()
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = ny.getDay()
  const hour = ny.getHours()
  const min = ny.getMinutes()
  const time = hour * 60 + min
  if (day === 0 || day === 6) return false
  return time >= 570 && time <= 960 // 9:30 - 16:00
}
