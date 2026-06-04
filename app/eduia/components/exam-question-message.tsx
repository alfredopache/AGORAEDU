"use client"

import { BookOpen, Lightbulb, CheckCircle2, HelpCircle, Languages } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type ExamQuestionItem,
  parseOptions,
  parseExamQuestionsFromText,
} from "@/lib/exam-question-format"

interface ExamQuestionMessageProps {
  questions?: ExamQuestionItem[]
  content?: string
  source?: string
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"]

type SubjectTheme = "ingles" | "sociales" | "matematicas" | "lengua" | "default"

function detectTheme(question: ExamQuestionItem): SubjectTheme {
  const hint = `${question.tema || ""} ${question.alias || ""} ${question.titulo || ""} ${question.pregunta || ""}`.toLowerCase()
  if (/ingl[eé]s|english|foreign|extranjera/.test(hint)) return "ingles"
  if (/geograf|historia|sociales/.test(hint)) return "sociales"
  if (/matem|ecuaci|geometr|álgebra|algebra/.test(hint)) return "matematicas"
  if (/lengua|literatura|gramát|gramat/.test(hint)) return "lengua"
  return "default"
}

const THEME_STYLES: Record<SubjectTheme, {
  badge: string
  number: string
  optionLetter: string
  optionHover: string
  titleAccent: string
  supportBg: string
  supportBorder: string
  supportLabel: string
  icon: typeof BookOpen
}> = {
  ingles: {
    badge: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
    number: "from-sky-500 to-blue-600 shadow-sky-500/25",
    optionLetter: "from-sky-500 to-blue-600",
    optionHover: "hover:border-sky-300/60 dark:hover:border-sky-500/40",
    titleAccent: "text-sky-600 dark:text-sky-400",
    supportBg: "from-sky-50/80 to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20",
    supportBorder: "border-sky-100 dark:border-sky-900/40",
    supportLabel: "text-sky-600 dark:text-sky-400",
    icon: Languages,
  },
  sociales: {
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    number: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    optionLetter: "from-emerald-500 to-teal-600",
    optionHover: "hover:border-emerald-300/60 dark:hover:border-emerald-500/40",
    titleAccent: "text-emerald-600 dark:text-emerald-400",
    supportBg: "from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20",
    supportBorder: "border-emerald-100 dark:border-emerald-900/40",
    supportLabel: "text-emerald-600 dark:text-emerald-400",
    icon: BookOpen,
  },
  matematicas: {
    badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    number: "from-violet-500 to-purple-600 shadow-violet-500/25",
    optionLetter: "from-violet-500 to-purple-600",
    optionHover: "hover:border-violet-300/60 dark:hover:border-violet-500/40",
    titleAccent: "text-violet-600 dark:text-violet-400",
    supportBg: "from-violet-50/80 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20",
    supportBorder: "border-violet-100 dark:border-violet-900/40",
    supportLabel: "text-violet-600 dark:text-violet-400",
    icon: BookOpen,
  },
  lengua: {
    badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
    number: "from-rose-500 to-pink-600 shadow-rose-500/25",
    optionLetter: "from-rose-500 to-pink-600",
    optionHover: "hover:border-rose-300/60 dark:hover:border-rose-500/40",
    titleAccent: "text-rose-600 dark:text-rose-400",
    supportBg: "from-rose-50/80 to-pink-50/50 dark:from-rose-950/30 dark:to-pink-950/20",
    supportBorder: "border-rose-100 dark:border-rose-900/40",
    supportLabel: "text-rose-600 dark:text-rose-400",
    icon: BookOpen,
  },
  default: {
    badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    number: "from-purple-500 to-pink-500 shadow-purple-500/25",
    optionLetter: "from-purple-500 to-violet-600",
    optionHover: "hover:border-purple-300/60 dark:hover:border-purple-500/40",
    titleAccent: "text-purple-600 dark:text-purple-400",
    supportBg: "from-blue-50/80 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/20",
    supportBorder: "border-blue-100 dark:border-blue-900/40",
    supportLabel: "text-blue-600 dark:text-blue-400",
    icon: BookOpen,
  },
}

function OptionBadge({ letter, text, theme }: { letter: string; text: string; theme: SubjectTheme }) {
  const styles = THEME_STYLES[theme]
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-600/50 bg-slate-50/80 dark:bg-slate-900/40 px-3 py-2.5 transition-colors",
      styles.optionHover
    )}>
      <span className={cn(
        "flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br text-white text-xs font-bold flex items-center justify-center shadow-sm",
        styles.optionLetter
      )}>
        {letter}
      </span>
      <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 pt-0.5">{text}</span>
    </div>
  )
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-600 dark:text-slate-300">
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {value}
    </span>
  )
}

