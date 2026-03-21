import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('Error: ANTHROPIC_API_KEY no configurada', { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey })
  const { ticker, data, lang } = await request.json()

  const q = data?.quote
  const s = data?.scores
  const p = data?.profile

  const context = `
Ticker: ${ticker} | ${p?.companyName ?? ''} | Sector: ${p?.sector ?? ''}
Precio: $${q?.price?.toFixed(2)} | Cambio: ${q?.changesPercentage?.toFixed(2)}%
Market Cap: $${((q?.marketCap ?? 0) / 1e9).toFixed(1)}B
Score general: ${s?.overall}/10 | Veredicto: ${data?.verdict}
P/E: ${q?.pe?.toFixed(1) ?? 'N/A'} | Beta: ${q?.beta?.toFixed(2) ?? 'N/A'}
`.trim()

  const system = lang === 'es'
    ? 'Eres un analista financiero experto. Análisis claro, directo y profesional. Máximo 3 párrafos cortos.'
    : 'You are an expert financial analyst. Clear, direct and professional. Maximum 3 short paragraphs.'

  const prompt = lang === 'es'
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
      } catch (err: any) {
        console.error('Anthropic error:', err?.message)
        controller.enqueue(encoder.encode(lang === 'es'
          ? 'Error al conectar con el servicio de IA.'
          : 'Error connecting to AI service.'
        ))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
