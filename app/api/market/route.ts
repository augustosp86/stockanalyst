import { NextResponse } from 'next/server'
import { getIndices } from '@/lib/fmp'

export async function GET() {
  try {
    const data = await getIndices()
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
