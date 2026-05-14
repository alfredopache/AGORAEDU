import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

type ResourceItem = {
  filename: string
  path: string
  topic: string
  sizeKb: number
}

type ResourceGroup = {
  key: string
  label: string
  note?: string
  items: Array<{
    filename: string
    topic: string
    sizeKb: number
    downloadUrl: string
  }>
}

type IndexFile = {
  label: string
  items: ResourceItem[]
}

const INDEX_BY_KEY: Record<string, string> = {
  lengua: "lengua_index.json",
  ingles: "ingles_index.json",
  matematicas: "matematicas_index.json",
  tid: "tid_index.json",
  opcion_a: "opcion_a_index.json",
  opcion_b: "opcion_b_index.json",
  opcion_c: "opcion_c_index.json",
}

const GROUP_CONFIG = {
  lengua: { label: "Lengua y Literatura" },
  ingles: { label: "Inglés" },
  matematicas: { label: "Matemáticas" },
  tid: { label: "TIC / TID" },
  opcion_a: { label: "Opción A · Humanidades y CC. Sociales" },
  opcion_b: { label: "Opción B · Tecnología" },
  opcion_c: { label: "Opción C · Ciencias" },
} as const

async function readIndex(key: keyof typeof INDEX_BY_KEY) {
  const filePath = path.join(process.cwd(), "data", "asignaturas", INDEX_BY_KEY[key])
  const raw = await fs.readFile(filePath, "utf-8")
  return JSON.parse(raw) as IndexFile
}

function buildDownloadUrl(itemPath: string) {
  return `/api/exam/official-download?path=${encodeURIComponent(itemPath)}`
}

function mapGroup(key: keyof typeof GROUP_CONFIG, items: ResourceItem[], note?: string): ResourceGroup {
  return {
    key,
    label: GROUP_CONFIG[key].label,
    note,
    items: items.map((item) => ({
      filename: item.filename.replace(/\.pdf$/i, ""),
      topic: item.topic,
      sizeKb: item.sizeKb,
      downloadUrl: buildDownloadUrl(item.path),
    })),
  }
}

function dedupeByPath(items: ResourceItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.path)) return false
    seen.add(item.path)
    return true
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const goal = searchParams.get("goal")
  const level = searchParams.get("level")
  const context = searchParams.get("context")

  try {
    const groups: ResourceGroup[] = []
    let note: string | null = null

    if (goal === "fp" && level === "gm") {
      if (context === "Ámbito de Comunicación") {
        const [lengua, ingles] = await Promise.all([readIndex("lengua"), readIndex("ingles")])
        groups.push(mapGroup("lengua", dedupeByPath(lengua.items.filter((item) => /parte com[uú]n|lengua|valenci/i.test(`${item.topic} ${item.filename}`)))))
        groups.push(mapGroup("ingles", dedupeByPath(ingles.items.filter((item) => /parte com[uú]n|ingl/i.test(`${item.topic} ${item.filename}`)))))
      } else if (context === "Ámbito Científico-Tecnológico") {
        const [matematicas, tid] = await Promise.all([readIndex("matematicas"), readIndex("tid")])
        groups.push(mapGroup("matematicas", dedupeByPath(matematicas.items)))
        groups.push(mapGroup("tid", dedupeByPath(tid.items.filter((item) => /parte com[uú]n|tic|tratamiento|digital/i.test(`${item.topic} ${item.filename}`)))))
      } else if (context === "Ámbito Social") {
        note = "Todavía no hay PDFs locales separados solo para Ámbito Social. Cuando los cargues en data/asignaturas, aparecerán aquí automáticamente."
      }
    }

    if (goal === "fp" && level === "gs") {
      if (context === "Parte común") {
        const [lengua, ingles] = await Promise.all([readIndex("lengua"), readIndex("ingles")])
        groups.push(mapGroup("lengua", dedupeByPath(lengua.items.filter((item) => /parte com[uú]n|lengua|valenci/i.test(`${item.topic} ${item.filename}`)))))
        groups.push(mapGroup("ingles", dedupeByPath(ingles.items.filter((item) => /parte com[uú]n|ingl/i.test(`${item.topic} ${item.filename}`)))))
      } else if (context === "Parte específica") {
        const [opcionA, opcionB, opcionC] = await Promise.all([readIndex("opcion_a"), readIndex("opcion_b"), readIndex("opcion_c")])
        groups.push(mapGroup("opcion_a", dedupeByPath(opcionA.items)))
        groups.push(mapGroup("opcion_b", dedupeByPath(opcionB.items)))
        groups.push(mapGroup("opcion_c", dedupeByPath(opcionC.items)))
      }
    }

    if (goal === "basico") {
      note = "Todavía no hay PDFs oficiales de Grado Básico indexados en data/asignaturas para esta vista."
    }

    if (goal === "eso") {
      note = "Esta zona muestra solo exámenes oficiales indexados. Para ESO aún no hay PDFs locales preparados para descarga aquí."
    }

    return NextResponse.json({ groups, note })
  } catch (error) {
    return NextResponse.json({ groups: [], note: null, error: String(error) }, { status: 500 })
  }
}