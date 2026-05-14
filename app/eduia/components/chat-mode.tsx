"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2, Bot, BookOpen, Lightbulb, Sparkles, Menu, X, Brain, Zap, Target, TrendingUp, Activity } from "lucide-react"
import { motion as motionBase, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { downloadPracticeExamPdf } from "@/lib/practice-exam-pdf"
import GoogleSignIn from "@/components/google-signin"
import { getEduIAPlan, type EduIAPlanId } from "@/lib/eduia-plans"

const motion = motionBase as any
import { MarkdownRenderer } from "./markdown-renderer"
import { InteractiveExam, ExamResultsView } from "./interactive-exam"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface OfficialDownloadGroup {
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

interface ChatModeProps {
  sessionId: string
  conversationId: string | null
  selectedPlanId: EduIAPlanId
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

const UNIVERSITY_QUICK_ACTIONS = [
  { label: "Diagnóstico", prompt: "Hazme un diagnóstico completo de mi perfil académico: identifica mis lagunas exactas, mis fortalezas reales, y dame un plan de mejora inmediato con predicción de resultado.", icon: Brain, color: "text-cyan-500", glow: "hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]", border: "hover:border-cyan-400" },
  { label: "Plan de estudio", prompt: "Crea un plan de estudio personalizado semana a semana para mí, basado en mi perfil, objetivos y tiempo disponible.", icon: Target, color: "text-blue-500", glow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]", border: "hover:border-blue-400" },
  { label: "Simulacro", prompt: "SIM_MENU", icon: Zap, color: "text-violet-500", glow: "hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]", border: "hover:border-violet-400" },
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

export function ChatMode({ sessionId, conversationId, selectedPlanId, onConversationSaved, onDeleteConversation }: ChatModeProps) {
  const { data: session, status } = useSession()
  const activePlan = getEduIAPlan(selectedPlanId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [selectedScope, setSelectedScope] = useState<ChatScope>("ambito_linguistico")
  const [showSimMenu, setShowSimMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userJustSentMessage = useRef(false)
  
  const [examMode, setExamMode] = useState<"none" | "active" | "results">("none")
  const [examConfig, setExamConfig] = useState<any>(null)
  const [examResults, setExamResults] = useState<any>(null)
  const [isGeneratingPracticePdf, setIsGeneratingPracticePdf] = useState(false)
  const [datasets, setDatasets] = useState<string[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedSubGoal, setSelectedSubGoal] = useState<string | null>(null)
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [officialDownloadGroups, setOfficialDownloadGroups] = useState<OfficialDownloadGroup[]>([])
  const [officialDownloadNote, setOfficialDownloadNote] = useState<string | null>(null)
  const [isLoadingOfficialDownloads, setIsLoadingOfficialDownloads] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0) // 0=welcome, 1-10=questions
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileDraft, setProfileDraft] = useState<Partial<UserProfile>>({
    name: session?.user?.name || "",
  })

  const [onboardingSeen, setOnboardingSeen] = useState(false)

  const getOnboardingSeenKey = () => {
    return session?.user?.email ? `eduia-onboarding-seen-${session.user.email}` : `eduia-onboarding-seen-guest`
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const key = getOnboardingSeenKey()
      const seen = localStorage.getItem(key)
      setOnboardingSeen(!!seen)
    } catch {
      // ignore
    }
  }, [session?.user?.email])

  const userLabel = session?.user?.name ? session.user.name : "Google"
  const [isLocalhost, setIsLocalhost] = useState(false)

  const isNearBottom = () => {
    const el = messagesContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200
  }

  const scrollToBottom = () => {
    const el = messagesContainerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
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

  // Load available datasets from the server (files in /data)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/exam/datasets')
        if (!res.ok) return
        const json = await res.json()
        const ds: string[] = Array.isArray(json?.datasets) ? json.datasets : []
        setDatasets(ds)
      } catch (e) {
        // ignore load errors
      }
    }
    load()
  }, [])

  // Auto-select dataset based on selectedSubGoal (gm/gs) if a matching filename exists
  useEffect(() => {
    if (!datasets || datasets.length === 0) return
    if (selectedSubGoal === 'gs') {
      const gs = datasets.find(f => /grado.*superior|\bgs\b|superior/i.test(f))
      if (gs) setSelectedDataset(gs)
    } else if (selectedSubGoal === 'gm') {
      const gm = datasets.find(f => /grado.*medio|\bgm\b|medio/i.test(f))
      if (gm) setSelectedDataset(gm)
    }
  }, [datasets, selectedSubGoal])

  useEffect(() => {
    const shouldLoad = selectedGoal === "fp" && !!selectedSubGoal && !!selectedContext

    if (!shouldLoad) {
      setOfficialDownloadGroups([])
      setOfficialDownloadNote(null)
      return
    }

    const controller = new AbortController()
    const loadOfficialDownloads = async () => {
      try {
        setIsLoadingOfficialDownloads(true)
        const params = new URLSearchParams({
          goal: selectedGoal || "",
          level: selectedSubGoal || "",
          context: selectedContext || "",
        })
        const response = await fetch(`/api/exam/official-resources?${params.toString()}`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error("No se pudieron cargar las descargas")
        }
        const data = await response.json()
        setOfficialDownloadGroups(Array.isArray(data?.groups) ? data.groups : [])
        setOfficialDownloadNote(data?.note ? String(data.note) : null)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setOfficialDownloadGroups([])
        setOfficialDownloadNote("No se han podido cargar las descargas ahora mismo.")
      } finally {
        setIsLoadingOfficialDownloads(false)
      }
    }

    loadOfficialDownloads()
    return () => controller.abort()
  }, [selectedGoal, selectedSubGoal, selectedContext])

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
        if (onboardingSeen) {
          return (
            <div className="max-w-xl w-full">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-slate-700 mb-4">Ya has visto las preguntas iniciales. Puedes completarlas ahora o empezar sin perfil.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      try { localStorage.removeItem(getOnboardingSeenKey()) } catch {}
                      setOnboardingSeen(false)
                      setOnboardingStep(1)
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm"
                  >Completar perfil</button>
                  <button
                    onClick={() => {
                      const minimal: UserProfile = {
                        name: session?.user?.name || "Usuario",
                        itinerary: "gm",
                        currentSituation: "",
                        focus: "Todos los ámbitos",
                        selfAssessment: "",
                        difficulty: "",
                        mainUse: "Practicar ejercicios",
                        learningStyle: "",
                        timeAvailable: "",
                        levelTest: "",
                        accompanimentStyle: "",
                      }
                      try { localStorage.setItem(getProfileStorageKey(), JSON.stringify(minimal)) } catch {}
                      setUserProfile(minimal)
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3 text-sm font-semibold"
                  >Empezar sin perfil</button>
                </div>
              </div>
            </div>
          )
        }

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
                onClick={() => {
                  try {
                    localStorage.setItem(getOnboardingSeenKey(), "1")
                  } catch {}
                  setOnboardingSeen(true)
                  setOnboardingStep(1)
                }}
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

          {selectedGoal === "fp" && selectedSubGoal && selectedContext && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Descargas oficiales</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Material filtrado para {selectedContext}.</p>
                </div>
                {isLoadingOfficialDownloads ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
              </div>

              {officialDownloadNote && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-900/20 dark:text-amber-200">
                  {officialDownloadNote}
                </div>
              )}

              {officialDownloadGroups.length > 0 && (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {officialDownloadGroups.map((group) => (
                    <div key={group.key} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{group.label}</p>
                      {group.note ? <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{group.note}</p> : null}
                      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        {group.items.map((item) => (
                          <a
                            key={`${group.key}-${item.downloadUrl}`}
                            href={item.downloadUrl}
                            className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs transition hover:border-purple-300 hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-purple-500 dark:hover:bg-purple-900/20"
                          >
                            <span className="block font-medium text-slate-800 dark:text-slate-100">{item.filename}</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{item.topic} · {item.sizeKb} KB</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingOfficialDownloads && !officialDownloadNote && officialDownloadGroups.length === 0 && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No hay descargas disponibles para esta selección todavía.</p>
              )}
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
    if (userJustSentMessage.current || isNearBottom()) {
      scrollToBottom()
      userJustSentMessage.current = false
    }
  }, [messages])

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([])
    }
  }, [conversationId])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "0px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }, [input])

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
      userJustSentMessage.current = true
      setMessages(p => [...p, { role: "assistant", content: "No puedo procesar eso.", timestamp: new Date() } as Message])
      setInput("")
      return
    }

    const examDetection = detectExamRequest(textToSend)
    if (examDetection.isExam) {
      userJustSentMessage.current = true
      setMessages(m => [...m, { role: "user", content: textToSend, timestamp: new Date() } as Message])
      setInput("")
      await handleGeneratePracticeExam(examDetection.config)
      return
    }

    const userMessage: Message = { role: "user", content: textToSend, timestamp: new Date() }
    const updatedMessages = [...messages, userMessage]
    userJustSentMessage.current = true
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, scope: selectedScope, userProfile, planId: selectedPlanId }),
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
      const levelText = selectedSubGoal === "gs" ? "Grado Superior" : "Grado Medio"
      sendMessage(`Hazme un examen mixto de 36 preguntas de ${levelText} con todas las asignaturas.`)
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
        seed: String(Math.floor(Math.random() * 1e9)),
      })
      if (selectedGoal === "fp") {
        const preset = selectedSubGoal === "gs" ? "gradoSuperior" : "gradoMedio"
        params.set("preset", preset)
      }
      if (selectedDataset) {
        params.set("dataset", selectedDataset)
      }
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

  if (examMode === "active" && examConfig) return <div className="h-full"><InteractiveExam config={examConfig} onComplete={handleExamComplete} onCancel={() => setExamMode("none")} /></div>
  if (examMode === "results" && examResults) return <div className="h-full"><ExamResultsView results={examResults} onNewExam={() => setExamMode("none")} onBackToChat={() => setExamMode("none")} /></div>

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
      {isLoadingConversation ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      ) : (
        <>
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-start pt-6 px-4 pb-8">
                {/* Hero */}
                {selectedPlanId === "university" ? (
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950/80 to-blue-950 border border-cyan-500/20 p-6 rounded-3xl mb-6 max-w-2xl w-full text-center shadow-2xl shadow-cyan-500/10">
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 mb-5">
                        <Activity className="w-3 h-3" />
                        <span>University — IA Adaptativa v3.0</span>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30">
                        <Brain className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-white">Acceso IA University</h3>
                      <p className="text-sm text-cyan-100/75 mb-1 max-w-sm mx-auto leading-relaxed">Sistema de Inteligencia Adaptativa de nueva generación. Diagnosica tus lagunas exactas, construye tu plan personalizado y predice tu resultado real.</p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        {[
                          { icon: Brain, label: "Diagnóstico cognitivo" },
                          { icon: Target, label: "Plan adaptativo" },
                          { icon: TrendingUp, label: "Predicción de resultado" },
                          { icon: Zap, label: "Modo socrático" },
                        ].map(({ icon: Icon, label }) => (
                          <div key={label} className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-white/5 px-3 py-1.5 text-xs text-cyan-200/80">
                            <Icon className="w-3 h-3 text-cyan-400" />
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => sendMessage("Hazme un diagnóstico completo de mi perfil académico: identifica mis lagunas exactas, mis fortalezas reales, y dame un plan de mejora inmediato con predicción de resultado.")}
                        className="mt-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 w-full sm:w-auto"
                      >
                        Iniciar diagnóstico completo →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-3xl mb-6 max-w-2xl w-full text-center">
                    <Bot className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold mb-2">¡Hola! Soy Acceso IA 👋</h3>
                    <p className="text-sm opacity-75 mb-1 max-w-md mx-auto">Tu tutora personal para preparar pruebas de acceso a FP y reforzar los ámbitos clave de Grado Básico y ESO.</p>
                    <p className="text-sm opacity-55 max-w-md mx-auto">Elige qué quieres preparar y empieza con práctica, resolución de dudas o simulacros adaptados a tu nivel.</p>
                    <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200">
                      <span className={cn("rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white", activePlan.id === "master" ? "from-amber-400 to-red-500" : "from-fuchsia-500 to-pink-500")}>{activePlan.name}</span>
                      <span>{activePlan.tagline}</span>
                    </div>
                  </div>
                )}

                {renderWelcomeScreen()}
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((m, i) => {
                  const prevMsg = messages[i - 1]
                  const isGrouped = prevMsg?.role === m.role
                  return (
                    <div key={i} className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start items-end gap-2", isGrouped ? "mt-1" : "mt-4")}>
                      {m.role === "assistant" && (
                        <div className={cn(
                          "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-opacity",
                          selectedPlanId === "university" ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20" : "bg-gradient-to-br from-purple-600 to-pink-500 shadow-purple-500/20",
                          isGrouped ? "opacity-0" : "opacity-100"
                        )}>
                          {selectedPlanId === "university" ? <Brain className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className={cn(
                          "max-w-[78%] px-4 py-2.5",
                          m.role === "user"
                            ? selectedPlanId === "university"
                              ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-[20px] rounded-tr-[5px] shadow-md shadow-cyan-500/20"
                              : "bg-gradient-to-br from-purple-600 to-violet-600 text-white rounded-[20px] rounded-tr-[5px] shadow-md shadow-purple-500/20"
                            : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-[20px] rounded-tl-[5px] shadow-sm text-slate-800 dark:text-slate-100"
                        )}
                      >
                        {m.role === "assistant"
                          ? <MarkdownRenderer content={m.content} />
                          : <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        }
                      </motion.div>
                    </div>
                  )
                })}
              </AnimatePresence>
            )}
            {isLoading && (
              <div className="flex justify-start items-end gap-2 mt-4">
                <div className={cn(
                  "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm",
                  selectedPlanId === "university" ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20" : "bg-gradient-to-br from-purple-600 to-pink-500 shadow-purple-500/20"
                )}>
                  {selectedPlanId === "university" ? <Brain className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={cn(
                  "border px-4 py-3.5 rounded-[20px] rounded-tl-[5px] shadow-sm flex items-center gap-2",
                  selectedPlanId === "university"
                    ? "bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-100 dark:border-cyan-900/40"
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60"
                )}>
                  <span className={cn("w-2 h-2 rounded-full animate-bounce", selectedPlanId === "university" ? "bg-cyan-400" : "bg-slate-300 dark:bg-slate-500")} style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                  <span className={cn("w-2 h-2 rounded-full animate-bounce", selectedPlanId === "university" ? "bg-cyan-400" : "bg-slate-300 dark:bg-slate-500")} style={{ animationDelay: "180ms", animationDuration: "1s" }} />
                  <span className={cn("w-2 h-2 rounded-full animate-bounce", selectedPlanId === "university" ? "bg-cyan-400" : "bg-slate-300 dark:bg-slate-500")} style={{ animationDelay: "360ms", animationDuration: "1s" }} />
                  {selectedPlanId === "university" && <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium ml-1">Analizando en profundidad...</span>}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800/80 px-3 pt-2.5 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl relative">
            <AnimatePresence>
              {showSimMenu && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} className="absolute bottom-full left-3 mb-2 p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-2xl z-50 min-w-[240px]">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 pt-2 pb-1 uppercase tracking-widest">Temas disponibles</p>
                  <div className="flex flex-col gap-0.5">
                    {["Mixto", "Matemáticas", "Lengua", "Inglés", "Sociales", "Naturales", "TIC (Tecnología)"].map(t => (
                      <button key={t} onClick={() => handleSimOption(t)} className="text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-sm text-slate-700 dark:text-slate-200 transition-colors">Simulador de {t}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="max-w-5xl mx-auto space-y-2">
              {/* Quick action pills */}
              <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-hide">
{(selectedPlanId === "university" ? UNIVERSITY_QUICK_ACTIONS : QUICK_ACTIONS).map((a, i) => (
                  <button key={i} onClick={() => handleQuickAction(a.prompt)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 active:scale-95 hover:scale-105", selectedPlanId === "university" ? "bg-white/90 dark:bg-slate-800/80 border-cyan-200/60 dark:border-slate-700/60" : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60", a.color, a.border, showSimMenu && (a.label === "Simulacros" || a.label === "Simulacro") && "!bg-purple-50 dark:!bg-purple-900/30 border-purple-400")}>
                    <a.icon className="w-3.5 h-3.5" />
                    <span>{a.label}</span>
                  </button>
                ))}
                {isLocalhost && (
                  <button type="button" onClick={clearLocalMemory} className="ml-auto text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors whitespace-nowrap flex-shrink-0 pl-2">
                    DEBUG: borrar
                  </button>
                )}
              </div>
              {/* Input row */}
              <div className="flex items-end gap-2">
                <div className={cn(
                  "flex-1 flex items-end bg-slate-100/90 dark:bg-slate-800/80 rounded-3xl px-4 py-3 border transition-colors",
                  selectedPlanId === "university"
                    ? "border-slate-200/50 dark:border-slate-700/40 focus-within:border-cyan-400/60 dark:focus-within:border-cyan-500/50"
                    : "border-slate-200/50 dark:border-slate-700/40 focus-within:border-purple-400/60 dark:focus-within:border-purple-500/50"
                )}>
                  <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={selectedPlanId === "university" ? "Pregunta, pide diagnóstico, plan de estudio..." : "Mensaje..."} className="flex-1 resize-none overflow-hidden bg-transparent text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed py-1 min-h-[72px] max-h-[180px]" rows={3} />
                </div>
                <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading || isGeneratingPracticePdf} className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 mb-0.5", input.trim() && !isLoading && !isGeneratingPracticePdf
                    ? selectedPlanId === "university"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-90"
                      : "bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-90"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed")}>
                  {isGeneratingPracticePdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      </motion.div>
    </div>
  )
}
