"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2, Bot, BookOpen, Lightbulb, Sparkles, Menu, X } from "lucide-react"
import { motion as motionBase, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { downloadPracticeExamPdf } from "@/lib/practice-exam-pdf"
import GoogleSignIn from "@/components/google-signin"

const motion = motionBase as any
import { MarkdownRenderer } from "./markdown-renderer"
import { InteractiveExam, ExamResultsView } from "./interactive-exam"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatModeProps {
  sessionId: string
  conversationId: string | null
  onConversationSaved: (conversationId?: string | null) => void
  onDeleteConversation?: (conversationId: string, title?: string) => void
}

type ChatScope = "ambito_linguistico" | "ambito_cientifico"

type Itinerary = "gm" | "gs" | "gb1" | "gb2" | "eso"

interface UserProfile {
  name: string
  itinerary: Itinerary
  currentSituation: string
  focus: string
  selfAssessment: string
  difficulty: string
  mainUse: string
  learningStyle: string
  timeAvailable: string
  levelTest: string
  accompanimentStyle: string
}

const QUICK_ACTIONS = [
  { label: "Práctica", prompt: "Dame ejercicios de práctica sobre ", icon: BookOpen, color: "text-emerald-500", glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]", border: "hover:border-emerald-400" },
  { label: "Dudas", prompt: "Tengo una duda sobre ", icon: Lightbulb, color: "text-amber-500", glow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]", border: "hover:border-amber-400" },
  { label: "Simulacros", prompt: "SIM_MENU", icon: Sparkles, color: "text-pink-500", glow: "hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]", border: "hover:border-pink-400" },
]

const GOALS = [
  { id: "fp", label: "Pruebas de acceso a FP", emoji: "🎓" },
  { id: "basico", label: "Ámbitos de Grado Básico", emoji: "📚" },
  { id: "eso", label: "Refuerzo ESO", emoji: "✏️" },
]

const FP_LEVELS = [
  { id: "gm", label: "Grado Medio", emoji: "📗" },
  { id: "gs", label: "Grado Superior", emoji: "📘" },
]

const GM_AMBITOS = ["Ámbito de Comunicación", "Ámbito Social", "Ámbito Científico-Tecnológico"]
const GS_PARTES = ["Parte común", "Parte específica"]
const GB_AMBITOS = ["Ámbito lingüístico-social", "Ámbito científico-tecnológico"]
const ESO_MATERIAS = ["Lengua", "Matemáticas", "Ciencias", "Inglés"]
const ESO_EMOJIS: Record<string, string> = { "Lengua": "📝", "Matemáticas": "🔢", "Ciencias": "🔬", "Inglés": "🌍" }

const HOME_ACTIONS = [
  { id: "practica", label: "Práctica", description: "Ejercicios y corrección", icon: BookOpen, color: "text-emerald-500" },
  { id: "dudas", label: "Dudas", description: "Explicaciones paso a paso", icon: Lightbulb, color: "text-amber-500" },
  { id: "simulacros", label: "Simulacros", description: "Exámenes tipo prueba", icon: Sparkles, color: "text-purple-500" },
]

const ONBOARDING_STEPS: Array<{
  id: keyof Omit<UserProfile, "name">
  question: string
  options: Array<{ label: string; value: string; emoji?: string }>
}> = [
  {
    id: "itinerary",
    question: "¿Qué quieres preparar?",
    options: [
      { label: "Prueba de acceso a FP de Grado Medio", value: "gm", emoji: "📗" },
      { label: "Prueba de acceso a FP de Grado Superior", value: "gs", emoji: "📘" },
      { label: "Ámbitos de Grado Básico – 1.º", value: "gb1", emoji: "📙" },
      { label: "Ámbitos de Grado Básico – 2.º", value: "gb2", emoji: "📕" },
      { label: "Refuerzo de ESO", value: "eso", emoji: "✏️" },
    ],
  },
  {
    id: "currentSituation",
    question: "¿Cuál es tu nivel máximo de estudios en este momento?",
    options: [
      { label: "1.º ESO", value: "1.º ESO" },
      { label: "2.º ESO", value: "2.º ESO" },
      { label: "3.º ESO", value: "3.º ESO" },
      { label: "4.º ESO", value: "4.º ESO" },
      { label: "1.º Grado Básico", value: "1.º Grado Básico" },
      { label: "2.º Grado Básico", value: "2.º Grado Básico" },
      { label: "1.º Bachillerato", value: "1.º Bachillerato" },
      { label: "FP Grado Medio", value: "FP Grado Medio" },
      { label: "FP Grado Superior", value: "FP Grado Superior" },
      { label: "Otro", value: "Otro" },
      { label: "Prefiero no indicarlo", value: "No indicado" },
    ],
  },
  {
    id: "focus",
    question: "¿Qué quieres trabajar más ahora?",
    options: [], // dynamically overridden based on itinerary
  },
  {
    id: "selfAssessment",
    question: "¿Cómo te sientes con ese contenido ahora mismo?",
    options: [
      { label: "Muy perdido/a", value: "Muy perdido/a", emoji: "😟" },
      { label: "Me cuesta bastante", value: "Me cuesta bastante", emoji: "😕" },
      { label: "Voy regular", value: "Voy regular", emoji: "😐" },
      { label: "Voy bastante bien", value: "Voy bastante bien", emoji: "🙂" },
      { label: "Se me da bien", value: "Se me da bien", emoji: "😊" },
    ],
  },
  {
    id: "difficulty",
    question: "¿Qué te cuesta más?",
    options: [
      { label: "Entender los enunciados", value: "Entender los enunciados" },
      { label: "Recordar teoría", value: "Recordar teoría" },
      { label: "Resolver ejercicios paso a paso", value: "Resolver ejercicios paso a paso" },
      { label: "Redactar respuestas", value: "Redactar respuestas" },
      { label: "Organizarme", value: "Organizarme" },
      { label: "Mantener la concentración", value: "Mantener la concentración" },
      { label: "Controlar los nervios", value: "Controlar los nervios" },
      { label: "No lo sé todavía", value: "No lo sé" },
    ],
  },
  {
    id: "mainUse",
    question: "¿Para qué quieres usar Acceso IA principalmente?",
    options: [
      { label: "Practicar ejercicios", value: "Practicar ejercicios", emoji: "📝" },
      { label: "Resolver dudas", value: "Resolver dudas", emoji: "💡" },
      { label: "Hacer simulacros", value: "Hacer simulacros", emoji: "🎯" },
      { label: "Repasar temas", value: "Repasar temas", emoji: "📚" },
      { label: "Mejorar poco a poco en varias materias", value: "Mejorar poco a poco", emoji: "📈" },
    ],
  },
  {
    id: "learningStyle",
    question: "¿Cómo prefieres aprender?",
    options: [
      { label: "Con ejercicios cortos", value: "Ejercicios cortos" },
      { label: "Con explicaciones paso a paso", value: "Explicaciones paso a paso" },
      { label: "Con ejemplos resueltos", value: "Ejemplos resueltos" },
      { label: "Con preguntas tipo examen", value: "Preguntas tipo examen" },
      { label: "Mezclando un poco de todo", value: "Mezclando estilos" },
    ],
  },
  {
    id: "timeAvailable",
    question: "¿Cuánto tiempo puedes dedicar normalmente?",
    options: [
      { label: "10–15 min al día", value: "10–15 min/día" },
      { label: "20–30 min al día", value: "20–30 min/día" },
      { label: "3–4 días por semana", value: "3–4 días/semana" },
      { label: "Solo fines de semana", value: "Fines de semana" },
      { label: "Depende del día", value: "Variable" },
    ],
  },
  {
    id: "levelTest",
    question: "¿Quieres empezar con una prueba de nivel?",
    options: [
      { label: "Sí, una breve", value: "Sí, breve", emoji: "✅" },
      { label: "Sí, una completa", value: "Sí, completa", emoji: "📋" },
      { label: "No, prefiero empezar practicando", value: "No, practicando", emoji: "✏️" },
      { label: "No, prefiero resolver dudas primero", value: "No, dudas primero", emoji: "💬" },
    ],
  },
  {
    id: "accompanimentStyle",
    question: "¿Cómo quieres que te acompañe Acceso IA?",
    options: [
      { label: "De forma directa y rápida", value: "Directa y rápida" },
      { label: "Explicando paso a paso", value: "Paso a paso" },
      { label: "Motivándome y guiándome", value: "Motivadora y guía" },
      { label: "Como un profesor exigente pero claro", value: "Exigente y clara" },
      { label: "Como una mezcla de profesor y apoyo", value: "Mixta" },
    ],
  },
]

const FOCUS_OPTIONS: Record<Itinerary, Array<{ label: string; value: string }>> = {
  gm: [
    { label: "Ámbito de Comunicación", value: "Ámbito de Comunicación" },
    { label: "Ámbito Social", value: "Ámbito Social" },
    { label: "Ámbito Científico-Tecnológico", value: "Ámbito Científico-Tecnológico" },
    { label: "Todos los ámbitos", value: "Todos los ámbitos" },
  ],
  gs: [
    { label: "Parte común", value: "Parte común" },
    { label: "Parte específica", value: "Parte específica" },
    { label: "Las dos partes", value: "Parte común y específica" },
  ],
  gb1: [
    { label: "Ámbito lingüístico-social", value: "Ámbito lingüístico-social" },
    { label: "Ámbito científico-tecnológico", value: "Ámbito científico-tecnológico" },
    { label: "Los dos ámbitos", value: "Ambos ámbitos" },
  ],
  gb2: [
    { label: "Ámbito lingüístico-social", value: "Ámbito lingüístico-social" },
    { label: "Ámbito científico-tecnológico", value: "Ámbito científico-tecnológico" },
    { label: "Los dos ámbitos", value: "Ambos ámbitos" },
  ],
  eso: [
    { label: "Lengua", value: "Lengua" },
    { label: "Matemáticas", value: "Matemáticas" },
    { label: "Ciencias", value: "Ciencias" },
    { label: "Inglés", value: "Inglés" },
    { label: "Varias materias", value: "Varias materias" },
  ],
}

const ITINERARY_LABELS: Record<Itinerary, string> = {
  gm: "Prueba de acceso a FP – Grado Medio",
  gs: "Prueba de acceso a FP – Grado Superior",
  gb1: "Ámbitos de Grado Básico – 1.º",
  gb2: "Ámbitos de Grado Básico – 2.º",
  eso: "Refuerzo de ESO",
}

export function ChatMode({ sessionId, conversationId, onConversationSaved, onDeleteConversation }: ChatModeProps) {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [selectedScope, setSelectedScope] = useState<ChatScope>("ambito_linguistico")
  const [showSimMenu, setShowSimMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [examMode, setExamMode] = useState<"none" | "active" | "results">("none")
  const [examConfig, setExamConfig] = useState<any>(null)
  const [examResults, setExamResults] = useState<any>(null)
  const [isGeneratingPracticePdf, setIsGeneratingPracticePdf] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedSubGoal, setSelectedSubGoal] = useState<string | null>(null)
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [onboardingStep, setOnboardingStep] = useState(0) // 0=welcome, 1-10=questions
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileDraft, setProfileDraft] = useState<Partial<UserProfile>>({
    name: session?.user?.name || "",
  })

  const userLabel = session?.user?.name ? session.user.name : "Google"
  const [isLocalhost, setIsLocalhost] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getProfileStorageKey = () => {
    return session?.user?.email ? `eduia-profile-${session.user.email}` : "eduia-profile-guest"
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      setIsLocalhost(hostname === "localhost" || hostname === "127.0.0.1")
    }
  }, [])

  const clearLocalMemory = () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(getProfileStorageKey())
    localStorage.removeItem("eduia-profile-guest")
    setUserProfile(null)
    setProfileDraft({ name: session?.user?.name || "" })
    setOnboardingStep(0)
    setMessages([])
  }

  useEffect(() => {
    if (status === "loading") return
    const stored = typeof window !== "undefined" ? localStorage.getItem(getProfileStorageKey()) : null
    if (stored) {
      try {
        setUserProfile(JSON.parse(stored))
      } catch {
        localStorage.removeItem(getProfileStorageKey())
      }
    }
  }, [status, session?.user?.email])

  useEffect(() => {
    if (session?.user?.name && !profileDraft.name) {
      setProfileDraft((prev) => ({ ...prev, name: session.user?.name || prev.name }))
    }
  }, [session?.user?.name])

  const saveProfile = (draft?: Partial<UserProfile>) => {
    const p = (draft || profileDraft) as UserProfile
    if (!p.itinerary) return
    const key = getProfileStorageKey()
    localStorage.setItem(key, JSON.stringify(p))
    setUserProfile(p)
    const itLabel = ITINERARY_LABELS[p.itinerary] || p.itinerary
    const name = p.name ? `, ${p.name}` : ""
    setMessages([{
      role: "assistant",
      content: `¡Perfecto${name}! 🎉 Ya tengo tu perfil listo.\n\n**Tu itinerario:** ${itLabel}\n**Área prioritaria:** ${p.focus}\n**Objetivo:** ${p.mainUse}\n**Estilo de aprendizaje:** ${p.learningStyle}\n\n**Mi recomendación:** Te propongo empezar con ${p.mainUse.toLowerCase()} en ${p.focus}. ${p.levelTest?.startsWith("Sí") ? "Comenzamos con una prueba de nivel breve." : "Cuando quieras, elige una opción abajo o escríbeme directamente."}`,
      timestamp: new Date(),
    }])
  }

  const renderWelcomeScreen = () => {
    if (status === "loading") {
      return (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 shadow-sm max-w-xl w-full text-center">
          <Loader2 className="w-7 h-7 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Cargando sesión...</p>
        </div>
      )
    }

    if (!session?.user) {
      return (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-8 shadow-sm max-w-xl w-full text-center">
          <h4 className="text-lg font-semibold mb-3">Inicia sesión para personalizar tu tutoría</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Guarda tu perfil y adapta cada sesión a tu nivel y objetivo.</p>
          <div className="flex justify-center"><GoogleSignIn /></div>
        </div>
      )
    }

    if (!userProfile) {
      // Step 0: Welcome
      if (onboardingStep === 0) {
        return (
          <div className="max-w-xl w-full">
            <div className="rounded-3xl border border-purple-500/20 bg-white/5 dark:bg-slate-900/60 p-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4 text-center">Bienvenido/a</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">Antes de empezar, unas preguntas breves para adaptar la experiencia a tu nivel y objetivos.</p>
              <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                <span>🔒</span>
                <span>Tus respuestas solo se usan para personalizar tu aprendizaje. No se recogen datos personales sensibles. Podrás modificarlas más adelante.</span>
              </div>
              {!session.user.name && (
                <input
                  value={profileDraft.name || ""}
                  onChange={(e) => setProfileDraft(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 mb-4 text-sm"
                  placeholder="¿Cómo te llaman? (opcional)"
                />
              )}
              <button
                onClick={() => setOnboardingStep(1)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3 text-sm font-semibold transition-all"
              >Empezar →</button>
            </div>
          </div>
        )
      }

      // Steps 1–10
      const rawStep = ONBOARDING_STEPS[onboardingStep - 1]
      if (!rawStep) return null
      const stepData = rawStep.id === "focus"
        ? { ...rawStep, options: FOCUS_OPTIONS[(profileDraft.itinerary as Itinerary) || "gm"] }
        : rawStep
      const currentValue = profileDraft[stepData.id as keyof UserProfile]

      const handleOption = (value: string) => {
        const updated = { ...profileDraft, [stepData.id]: value }
        setProfileDraft(updated)
        if (onboardingStep < ONBOARDING_STEPS.length) {
          setOnboardingStep(prev => prev + 1)
        } else {
          saveProfile(updated as UserProfile)
        }
      }

      return (
        <div className="max-w-xl w-full">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-6">
            {onboardingStep > 1 && (
              <button
                type="button"
                onClick={() => setOnboardingStep(prev => prev - 1)}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >← Atrás</button>
            )}
            <div className="flex-1 flex gap-1">
              {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i < onboardingStep ? "bg-purple-500" : "bg-slate-700")} />
              ))}
            </div>
            <span className="text-xs text-slate-400">{onboardingStep}/{ONBOARDING_STEPS.length}</span>
          </div>

          <h4 className="text-lg font-bold mb-5 text-center">{stepData.question}</h4>

          <div className="flex flex-col gap-2">
            {stepData.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleOption(opt.value)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                  currentValue === opt.value
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-600"
                )}
              >
                {(opt as any).emoji ? <span className="mr-2">{(opt as any).emoji}</span> : null}{opt.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full max-w-2xl">
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-center text-sm uppercase tracking-wide">¿Qué quieres preparar?</h4>
          <div className="grid grid-cols-3 gap-3">
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => { setSelectedGoal(prev => prev === g.id ? null : g.id); setSelectedSubGoal(null); setSelectedContext(null) }}
                className={cn(
                  "p-4 rounded-2xl border-2 text-center transition-all hover:-translate-y-0.5",
                  selectedGoal === g.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-600"
                )}
              >
                <span className="text-2xl block mb-1">{g.emoji}</span>
                <span className="text-xs font-semibold leading-tight block">{g.label}</span>
              </button>
            ))}
          </div>

          {selectedGoal === "fp" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {FP_LEVELS.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setSelectedSubGoal(prev => prev === l.id ? null : l.id); setSelectedContext(null) }}
                  className={cn(
                    "p-3 rounded-xl border text-sm font-semibold transition-all",
                    selectedSubGoal === l.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-purple-300 bg-white dark:bg-slate-800/40"
                  )}
                >
                  {l.emoji} {l.label}
                </button>
              ))}
            </div>
          )}

          {selectedGoal === "fp" && selectedSubGoal === "gm" && (
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              {GM_AMBITOS.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedContext(prev => prev === a ? null : a)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                    selectedContext === a
                      ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-fuchsia-300 bg-white dark:bg-slate-800/40"
                  )}
                >{a}</button>
              ))}
            </div>
          )}

          {selectedGoal === "fp" && selectedSubGoal === "gs" && (
            <div className="mt-2 flex gap-2 justify-center">
              {GS_PARTES.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedContext(prev => prev === a ? null : a)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                    selectedContext === a
                      ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-fuchsia-300 bg-white dark:bg-slate-800/40"
                  )}
                >{a}</button>
              ))}
            </div>
          )}

          {selectedGoal === "basico" && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {GB_AMBITOS.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedContext(prev => prev === a ? null : a)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                    selectedContext === a
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-purple-300 bg-white dark:bg-slate-800/40"
                  )}
                >{a}</button>
              ))}
            </div>
          )}

          {selectedGoal === "eso" && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ESO_MATERIAS.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedContext(prev => prev === a ? null : a)}
                  className={cn(
                    "p-2 rounded-xl border text-xs font-semibold transition-all text-center",
                    selectedContext === a
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300 bg-white dark:bg-slate-800/40"
                  )}
                >{ESO_EMOJIS[a]} {a}</button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl">
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-center text-sm uppercase tracking-wide">¿Qué quieres hacer hoy?</h4>
          <div className="grid grid-cols-3 gap-3">
            {HOME_ACTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => handleHomeAction(a.id)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-center transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600"
              >
                <a.icon className={cn("w-6 h-6 mx-auto mb-2", a.color)} />
                <span className="text-sm font-bold block">{a.label}</span>
                <span className="text-xs opacity-55 block mt-0.5">{a.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const isGibberishInput = (text: string) => {
    const normalized = text.trim().toLowerCase()
    if (normalized.length === 0) return false
    if (normalized.length <= 3 && !/^[a-záéíóúñ]+$/.test(normalized)) return true
    const words = normalized.split(/\s+/).filter(Boolean)
    if (words.length === 1 && words[0].length >= 3 && !/[aeiouáéíóú]/.test(words[0])) return true
    const nonAlpha = (text.match(/[^a-záéíóúñ0-9\s]/gi) || []).length
    if (nonAlpha / Math.max(text.length, 1) > 0.3) return true
    return false
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([])
    }
  }, [conversationId])

  const loadConversation = async (id: string) => {
    setIsLoadingConversation(true)
    try {
      const response = await fetch("/api/conversations/" + id)
      if (response.ok) {
        const data = await response.json()
        const loadedMessages = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error("Error cargando conversación:", error)
    } finally {
      setIsLoadingConversation(false)
    }
  }

  const saveConversation = async (updatedMessages: Message[]) => {
    if (updatedMessages.length === 0) return
    try {
      const firstUserMessage = updatedMessages.find(m => m.role === "user")
      const title = firstUserMessage?.content.substring(0, 50) || "Nueva conversación"
      const content = updatedMessages.map(m => m.content.toLowerCase()).join(" ")
      let subject = "general"
      if (content.includes("ecuación") || content.includes("matemática") || content.includes("número") || content.includes("fracción") || content.includes("geometr")) subject = "matematicas"
      else if (content.includes("inglés") || content.includes("english") || content.includes("present perfect")) subject = "ingles"
      else if (content.includes("lengua") || content.includes("gramática") || content.includes("ortografía")) subject = "lengua"
      else if (content.includes("historia") || content.includes("geografía") || content.includes("social")) subject = "sociales"

      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, sessionId, title, subject, messages: updatedMessages }),
      }).then(res => res.ok && res.json()).then(data => data && onConversationSaved(data.conversationId || null))
    } catch (error) {
      console.error("Error guardando conversación:", error)
    }
  }

  const detectExamRequest = (text: string): { isExam: boolean; config?: any } => {
    const lowerText = text.toLowerCase()
    const hasExamKeyword = /\b(examen|prueba|test|simulador)\b/i.test(lowerText)
    const hasPdfIntent = /\b(pdf|descargar|respuestas?|solucionario|documento|archivo|descarga|imprimir|imprime)\b/i.test(lowerText)
    const hasIntentVerb = /\b(dame|quiero|quieres|puedes darme|hazme|¿puedes|necesito|quiero que|por favor)\b/i.test(lowerText)
    const hasContext = /\b(de|sobre|para|con|una|un|por|del|la|el)\b/i.test(lowerText)

    if (!hasExamKeyword || !(hasIntentVerb || hasContext)) return { isExam: false }
    if (!hasPdfIntent) return { isExam: false }

    let subject = "mixto", topic: string | undefined = undefined

    if (/\b(mixto|todas las asignaturas|todas las materias|parte común|all subjects|todas las materias)\b/i.test(lowerText)) {
      subject = "mixto"
    } else if (/(lengua|literatura|gram[áa]tica|ortograf|comentario|sintaxis|texto)/i.test(lowerText)) {
      subject = "lengua"
    } else if (/(inglés|ingles|english|vocabulary|present perfect|grammar)/i.test(lowerText)) {
      subject = "ingles"
    } else if (/(sociales|historia|geografía|geografia|econom(ía|ia)|civica|cívica|politica|politica)/i.test(lowerText)) {
      subject = "sociales"
    } else if (/(matem(á|a)tica|mate|fracciones|ecuaci[oó]n|álgebra|algebra|geometr)/i.test(lowerText)) {
      subject = "matematicas"
    } else if (/(naturales|ciencias naturales|biolog(ía|ia)|salud|medio ambiente|ecolog(ía|ia)|renovable)/i.test(lowerText)) {
      subject = "naturales"
    } else if (/(tic|tecnolog(ía|ia)|informatica|informática|programaci[oó]n|ordenador|excel|hoja de calculo)/i.test(lowerText)) {
      subject = "tic"
    } else if (/ambit?o|ámbito/.test(lowerText)) {
      if (/(lingu[ií]stic|lingü|comunic)/i.test(lowerText)) subject = "ambito_linguistico"
      else if (/(cientific|matem|tic|ciencias)/i.test(lowerText)) subject = "ambito_cientifico"
    }

    const topicMatch = lowerText.match(/(?:sobre|tema de|acerca de|referente a)\s+(?:el |la |los |las )?([a-záéíóúñ0-9\s]+?)(?=(?:[,.]|$| por | con | para | y | de \d| preguntas?))/i)
    if (topicMatch) topic = topicMatch[1].trim()

    let count = 36, nums = text.match(/\d+/g)
    if (nums) count = Math.min(Math.max(parseInt(nums[0], 10), 5), 36)

    return { isExam: true, config: { subject, difficulty: "intermedio", count, topic, prompt: text } }
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading || isGeneratingPracticePdf) return
    if (textToSend.trim() === "Dame 10 ejercicios de práctica sobre" || textToSend.trim() === "Explícame de forma clara y con ejemplos:") return

    if (isGibberishInput(textToSend)) {
      setMessages(p => [...p, { role: "assistant", content: "No puedo procesar eso.", timestamp: new Date() } as Message])
      setInput("")
      return
    }

    const examDetection = detectExamRequest(textToSend)
    if (examDetection.isExam) {
      setMessages(m => [...m, { role: "user", content: textToSend, timestamp: new Date() } as Message])
      setInput("")
      await handleGeneratePracticeExam(examDetection.config)
      return
    }

    const userMessage: Message = { role: "user", content: textToSend, timestamp: new Date() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, scope: selectedScope, userProfile }),
      })
      const data = await response.json()
      const final = [...updatedMessages, { role: "assistant", content: data.message, timestamp: new Date() } as Message]
      setMessages(final)
      await saveConversation(final)
    } catch (error) {
      console.error(error)
      setMessages(p => [...p, { role: "assistant", content: "Error.", timestamp: new Date() } as Message])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
  const handleExampleClick = (question: string) => sendMessage(question)
  const handleQuickAction = (prompt: string) => { 
    if (prompt === "SIM_MENU") setShowSimMenu(!showSimMenu)
    else { setInput(prompt); setShowSimMenu(false); setTimeout(() => textareaRef.current?.focus(), 10) }
  }
  const handleSimOption = (topic: string) => {
    setShowSimMenu(false)
    if (topic.toLowerCase() === "mixto") {
      sendMessage("Hazme un examen mixto de 36 preguntas de Grado Medio con todas las asignaturas.")
    } else {
      sendMessage(`Hazme un examen de 36 preguntas de ${topic}.`)
    }
  }

  const mapChatSubjectToApiSubject = (subject: string) => {
    if (subject === "ambito_linguistico") return "mixto"
    if (subject === "ambito_cientifico") return "mixto"
    if (subject === "lengua") return "lengua-literatura"
    if (subject === "ingles") return "ingles"
    if (subject === "matematicas") return "matematicas"
    if (subject === "naturales") return "naturales"
    if (subject === "sociales") return "sociales"
    if (subject === "tic") return "tic"
    return "mixto"
  }

  const handleGeneratePracticeExam = async (config: any) => {
    setIsGeneratingPracticePdf(true)
    try {
      setMessages(prev => [...prev, { role: "assistant", content: "Estoy generando un examen listo con respuestas. Te lo descargo en breve...", timestamp: new Date() }])
      const params = new URLSearchParams({
        difficulty: config.difficulty || "intermedio",
        subject: mapChatSubjectToApiSubject(config.subject),
        questionCount: String(36),
        preset: "gradoMedio",
        seed: String(Math.floor(Math.random() * 1e9)),
      })
      const response = await fetch(`/api/exam/practice-pack?${params.toString()}`)
      if (!response.ok) throw new Error("No se pudo generar el examen de practica")
      const data = await response.json()
      if (!data?.pack || !Array.isArray(data.pack.questions) || data.pack.questions.length === 0) {
        throw new Error("El pack de practica se ha generado vacio")
      }
      await downloadPracticeExamPdf(data.pack)
      setMessages(prev => [...prev, { role: "assistant", content: "Listo: el examen resuelto está descargándose. Si quieres más, dime otra materia o cantidad.", timestamp: new Date() }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: "assistant", content: "No pude generar el examen resuelto. Intenta de nuevo con otro tema o recarga la página.", timestamp: new Date() }])
    } finally {
      setIsGeneratingPracticePdf(false)
    }
  }

  const handleExamComplete = (results: any) => {
    setExamResults(results); setExamMode("results")
    const summary: Message = { role: "assistant", content: "Simulacro completo.", timestamp: new Date() }
    setMessages(m => [...m, summary]); saveConversation([...messages, summary])
  }

  const buildContextLabel = () => {
    const parts: string[] = []
    if (selectedGoal === "fp") {
      parts.push("la prueba de acceso a FP")
      if (selectedSubGoal === "gm") parts.push("Grado Medio")
      else if (selectedSubGoal === "gs") parts.push("Grado Superior")
    } else if (selectedGoal === "basico") {
      parts.push("los ámbitos de Grado Básico")
    } else if (selectedGoal === "eso") {
      parts.push("refuerzo de ESO")
    }
    if (selectedContext) parts.push(selectedContext)
    return parts.join(" — ") || "el temario"
  }

  const handleHomeAction = (actionId: string) => {
    const ctx = buildContextLabel()
    if (actionId === "practica") {
      sendMessage(`Dame ejercicios de práctica sobre ${ctx}.`)
    } else if (actionId === "dudas") {
      setInput(`Tengo una duda sobre ${ctx}: `)
      setShowSimMenu(false)
      setTimeout(() => textareaRef.current?.focus(), 10)
    } else if (actionId === "simulacros") {
      setShowSimMenu(true)
    }
  }

  if (examMode === "active" && examConfig) return <InteractiveExam config={examConfig} onComplete={handleExamComplete} onCancel={() => setExamMode("none")} />
  if (examMode === "results" && examResults) return <ExamResultsView results={examResults} onNewExam={() => setExamMode("none")} onBackToChat={() => setExamMode("none")} />

  return (
    <div className="h-full min-h-0 flex flex-col">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
      {isLoadingConversation ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      ) : (
        <>
          <div className="flex-1 min-h-0 p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-start pt-6 px-4 pb-8 overflow-y-auto">
                {/* Hero */}
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-3xl mb-6 max-w-2xl w-full text-center">
                  <Bot className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-2">¡Hola! Soy Acceso IA 👋</h3>
                  <p className="text-sm opacity-75 mb-1 max-w-md mx-auto">Tu tutora personal para preparar pruebas de acceso a FP y reforzar los ámbitos clave de Grado Básico y ESO.</p>
                  <p className="text-sm opacity-55 max-w-md mx-auto">Elige qué quieres preparar y empieza con práctica, resolución de dudas o simulacros adaptados a tu nivel.</p>
                </div>

                {renderWelcomeScreen()}
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex w-full mb-4", m.role === "user" ? "justify-end" : "justify-start")}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("max-w-[85%] rounded-2xl border shadow-sm", m.role === "user" ? "bg-purple-600 text-white border-purple-500" : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700")}>
                      <div className={cn("px-4 pt-4 pb-2 rounded-t-2xl text-xs font-semibold uppercase tracking-[0.18em]", m.role === "user" ? "text-purple-100" : "text-slate-500 dark:text-slate-400")}> 
                        {m.role === "user" ? "Tú" : "AccesoIA"}
                      </div>
                      <div className="px-4 pb-4">
                        {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </AnimatePresence>
            )}
            {isLoading && (
              <div className="w-full flex justify-start">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" /><span className="text-sm opacity-60">Razonando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative">
            <AnimatePresence>
              {showSimMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-4 mb-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 min-w-[240px]">
                  <p className="text-xs font-bold text-slate-500 p-2 uppercase">Temas disponibles:</p>
                  <div className="flex flex-col gap-1">
                    {["Mixto", "Matemáticas", "Lengua", "Inglés", "Sociales", "Naturales", "TIC (Tecnología)"].map(t => (
                      <button key={t} onClick={() => handleSimOption(t)} className="text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-sm">Simulador de {t}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="max-w-5xl mx-auto flex items-end gap-2">
              <div className="flex-1 flex flex-col gap-2 md:gap-1 mb-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    {QUICK_ACTIONS.map((a, i) => (
                      <button key={i} onClick={() => handleQuickAction(a.prompt)} className={cn("p-2.5 rounded-xl border transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700", a.glow, a.border, showSimMenu && a.label === "Simuladores" && "bg-purple-100 dark:bg-purple-900 border-purple-400")} title={a.label}>
                        <a.icon className={cn("w-5 h-5", a.color)} />
                      </button>
                    ))}
                  </div>
                  {isLocalhost && (
                    <button type="button" onClick={clearLocalMemory} className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                      DEBUG: borrar memoria
                    </button>
                  )}
                </div>
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribe tu mensaje..." className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[50px] shadow-sm" rows={1} />
              </div>
              <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading || isGeneratingPracticePdf} className="bg-gradient-to-r from-purple-600 to-pink-600 p-3.5 rounded-2xl text-white shadow-md active:scale-95 disabled:opacity-50">
                {isGeneratingPracticePdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      )}
      </motion.div>
    </div>
  )
}
