"use client"

import { useEffect, useMemo, useRef, useState } from "react"

interface PdfReferenceImageProps {
  pdfUrl: string
  token: string
  questionText?: string
  textReference?: string
  alt: string
}

interface PageCandidate {
  pageNumber: number
  text: string
  imagePaintCount: number
}

interface TextContentItemLike {
  str?: string
}

interface RenderTaskLike {
  promise: Promise<void>
  cancel?: () => void
}

interface LoadingTaskLike {
  promise: Promise<unknown>
  destroy?: () => void
}

const STOPWORDS = new Set([
  "ante",
  "bajo",
  "cabe",
  "cada",
  "como",
  "con",
  "contra",
  "cual",
  "cuales",
  "cuando",
  "datos",
  "de",
  "del",
  "desde",
  "donde",
  "dos",
  "el",
  "ella",
  "ellas",
  "ellos",
  "en",
  "entre",
  "era",
  "es",
  "esa",
  "ese",
  "eso",
  "esta",
  "este",
  "esto",
  "fuentes",
  "hay",
  "imagen",
  "imagenes",
  "integrar",
  "la",
  "las",
  "los",
  "mas",
  "mixta",
  "muy",
  "original",
  "para",
  "parte",
  "pero",
  "por",
  "pregunta",
  "preguntas",
  "proceso",
  "que",
  "real",
  "referencia",
  "responder",
  "se",
  "segun",
  "si",
  "sin",
  "sobre",
  "solo",
  "son",
  "su",
  "sus",
  "texto",
  "una",
  "usar",
  "visual",
  "y",
])

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function parseToken(token: string) {
  const match = token.match(/Q(\d+)([A-Z])?/i)
  return {
    questionNumber: match ? Number(match[1]) : null,
    subpart: match?.[2] ? match[2].toLowerCase() : null,
  }
}

function extractKeywords(questionText?: string, textReference?: string) {
  const cleaned = normalizeText(`${questionText || ""} ${textReference || ""}`)
    .replace(/\[req_image:[^\]]+\]/gi, " ")
    .replace(/gm_\d{4}_[a-z_0-9]+/gi, " ")

  const words = cleaned
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4)
    .filter((word) => !STOPWORDS.has(word))

  return [...new Set(words)].slice(0, 14)
}

function hasQuestionMarker(text: string, questionNumber: number | null) {
  if (questionNumber === null) return false
  return [
    new RegExp(`(?:^|\\s)${questionNumber}\\s*[).:-]`),
    new RegExp(`pregunta\\s+${questionNumber}`),
    new RegExp(`${questionNumber}\\.1\\s*[).:-]`),
  ].some((pattern) => pattern.test(text))
}

function hasSubpartMarker(text: string, subpart: string | null) {
  if (!subpart) return false
  return [
    new RegExp(`(?:^|\\s)${subpart}\\s*[).:-]`),
    new RegExp(`${subpart}\\.`),
  ].some((pattern) => pattern.test(text))
}

function countKeywordHits(text: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0)
}

function countImageHints(text: string) {
  const hints = [
    "fuente",
    "grafico",
    "grafica",
    "fotografia",
    "fotografias",
    "imagen",
    "imagenes",
    "mapa",
    "esquema",
    "tabla",
    "flecha",
    "commons",
  ]

  return hints.reduce((total, hint) => total + (text.includes(hint) ? 1 : 0), 0)
}

function scorePage(
  candidate: PageCandidate,
  index: number,
  pages: PageCandidate[],
  questionNumber: number | null,
  subpart: string | null,
  keywords: string[],
) {
  let score = 0
  const previous = index > 0 ? pages[index - 1] : null
  const questionMarker = hasQuestionMarker(candidate.text, questionNumber)
  const previousQuestionMarker = previous ? hasQuestionMarker(previous.text, questionNumber) : false
  const subpartMarker = hasSubpartMarker(candidate.text, subpart)
  const keywordHits = countKeywordHits(candidate.text, keywords)
  const imageHints = countImageHints(candidate.text)

  score += candidate.imagePaintCount * 8
  score += keywordHits * 2.5
  score += imageHints * 1.5

  if (questionMarker) score += 10
  if (subpartMarker) score += 10
  if (previousQuestionMarker && candidate.imagePaintCount > 0) score += 8
  if (previous && /muestran|muestra|observe|observa|a continuacion|presentad[ao]s?|siguiente|fotograf|imagen|grafico|esquema|mapa/.test(previous.text) && candidate.imagePaintCount > 0) {
    score += 8
  }
  if (subpart && previousQuestionMarker && candidate.text.length < 800) score += 3
  if (!subpart && previousQuestionMarker && keywordHits > 0) score += 4
  if (candidate.imagePaintCount === 0) score -= 2

  return score
}

