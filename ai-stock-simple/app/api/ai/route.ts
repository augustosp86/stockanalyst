import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { ticker, data, lang } = await request.json()
  const es = lang === 'es'

  const q = data?.quote
  const r = data?.ratios
  const s = data?.scores
  const inc = data?.income?.[0] ?? {}
  const incPrev = data?.income?.[1] ?? {}
  const revGrowth = incPrev.revenue
    ? (((inc.revenue - incPrev.revenue) / Math.abs(incPrev.revenue)) * 100).toFixed(1)
    : 'N/A'

  const context = `
Ticker: ${ticker} | ${data?.profile?.companyName ?? ''} | Sector: ${data?.profile?.sector ?? ''}
Precio: $${q?.price?.toFixed(2)} | Cambio: ${q?.changesPercentage?.toFixed(2)}%
P/E: ${q?.pe?.toFixed(1)} | Market Cap: $${((q?.marketCap ?? 0) / 1e9).toFixed(1)}B
Crecimiento ingresos: ${revGrowth}% | Margen neto: ${(r?.netProfitMarginTTM * 100)?.toFixed(1)}%
ROE: ${(r?.returnOnEquityTTM * 100)?.toFixed(1)}% | Deuda/Capital: ${r?.debtEquityRatioTTM?.toFixed(2)}x
Score general: ${s?.overall}/10 | Fundamentales: ${s?.fundamentals} | Crecimiento: ${s?.growth} | Salud: ${s?.financial_health}
Veredicto calculado: ${data?.verdict}
  `.trim()

  const system = es
    ? 'Eres un analista financiero experto. Análisis claro, directo y profesional. Máximo 3 párrafos cortos.'
    : 'You are an expert financial analyst. Clear, direct and professional. Maximum 3 short paragraphs.'

  const prompt = es
    ? `Analiza ${ticker} basándote en estos datos y da una conclusión de inversión clara:\n\n${context}`
    : `Analyze ${ticker} based on this data and give a clear investment conclusion:\n\n${context}`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 500,
          system,
          messages: [{ role: 'user', content: prompt }],
        })
        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(es ? 'Error al generar análisis.' : 'Error generating analysis.'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
