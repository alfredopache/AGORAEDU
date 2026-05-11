export type EduIAPlanId = "education" | "university" | "master"

export interface EduIAPlanFeature {
  label: string
  emphasized?: boolean
}

export interface EduIAPlan {
  id: EduIAPlanId
  name: string
  tagline: string
  audience: string
  priceLabel: string
  monthlyPrice: number | null
  accentClassName: string
  features: EduIAPlanFeature[]
  ctaLabel: string
  ctaKind: "select" | "contact"
}

export const EDUIA_PLAN_STORAGE_KEY = "eduia-selected-plan"

export const EDUIA_PLANS: EduIAPlan[] = [
  {
    id: "university",
    name: "University",
    tagline: "Pensamiento guiado y enfoque de mejora",
    audience: "Para estudiantes que quieren un tutor mas estrategico y exigente.",
    priceLabel: "$4.50/mes",
    monthlyPrice: 4.5,
    accentClassName: "from-cyan-500 via-sky-500 to-blue-600",
    ctaLabel: "Elegir University",
    ctaKind: "select",
    features: [
      { label: "Modo Thinking con analisis mas profundo", emphasized: true },
      { label: "Deteccion de lagunas y siguientes pasos concretos" },
      { label: "Respuestas mas estructuradas y accionables" },
      { label: "Seguimiento del progreso academico dentro del chat" },
    ],
  },
  {
    id: "master",
    name: "Master",
    tagline: "Solucion para centros, academias y empresas",
    audience: "Para despliegues B2B, equipos y casos avanzados.",
    priceLabel: "Personalizado",
    monthlyPrice: null,
    accentClassName: "from-amber-400 via-orange-500 to-red-500",
    ctaLabel: "Contactar con ventas",
    ctaKind: "contact",
    features: [
      { label: "Pensado para organizaciones y multiples usuarios", emphasized: true },
      { label: "Onboarding y acuerdos comerciales a medida" },
      { label: "Hoja de ruta enterprise pendiente de definir" },
    ],
  },
  {
    id: "education",
    name: "Education",
    tagline: "Base educativa clara y rapida",
    audience: "Para practica diaria, dudas rapidas y simulacros guiados.",
    priceLabel: "Actual",
    monthlyPrice: 0,
    accentClassName: "from-fuchsia-500 via-pink-500 to-rose-500",
    ctaLabel: "Plan actual",
    ctaKind: "select",
    features: [
      { label: "Tutor educativo para FP, Grado Basico y ESO", emphasized: true },
      { label: "Practica, dudas y simulacros" },
      { label: "Personalizacion basica por perfil y ambito" },
    ],
  },
]

export const DEFAULT_EDUIA_PLAN: EduIAPlanId = "education"

export function getEduIAPlan(planId?: string | null): EduIAPlan {
  return EDUIA_PLANS.find((plan) => plan.id === planId) ?? EDUIA_PLANS.find((plan) => plan.id === DEFAULT_EDUIA_PLAN)!
}