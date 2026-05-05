"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Zap, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MatchPair {
  left: string   // term / question side
  right: string  // answer / definition side
}

interface CableMatchProps {
  pairs: MatchPair[]               // correct pairs (left ↔ right)
  questionText?: string            // optional question prompt shown above
  onComplete: (allCorrect: boolean) => void
  onNextQuestion: () => void
}

// Cable colors matching Among Us wiring task aesthetic
const CABLE_COLORS = [
  { stroke: "#ef4444", label: "rojo",    badge: "bg-red-500" },
  { stroke: "#3b82f6", label: "azul",    badge: "bg-blue-500" },
  { stroke: "#eab308", label: "amarillo", badge: "bg-yellow-400" },
  { stroke: "#a855f7", label: "morado",  badge: "bg-purple-500" },
  { stroke: "#22c55e", label: "verde",   badge: "bg-green-500" },
  { stroke: "#f97316", label: "naranja", badge: "bg-orange-500" },
]

function useCableLines(
  containerRef: React.RefObject<HTMLDivElement | null>,
  leftRefs: React.RefObject<(HTMLButtonElement | null)[]>,
  rightRefs: React.RefObject<(HTMLButtonElement | null)[]>,
  connections: Map<number, number>
) {
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; leftIdx: number }[]
  >([])

  const measure = useCallback(() => {
    if (!containerRef.current) return
    const box = containerRef.current.getBoundingClientRect()
    const newLines: typeof lines = []

    connections.forEach((rightIdx, leftIdx) => {
      const lEl = leftRefs.current?.[leftIdx]
      const rEl = rightRefs.current?.[rightIdx]
      if (!lEl || !rEl) return
      const lRect = lEl.getBoundingClientRect()
      const rRect = rEl.getBoundingClientRect()
      newLines.push({
        x1: lRect.right - box.left,
        y1: lRect.top + lRect.height / 2 - box.top,
        x2: rRect.left - box.left,
        y2: rRect.top + rRect.height / 2 - box.top,
        leftIdx,
      })
    })
    setLines(newLines)
  }, [connections, containerRef, leftRefs, rightRefs])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  return lines
}

