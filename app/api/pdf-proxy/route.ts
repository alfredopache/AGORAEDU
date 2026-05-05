import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Se requiere el parámetro url' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/pdf,*/*',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Error al obtener PDF: ${response.status}` }, { status: response.status })
    }

    const body = await response.arrayBuffer()
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo obtener el PDF', detail: String(error) }, { status: 500 })
  }
}
