import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getYouTubeThumbnail = (url: string) => {
  if (!url) return "/placeholder.svg";
  
  // Si la URL no contiene youtube o youtu.be, devolvemos el placeholder 
  // (esto evita que la RegExp falle o devuelva cosas raras con archivos locales)
  if (!url.includes('youtube') && !url.includes('youtu.be')) {
    return "/placeholder.svg";
  }

  const regExp = /^.*(embed\/|v\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  
  return videoId 
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
    : "/placeholder.svg";
};

export const MAX_REDACTION_WORDS = 250
export const MAX_REDACTION_LINES = 12

export function getWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function getLineCount(text: string) {
  return text === "" ? 0 : text.split(/\r\n|\r|\n/).length
}

export function clampRedactionText(text: string, maxWords: number, maxLines: number) {
  const lines = text.split(/\r\n|\r|\n/).slice(0, maxLines)
  const joined = lines.join("\n")
  const tokens = joined.trim().split(/\s+/).filter(Boolean)
  if (tokens.length <= maxWords) return joined
  return tokens.slice(0, maxWords).join(" ")
}

export function formatExamSource(src?: { name?: string | null; year?: string | number | null; url?: string | null }) {
  if (!src) return { label: 'Desconocida', url: null }

  const name = String(src.name || '').toUpperCase()
  const year = src.year ? String(src.year) : null
  const url = src.url || null

  const VALENCIA_LABELS: Record<string, string> = {
    '2017': 'GM 2017 — Prueba de Acceso (parte común)',
    '2018': 'GM 2018 — Prueba de Acceso (parte común)',
    '2019': 'GM 2019 — Prueba de Acceso (parte común)',
    '2020': 'GM 2020 — Prueba de Acceso (parte común)',
    '2021': 'GM 2021 — Prueba de Acceso (parte común)',
    '2022': 'GM 2022 — Prueba de Acceso (parte común)',
    '2023': 'GM 2023 — Prueba de Acceso (parte común)',
    '2024': 'GM 2024 — Prueba de Acceso (parte común)',
    '2025': 'JUNTOS GM 2025 — Documentación / partes (GM 2025)',
  }

  const VALENCIA_PDFS: Record<string, string> = {
    '2017': 'https://ceice.gva.es/documents/388109149/391038839/GM_2017.pdf',
    '2018': 'https://ceice.gva.es/documents/388109149/391038839/GM_2018.pdf',
    '2019': 'https://ceice.gva.es/documents/388109149/391038839/GM_2019.pdf',
    '2020': 'https://ceice.gva.es/documents/388109149/391038839/GM_2020.pdf',
    '2021': 'https://ceice.gva.es/documents/388109149/391038839/GM_2021.pdf',
    '2022': 'https://ceice.gva.es/documents/388109149/391038839/GM_2022.pdf',
    '2023': 'https://ceice.gva.es/documents/388109149/391038839/GM_2023.pdf',
    '2024': 'https://ceice.gva.es/documents/388109149/391038839/GM_2024.pdf',
    '2025': 'https://ceice.gva.es/documents/388109149/0/JUNTOS+GM+2025.pdf/eaff2543-5199-f592-6af1-aa689a78ea67',
  }

  const fallbackUrl = year && VALENCIA_PDFS[year] ? VALENCIA_PDFS[year] : null
  const finalUrl = url || fallbackUrl

  // Si la fuente indica REAL_PDF y tenemos año, preferimos la etiqueta oficial
  if (name.includes('REAL_PDF') && year) {
    const label = VALENCIA_LABELS[year] || `REAL_PDF — ${year}`
    return { label, url: finalUrl }
  }

  // Si la fuente indica una referencia oficial y tenemos año, mantenemos el nombre con año
  if (name.includes('REFERENCIA_EXAMEN') && year) {
    const label = `REFERENCIA_EXAMEN — ${year}`
    return { label, url: finalUrl }
  }

  // Si el URL contiene un patrón conocido de GM_xxxx.pdf, extraer año
  if (url) {
    const m = url.match(/GM[_-]?(\d{4})/i)
    if (m && m[1]) {
      const y = m[1]
      const label = VALENCIA_LABELS[y] || `GM ${y} — Prueba de Acceso`
      return { label, url }
    }
  }

  // Fallback: mostrar nombre y año si existen
  const fallbackLabel = src.name ? `${src.name}${year ? ` — ${year}` : ''}` : `Fuente ${year || ''}`
  return { label: fallbackLabel, url }
}
