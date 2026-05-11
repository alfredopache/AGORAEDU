"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, BadgeCheck, BrainCircuit, Building2, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEFAULT_EDUIA_PLAN, EDUIA_PLANS, EDUIA_PLAN_STORAGE_KEY, getEduIAPlan, type EduIAPlanId } from "@/lib/eduia-plans"

const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1"])
type BillingCycle = "monthly" | "yearly"

function getDisplayedPrice(planId: EduIAPlanId, billingCycle: BillingCycle) {
  if (planId === "education") {
    return { amount: "0", suffix: "EUR", note: "Uso base educativo" }
  }

  if (planId === "university") {
    if (billingCycle === "yearly") {
      return { amount: "3.75", suffix: "EUR / month", note: "billed annually" }
    }

    return { amount: "4.50", suffix: "EUR / month", note: "billed monthly" }
  }

  return { amount: "90", suffix: "EUR / month", note: "from - enterprise setup" }
}

function getCardButtonLabel(planId: EduIAPlanId, isActive: boolean, isLocalhost: boolean) {
  if (planId === "master") return "Contactar con ventas"
  if (isActive) return "Plan activo"
  if (planId === "education") return isLocalhost ? "Volver a Education" : "Plan incluido"
  return isLocalhost ? "Elegir University" : "Disponible para pruebas en localhost"
}

export default function EduIAUpgradePage() {
  const [selectedPlanId, setSelectedPlanId] = useState<EduIAPlanId>(DEFAULT_EDUIA_PLAN)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  useEffect(() => {
    if (typeof window === "undefined") return
    setIsLocalhost(LOCALHOST_NAMES.has(window.location.hostname))
    const stored = window.localStorage.getItem(EDUIA_PLAN_STORAGE_KEY)
    if (stored === "education" || stored === "university" || stored === "master") {
      setSelectedPlanId(stored)
    }
  }, [])

  const activePlan = useMemo(() => getEduIAPlan(selectedPlanId), [selectedPlanId])
  const orderedPlans = useMemo(
    () => ["education", "university", "master"].map((planId) => EDUIA_PLANS.find((plan) => plan.id === planId)!).filter(Boolean),
    []
  )

  const choosePlan = (planId: EduIAPlanId) => {
    if (!isLocalhost || planId === "master") return
    window.localStorage.setItem(EDUIA_PLAN_STORAGE_KEY, planId)
    setSelectedPlanId(planId)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.1),_transparent_24%),linear-gradient(180deg,_#fbfbf9_0%,_#f8f6f2_100%)] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/eduia" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Volver a Acceso IA
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Upgrade Studio
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">
              <BrainCircuit className="h-4 w-4" />
              University Thinking disponible en localhost
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Elige el plan que desbloquea una IA mas lista, mas enfocada y mucho mas util para estudiar.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                La mejora tiene que sentirse. Education cubre el uso base, University entra en modo Thinking y te orienta con mas criterio, y Master queda listo como linea enterprise con ventas.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="inline-flex items-center rounded-full bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    billingCycle === "monthly" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    billingCycle === "yearly" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                  )}
                >
                  Yearly · Save 17%
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {orderedPlans.map((plan) => {
            const isActive = plan.id === selectedPlanId
            const canSelect = isLocalhost && plan.ctaKind === "select" && plan.id !== "master"
            const displayedPrice = getDisplayedPrice(plan.id, billingCycle)

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative overflow-hidden rounded-[2rem] border bg-white transition duration-300",
                  isActive
                    ? "border-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
                    : "border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
                  plan.id === "university" ? "xl:-translate-y-3" : ""
                )}
              >
                <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", plan.accentClassName)} />

                <div className="flex min-h-[230px] flex-col justify-between p-6">
                  <div className="flex items-start justify-between gap-3">
                  <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {plan.id === "education" ? "Base" : plan.id === "university" ? "Pro" : "Enterprise"}
                      </div>
                      <h2 className="mt-5 text-3xl font-black text-slate-950">{plan.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{plan.tagline}</p>
                    </div>
                    {plan.id === "university" ? <BrainCircuit className="h-10 w-10 text-cyan-500" /> : plan.id === "master" ? <Building2 className="h-10 w-10 text-amber-500" /> : <Sparkles className="h-10 w-10 text-fuchsia-500" />}
                  </div>

                  <div>
                    <div className="mt-8 flex items-end gap-2 text-slate-950">
                      {plan.id === "master" ? (
                        <>
                          <span className="text-5xl font-black">From 90</span>
                          <span className="pb-1 text-base text-slate-600">EUR</span>
                        </>
                      ) : (
                        <>
                          <span className="text-5xl font-black">{displayedPrice.amount}</span>
                          <span className="pb-1 text-base text-slate-600">{displayedPrice.suffix}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{displayedPrice.note}</p>
                  </div>

                  <div className="mt-8">
                    {plan.ctaKind === "contact" ? (
                      <a
                        href="mailto:hola@agoraedu.es?subject=Acceso%20IA%20Master"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
                      >
                        {getCardButtonLabel(plan.id, isActive, isLocalhost)}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => choosePlan(plan.id)}
                        disabled={!canSelect && !isActive}
                        className={cn(
                          "inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition",
                          isActive
                            ? "border border-slate-200 bg-white text-slate-950"
                            : canSelect
                              ? "bg-slate-950 text-white hover:-translate-y-0.5"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                        )}
                      >
                        {getCardButtonLabel(plan.id, isActive, isLocalhost)}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 px-6 py-6">
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    {plan.id === "education" ? "Incluye:" : plan.id === "university" ? "Everything in Education, plus:" : "Everything in University, plus:"}
                  </p>
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature.label} className="flex items-start gap-3">
                        <Check className={cn("mt-1 h-4 w-4 shrink-0", feature.emphasized ? "text-cyan-500" : "text-slate-500")} />
                        <p className={cn("text-sm leading-6", feature.emphasized ? "font-medium text-slate-950" : "text-slate-700")}>{feature.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Diferencia real</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">University no solo responde mejor: piensa mejor.</h3>
              </div>
              <BadgeCheck className="h-10 w-10 text-cyan-500" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Diagnostico</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Detecta en que parte del proceso te estas cayendo, no solo en si acertaste o fallaste.</p>
              </div>
              <div className="rounded-3xl bg-stone-100 p-5 text-slate-950">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Thinking</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">Antes de contestar, estructura mejor el problema y prioriza lo que mas te hace subir nivel.</p>
              </div>
              <div className="rounded-3xl bg-cyan-50 p-5 text-slate-950">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Siguiente paso</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">Siempre te deja una accion clara: practicar, corregir, repetir o subir dificultad.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Estado actual</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Seleccion de plan</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{isLocalhost ? "Activa en localhost" : "Limitada fuera de localhost"}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan activo</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{activePlan.name}</p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Que cambia al instante</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                En localhost puedes alternar entre Education y University y volver al chat para notar el cambio de tono, profundidad, foco y seguimiento. Master queda como CTA comercial hasta trabajar la capa B2B.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}