function QuestionCard({ question, index }: { question: ExamQuestionItem; index: number }) {
  const theme = detectTheme(question)
  const styles = THEME_STYLES[theme]
  const SubjectIcon = styles.icon
  const options = parseOptions(question.opciones)
  const isClosed = question.tipo?.toLowerCase().includes("cerrada")
  const hasSupport = question.pista || question.explicacion || question.respuesta_correcta || question.rubrica

  return (
    <article className="rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800/80 dark:to-slate-900/30 overflow-hidden shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-md",
            styles.number
          )}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            {question.titulo && question.titulo !== question.pregunta && (
              <p className={cn("text-xs font-semibold mb-1 uppercase tracking-wide flex items-center gap-1", styles.titleAccent)}>
                <SubjectIcon className="w-3 h-3" />
                {question.titulo}
              </p>
            )}
            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug whitespace-pre-wrap">
              {question.pregunta}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {question.tipo && (
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isClosed ? styles.badge : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                )}>
                  {isClosed ? "Cerrada" : question.tipo}
                </span>
              )}
              {question.tema && <MetaBadge label="Tema" value={question.tema} />}
            </div>
          </div>
        </div>
      </div>

      {question.texto_referencia && !question.pregunta.includes("«") && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Texto de referencia</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {question.texto_referencia.length > 500
              ? `${question.texto_referencia.slice(0, 500)}…`
              : question.texto_referencia}
          </p>
        </div>
      )}

      {options.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
            Opciones de respuesta
          </p>
          {options.map((opt, i) => {
            const letterMatch = opt.match(/^([A-F])\)\s*(.*)/i)
            const letter = letterMatch?.[1]?.toUpperCase() || OPTION_LETTERS[i] || String(i + 1)
            const text = letterMatch?.[2] || opt.replace(/^[A-F]\)\s*/i, "")
            return <OptionBadge key={i} letter={letter} text={text} theme={theme} />
          })}
        </div>
      )}

      {question.alias && (
        <div className="px-4 pb-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            {question.alias}
          </p>
        </div>
      )}

      {hasSupport && (
        <div className={cn(
          "mx-3 mb-3 rounded-xl bg-gradient-to-br border p-3.5 space-y-2.5",
          styles.supportBg,
          styles.supportBorder
        )}>
          <p className={cn("text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5", styles.supportLabel)}>
            <HelpCircle className="w-3.5 h-3.5" />
            Solución y apoyo
          </p>

          {question.pista && (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Pista</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{question.pista}</p>
              </div>
            </div>
          )}

          {question.explicacion && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Explicación</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{question.explicacion}</p>
              </div>
            </div>
          )}

          {question.respuesta_correcta &&
            !question.respuesta_correcta.includes("Ver Respuesta Modelo") && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                <span className="font-medium">Solución modelo:</span> {question.respuesta_correcta}
              </p>
            )}

          {question.rubrica && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Rúbrica:</span> {question.rubrica}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

export function ExamQuestionMessage({ questions, content, source }: ExamQuestionMessageProps) {
  const resolvedQuestions =
    questions && questions.length > 0
      ? questions
      : content
        ? parseExamQuestionsFromText(content)
        : null

  if (!resolvedQuestions || resolvedQuestions.length === 0) return null

  const resolvedSource =
    source ||
    (content?.match(/(?:\n|^)Fuente:\s*(.+?)$/im)?.[1]?.trim() ?? undefined)

  return (
    <div className={cn("space-y-4 -mx-1")}>
      {resolvedQuestions.map((q, i) => (
        <QuestionCard key={i} question={q} index={i} />
      ))}
      {resolvedSource && (
        <p className="text-xs text-slate-400 dark:text-slate-500 pt-1 flex items-center gap-1.5">
          <BookOpen className="w-3 h-3" />
          Fuente: {resolvedSource}
        </p>
      )}
    </div>
  )
}