function trimCanvasWhitespace(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) return

  const { width, height } = canvas
  const image = context.getImageData(0, 0, width, height)
  const { data } = image
  const isBlankPixel = (offset: number) => data[offset] > 247 && data[offset + 1] > 247 && data[offset + 2] > 247
  const isBlankRow = (row: number) => {
    for (let column = 0; column < width; column += 1) {
      const offset = (row * width + column) * 4
      if (!isBlankPixel(offset)) return false
    }
    return true
  }
  const isBlankColumn = (column: number) => {
    for (let row = 0; row < height; row += 1) {
      const offset = (row * width + column) * 4
      if (!isBlankPixel(offset)) return false
    }
    return true
  }

  let top = 0
  let bottom = height - 1
  let left = 0
  let right = width - 1

  while (top < bottom && isBlankRow(top)) top += 1
  while (bottom > top && isBlankRow(bottom)) bottom -= 1
  while (left < right && isBlankColumn(left)) left += 1
  while (right > left && isBlankColumn(right)) right -= 1

  const trimmedWidth = right - left + 1
  const trimmedHeight = bottom - top + 1
  if (trimmedWidth <= 0 || trimmedHeight <= 0 || (trimmedWidth === width && trimmedHeight === height)) {
    return
  }

  const padding = 12
  const sourceX = Math.max(0, left - padding)
  const sourceY = Math.max(0, top - padding)
  const sourceWidth = Math.min(width - sourceX, trimmedWidth + padding * 2)
  const sourceHeight = Math.min(height - sourceY, trimmedHeight + padding * 2)
  const trimmed = context.getImageData(sourceX, sourceY, sourceWidth, sourceHeight)

  canvas.width = sourceWidth
  canvas.height = sourceHeight
  context.putImageData(trimmed, 0, 0)
}

function getTextFromContentItems(items: unknown[]) {
  return items
    .map((item) => {
      if (typeof item === "object" && item !== null && "str" in item) {
        return (item as TextContentItemLike).str || ""
      }
      return ""
    })
    .join(" ")
}

export function PdfReferenceImage({ pdfUrl, token, questionText, textReference, alt }: PdfReferenceImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pageUrl, setPageUrl] = useState(pdfUrl)
  const parsedToken = useMemo(() => parseToken(token), [token])
  const keywords = useMemo(() => extractKeywords(questionText, textReference), [questionText, textReference])

  useEffect(() => {
    let isCancelled = false
    let activeRenderTask: RenderTaskLike | null = null
    let activeLoadingTask: LoadingTaskLike | null = null

    const renderReference = async () => {
      setStatus("loading")
      setErrorMessage(null)

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
        const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`

        if (pdfjs.GlobalWorkerOptions.workerSrc !== workerUrl) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        }

        const loadingTask = pdfjs.getDocument({ url: pdfUrl })
        activeLoadingTask = loadingTask
        const pdf = await loadingTask.promise
        const candidates: PageCandidate[] = []
        const imageOps = new Set([
          pdfjs.OPS.paintImageXObject,
          pdfjs.OPS.paintInlineImageXObject,
          pdfjs.OPS.paintImageMaskXObject,
          pdfjs.OPS.paintInlineImageXObjectGroup,
        ])

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber)
          const textContent = await page.getTextContent()
          const operatorList = await page.getOperatorList()
          const imagePaintCount = operatorList.fnArray.reduce((total, fn) => total + (imageOps.has(fn) ? 1 : 0), 0)

          candidates.push({
            pageNumber,
            text: normalizeText(getTextFromContentItems(textContent.items)),
            imagePaintCount,
          })
        }

        const target = candidates.reduce(
          (best, candidate, index) => {
            const nextScore = scorePage(candidate, index, candidates, parsedToken.questionNumber, parsedToken.subpart, keywords)
            if (nextScore > best.score) {
              return { candidate, score: nextScore }
            }
            return best
          },
          { candidate: candidates[0], score: Number.NEGATIVE_INFINITY },
        ).candidate

        const page = await pdf.getPage(target.pageNumber)
        const viewport = page.getViewport({ scale: 2 })
        const scratchCanvas = document.createElement("canvas")
        const scratchContext = scratchCanvas.getContext("2d", { alpha: false })

        if (!scratchContext) {
          throw new Error("No se pudo crear el canvas para renderizar la referencia")
        }

        scratchCanvas.width = Math.ceil(viewport.width)
        scratchCanvas.height = Math.ceil(viewport.height)
        scratchContext.fillStyle = "#ffffff"
        scratchContext.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height)

        const renderTask = page.render({
          canvas: scratchCanvas,
          canvasContext: scratchContext,
          viewport,
        })

        activeRenderTask = renderTask

        await renderTask.promise

        if (isCancelled) {
          return
        }

        trimCanvasWhitespace(scratchCanvas)

        const canvas = canvasRef.current
        if (!canvas) {
          return
        }

        const context = canvas.getContext("2d", { alpha: false })
        if (!context) {
          throw new Error("No se pudo preparar el canvas visible")
        }

        canvas.width = scratchCanvas.width
        canvas.height = scratchCanvas.height
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(scratchCanvas, 0, 0)

        setPageUrl(`${pdfUrl}#page=${target.pageNumber}`)
        setStatus("ready")
      } catch (error) {
        if (!isCancelled) {
          setStatus("error")
          setErrorMessage(error instanceof Error ? error.message : "No se pudo extraer la imagen del examen")
        }
      }
    }

    renderReference()

    return () => {
      isCancelled = true
      activeRenderTask?.cancel?.()
      activeLoadingTask?.destroy?.()
    }
  }, [keywords, parsedToken.questionNumber, parsedToken.subpart, pdfUrl])

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      {status === "loading" ? (
        <div className="flex min-h-[240px] items-center justify-center px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
          Extrayendo la imagen de la pregunta desde el examen oficial...
        </div>
      ) : null}

      {status === "error" ? (
        <div className="p-4 text-sm text-slate-600 dark:text-slate-400">
          <p>No se pudo extraer la imagen automáticamente.</p>
          {errorMessage ? <p className="mt-2 text-xs opacity-80">{errorMessage}</p> : null}
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        aria-label={alt}
        className={status === "ready" ? "block h-auto w-full" : "hidden"}
      />

      <div className="flex justify-end border-t border-slate-200 px-4 py-2 dark:border-slate-800">
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-purple-600 dark:text-purple-300 hover:underline"
        >
          Abrir página original ↗
        </a>
      </div>
    </div>
  )
}