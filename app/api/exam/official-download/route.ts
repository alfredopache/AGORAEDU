import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

function toSafeRelativePath(rawPath: string) {
  const normalized = rawPath.replace(/\\/g, "/")
  if (!normalized.startsWith("data/asignaturas/")) return null
  if (normalized.includes("..")) return null
  return normalized
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileParam = searchParams.get("path")

  if (!fileParam) {
    return NextResponse.json({ error: "Falta el parámetro path" }, { status: 400 })
  }

  const safePath = toSafeRelativePath(fileParam)
  if (!safePath) {
    return NextResponse.json({ error: "Ruta no permitida" }, { status: 400 })
  }

  try {
    const absolutePath = path.join(process.cwd(), safePath)
    const fileBuffer = await fs.readFile(absolutePath)
    const fileName = path.basename(absolutePath)

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "No se pudo abrir el PDF", detail: String(error) }, { status: 404 })
  }
}