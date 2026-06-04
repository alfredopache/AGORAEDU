import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

type ResourceItem = {
  filename: string
  path: string
  topic: string
  sizeKb: number
  year?: number | null
}

type ResourceGroup = {
  key: string
  label: string
  note?: string
  grade?: "gm" | "gs" | "basico"
  items: Array<{
    filename: string
    topic: string
    sizeKb: number
    downloadUrl: string
    year?: number | null
  }>
}

/** Extract a 4-digit exam year from a filename. Returns null if not found. */
function extractYear(filename: string): number | null {
  // Try 4-digit year first (e.g. "2017", "2024")
  const fourDigit = filename.match(/\b(20\d{2})\b/)
  if (fourDigit) return parseInt(fourDigit[1], 10)
  // Try 2-digit suffix typical of Spanish exam PDFs: "_17", " 17", "17.pdf"
  const twoDigit = filename.match(/[\s_-](\d{2})(?:[\s_.)]|$)/i)
  if (twoDigit) {
    const y = parseInt(twoDigit[1], 10)
    if (y >= 15 && y <= 35) return 2000 + y
  }
  return null
}

function itemYear(item: ResourceItem): number | null {
  return item.year ?? extractYear(item.filename) ?? extractYear(item.topic)
}

function sortByYear(items: ResourceItem[]): ResourceItem[] {
  return [...items].sort((a, b) => {
    const ya = itemYear(a)
    const yb = itemYear(b)
    if (ya !== null && yb !== null) return ya - yb
    if (ya !== null) return -1
    if (yb !== null) return 1
    return a.filename.localeCompare(b.filename)
  })
}

type IndexFile = {
  label: string
  items: ResourceItem[]
}

const INDEX_BY_KEY = {
  lengua: "lengua_index.json",
  ingles: "ingles_index.json",
  matematicas: "matematicas_index.json",
  tid: "tid_index.json",
  opcion_a: "opcion_a_index.json",
  opcion_b: "opcion_b_index.json",
  opcion_c: "opcion_c_index.json",
} as const

type IndexKey = keyof typeof INDEX_BY_KEY

const GROUP_CONFIG = {
  lengua: { label: "Lengua y Literatura" },
  ingles: { label: "Inglés" },
  matematicas: { label: "Matemáticas" },
  tid: { label: "TIC / TID" },
  opcion_a: { label: "Opción A · Humanidades y CC. Sociales" },
  opcion_b: { label: "Opción B · Tecnología" },
  opcion_c: { label: "Opción C · Ciencias" },
} as const

const BASICO_GROUPS = {
  "Ámbito lingüístico-social": ["lengua", "ingles", "opcion_a"],
  "Ámbito científico-tecnológico": ["matematicas", "tid", "opcion_b", "opcion_c"],
} as const satisfies Record<string, IndexKey[]>

async function readIndex(key: IndexKey) {
  const filePath = path.join(process.cwd(), "data", "asignaturas", INDEX_BY_KEY[key])
  const raw = await fs.readFile(filePath, "utf-8")
  return JSON.parse(raw) as IndexFile
}

function buildDownloadUrl(itemPath: string) {
  return `/api/exam/official-download?path=${encodeURIComponent(itemPath)}`
}

function mapGroup(key: IndexKey, items: ResourceItem[], note?: string, grade?: "gm" | "gs" | "basico"): ResourceGroup {
  const sorted = sortByYear(items)
  return {
    key,
    label: GROUP_CONFIG[key].label,
    note,
    grade,
    items: sorted.map((item) => ({
      filename: item.filename.replace(/\.pdf$/i, ""),
      topic: item.topic,
      sizeKb: item.sizeKb,
      downloadUrl: buildDownloadUrl(item.path),
      year: itemYear(item),
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

async function loadGroups(keys: IndexKey[], grade?: "gm" | "gs" | "basico") {
  const entries = await Promise.all(
    keys.map(async (key) => {
      const index = await readIndex(key)
      return mapGroup(key, dedupeByPath(index.items), undefined, grade)
    })
  )

  return entries.filter((group) => group.items.length > 0)
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
        groups.push(mapGroup("lengua", dedupeByPath(lengua.items.filter((item) => /parte com[uú]n|lengua|valenci/i.test(`${item.topic} ${item.filename}`))), undefined, "gm"))
        groups.push(mapGroup("ingles", dedupeByPath(ingles.items.filter((item) => /parte com[uú]n|ingl/i.test(`${item.topic} ${item.filename}`))), undefined, "gm"))
      } else if (context === "Ámbito Científico-Tecnológico") {
        const [matematicas, tid] = await Promise.all([readIndex("matematicas"), readIndex("tid")])
        groups.push(mapGroup("matematicas", dedupeByPath(matematicas.items), undefined, "gm"))
        groups.push(mapGroup("tid", dedupeByPath(tid.items.filter((item) => /parte com[uú]n|tic|tratamiento|digital/i.test(`${item.topic} ${item.filename}`))), undefined, "gm"))
      } else if (context === "Ámbito Social") {
        note = "Todavía no hay PDFs locales separados solo para Ámbito Social. Cuando los cargues en data/asignaturas, aparecerán aquí automáticamente."
      }
    }

    if (goal === "fp" && level === "gs") {
      if (context === "Parte común") {
        const [lengua, ingles] = await Promise.all([readIndex("lengua"), readIndex("ingles")])
        groups.push(mapGroup("lengua", dedupeByPath(lengua.items.filter((item) => /parte com[uú]n|lengua|valenci/i.test(`${item.topic} ${item.filename}`))), undefined, "gs"))
        groups.push(mapGroup("ingles", dedupeByPath(ingles.items.filter((item) => /parte com[uú]n|ingl/i.test(`${item.topic} ${item.filename}`))), undefined, "gs"))
      } else if (context === "Parte específica") {
        const [opcionA, opcionB, opcionC] = await Promise.all([readIndex("opcion_a"), readIndex("opcion_b"), readIndex("opcion_c")])
        groups.push(mapGroup("opcion_a", dedupeByPath(opcionA.items), undefined, "gs"))
        groups.push(mapGroup("opcion_b", dedupeByPath(opcionB.items), undefined, "gs"))
        groups.push(mapGroup("opcion_c", dedupeByPath(opcionC.items), undefined, "gs"))
      }
    }

    if (goal === "basico") {
      if (context === "Ámbito lingüístico-social" || context === "Ámbito científico-tecnológico") {
        groups.push(...await loadGroups(BASICO_GROUPS[context], "basico"))
        note = "Material oficial agrupado por ámbito a partir de los PDFs indexados que ya tienes en la biblioteca local."
      } else {
        note = "Selecciona un ámbito para ver el material relacionado disponible."
      }
    }

    if (goal === "eso") {
      note = "Esta zona muestra solo exámenes oficiales indexados. Para ESO aún no hay PDFs locales preparados para descarga aquí."
    }

    return NextResponse.json({ groups, note })
  } catch (error) {
    return NextResponse.json({ groups: [], note: null, error: String(error) }, { status: 500 })
  }
}