export function CableMatch({ pairs, questionText, onComplete, onNextQuestion }: CableMatchProps) {
  const maxItems = Math.min(pairs.length, 6)
  const activePairs = pairs.slice(0, maxItems)
  const colors = CABLE_COLORS.slice(0, maxItems)

  // Shuffled right-side order (indices into activePairs)
  const [rightOrder] = useState<number[]>(() => {
    const arr = activePairs.map((_, i) => i)
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })

  // connections: Map<leftIndex, rightSlot> where rightSlot is position in rightOrder array
  const [connections, setConnections] = useState<Map<number, number>>(new Map())
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Map<number, boolean>>(new Map())
  const [allCorrect, setAllCorrect] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([])
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([])

  const lines = useCableLines(containerRef, leftRefs, rightRefs, connections)

  // Colour assigned to each left index
  function colorForLeft(idx: number) {
    return colors[idx % colors.length]
  }

  function handleLeftClick(idx: number) {
    if (submitted) return
    setSelectedLeft((prev) => (prev === idx ? null : idx))
  }

  function handleRightClick(slot: number) {
    if (submitted) return
    if (selectedLeft === null) return

    const newConns = new Map(connections)
    // Remove any existing connection pointing to this slot
    newConns.forEach((s, l) => { if (s === slot) newConns.delete(l) })
    // Set the new connection
    newConns.set(selectedLeft, slot)
    setConnections(newConns)
    setSelectedLeft(null)
  }

  function handleRemoveConnection(leftIdx: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (submitted) return
    const newConns = new Map(connections)
    newConns.delete(leftIdx)
    setConnections(newConns)
  }

  function handleSubmit() {
    if (connections.size < activePairs.length) return
    const newResults = new Map<number, boolean>()
    connections.forEach((slot, leftIdx) => {
      // The pair at rightOrder[slot] is the actual pair
      const actualPairIdx = rightOrder[slot]
      newResults.set(leftIdx, actualPairIdx === leftIdx)
    })
    setResults(newResults)
    setSubmitted(true)
    const ok = [...newResults.values()].every((v) => v)
    setAllCorrect(ok)
    onComplete(ok)
  }

  function handleReset() {
    setConnections(new Map())
    setSelectedLeft(null)
    setSubmitted(false)
    setResults(new Map())
    setAllCorrect(false)
  }

  const svgHeight = Math.max(activePairs.length * 72, 200)

  return (
    <div className="flex flex-col gap-4">
      {questionText && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
            {questionText}
          </p>
        </div>
      )}

      {/* Instructions */}
      {!submitted && (
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          Haz clic en un elemento de la izquierda y luego en su pareja de la derecha para conectarlos con un cable.
        </p>
      )}

      {/* Cable area */}
      <div
        ref={containerRef}
        className="relative bg-slate-900 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-700"
        style={{ minHeight: svgHeight + 48 }}
      >
        {/* Background texture lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 40px)" }}
        />

        {/* SVG Cables overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            {colors.map((c, i) => (
              <filter key={i} id={`glow-${i}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {lines.map(({ x1, y1, x2, y2, leftIdx }) => {
            const color = colorForLeft(leftIdx)
            const isCorrect = results.get(leftIdx)
            const strokeColor = submitted
              ? isCorrect ? "#22c55e" : "#ef4444"
              : color.stroke

            // Bezier control points for a smooth cable curve
            const cx1 = x1 + (x2 - x1) * 0.45
            const cx2 = x2 - (x2 - x1) * 0.45
            const path = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`

            return (
              <g key={leftIdx}>
                {/* Shadow cable */}
                <path
                  d={path}
                  stroke="black"
                  strokeWidth={10}
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.4}
                />
                {/* Main cable */}
                <path
                  d={path}
                  stroke={strokeColor}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                  filter={`url(#glow-${leftIdx % colors.length})`}
                />
                {/* Highlight stripe */}
                <path
                  d={path}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="4 8"
                />
              </g>
            )
          })}
        </svg>

        {/* Left column */}
        <div className="absolute left-0 top-0 bottom-0 w-5/12 flex flex-col justify-around py-4 pl-3 pr-1 gap-2">
          {activePairs.map((pair, idx) => {
            const color = colorForLeft(idx)
            const isConnected = connections.has(idx)
            const isSelected = selectedLeft === idx
            const isCorrect = results.get(idx)

            return (
              <button
                key={idx}
                ref={(el) => { leftRefs.current[idx] = el }}
                onClick={() => handleLeftClick(idx)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all border-2 text-sm font-medium",
                  isSelected
                    ? "border-white bg-white/20 text-white shadow-lg scale-105"
                    : isConnected
                    ? "border-opacity-60 bg-slate-800 text-white border-slate-600"
                    : "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200",
                  submitted && isCorrect === true && "border-green-500 bg-green-900/30",
                  submitted && isCorrect === false && "border-red-500 bg-red-900/30",
                )}
              >
                {/* Color indicator */}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20"
                  style={{ backgroundColor: color.stroke }}
                />
                <span className="flex-1 line-clamp-2 leading-tight">{pair.left}</span>
                {/* Spark / connector dot */}
                <span
                  className="absolute right-0 translate-x-1/2 w-4 h-4 rounded-full ring-2 ring-slate-900 flex-shrink-0"
                  style={{ backgroundColor: color.stroke }}
                />
                {isConnected && !submitted && (
                  <button
                    className="absolute -top-1.5 -right-1.5 bg-slate-700 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] z-10 transition-colors"
                    onClick={(e) => handleRemoveConnection(idx, e)}
                    title="Quitar conexión"
                  >
                    ×
                  </button>
                )}
              </button>
            )
          })}
        </div>

        {/* Right column */}
        <div className="absolute right-0 top-0 bottom-0 w-5/12 flex flex-col justify-around py-4 pr-3 pl-1 gap-2">
          {rightOrder.map((pairIdx, slot) => {
            const pair = activePairs[pairIdx]
            const color = colorForLeft(pairIdx)
            // Is this slot connected by any left item?
            let connectedLeftIdx: number | null = null
            connections.forEach((s, l) => { if (s === slot) connectedLeftIdx = l })
            const isConnected = connectedLeftIdx !== null
            const isCorrect = submitted && connectedLeftIdx !== null ? results.get(connectedLeftIdx) : undefined

            return (
              <button
                key={slot}
                ref={(el) => { rightRefs.current[slot] = el }}
                onClick={() => handleRightClick(slot)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-right justify-end transition-all border-2 text-sm font-medium",
                  isConnected
                    ? "border-opacity-60 bg-slate-800 text-white border-slate-600"
                    : "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200",
                  selectedLeft !== null && !isConnected && "ring-2 ring-white/40",
                  submitted && isCorrect === true && "border-green-500 bg-green-900/30",
                  submitted && isCorrect === false && "border-red-500 bg-red-900/30",
                )}
              >
                {/* Connector dot on left */}
                <span
                  className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full ring-2 ring-slate-900 flex-shrink-0"
                  style={{ backgroundColor: isConnected && connectedLeftIdx !== null ? colorForLeft(connectedLeftIdx).stroke : "#64748b" }}
                />
                <span className="flex-1 line-clamp-2 leading-tight">{pair.right}</span>
                <span className="w-3 h-3 rounded-full flex-shrink-0 opacity-50"
                  style={{ backgroundColor: "#64748b" }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        {!submitted ? (
          <>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
            <button
              onClick={handleSubmit}
              disabled={connections.size < activePairs.length}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
            >
              <Zap className="w-4 h-4" />
              Verificar ({connections.size}/{activePairs.length})
            </button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between w-full gap-3"
            >
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold",
                allCorrect
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              )}>
                {allCorrect
                  ? <><CheckCircle2 className="w-4 h-4" /> ¡Perfecto! Todas correctas</>
                  : <><XCircle className="w-4 h-4" /> Algunas conexiones incorrectas</>
                }
              </div>
              <div className="flex gap-2">
                {!allCorrect && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reintentar
                  </button>
                )}
                <button
                  onClick={onNextQuestion}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
                >
                  Siguiente →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Result breakdown (when submitted) */}
      {submitted && (
        <div className="space-y-2">
          {activePairs.map((pair, idx) => {
            const isCorrect = results.get(idx)
            const slot = connections.get(idx)
            const givenRight = slot !== undefined ? activePairs[rightOrder[slot]].right : "(sin respuesta)"
            return (
              <div key={idx} className={cn(
                "flex items-start gap-3 p-3 rounded-xl text-sm border",
                isCorrect
                  ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-600/30"
                  : "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-600/30"
              )}>
                {isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{pair.left}</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Tu respuesta: <span className={isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400 line-through"}>{givenRight}</span>
                    {!isCorrect && <span className="text-green-600 dark:text-green-400 ml-2">→ {pair.right}</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- Detection helpers (exported for exam-mode use) ----

const MATCH_KEYWORDS = [
  "relaciona", "empareja", "emparejar", "relacionar",
  "une cada", "une con", "conecta cada", "conecta con",
  "une los siguientes", "relaciona cada",
]

export function isMatchingQuestion(question: string, topic?: string): boolean {
  const text = `${question} ${topic ?? ""}`.toLowerCase()
  return MATCH_KEYWORDS.some((kw) => text.includes(kw))
}

const SEPARATORS = [" → ", " - ", ": ", " = ", " | "]

export function extractMatchPairsFromOptions(
  options: Array<{ text: string; isCorrect: boolean }>
): MatchPair[] | null {
  if (!options || options.length < 2) return null

  for (const sep of SEPARATORS) {
    const parsed = options.map((opt) => {
      const idx = opt.text.indexOf(sep)
      if (idx === -1) return null
      return { left: opt.text.slice(0, idx).trim(), right: opt.text.slice(idx + sep.length).trim() }
    })
    if (parsed.every(Boolean)) return parsed as MatchPair[]
  }

  return null
}
