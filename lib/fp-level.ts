export type FpLevel = "gm" | "gs"

export const FP_LEVEL_STORAGE_KEY = "eduia-fp-level"

export const FP_LEVELS: Array<{ id: FpLevel; label: string; shortLabel: string; emoji: string }> = [
  { id: "gm", label: "Grado Medio", shortLabel: "Medio", emoji: "📗" },
  { id: "gs", label: "Grado Superior", shortLabel: "Superior", emoji: "📘" },
]

export function isFpLevel(value: unknown): value is FpLevel {
  return value === "gm" || value === "gs"
}

export function readStoredFpLevel(): FpLevel {
  if (typeof window === "undefined") return "gm"
  try {
    const stored = window.localStorage.getItem(FP_LEVEL_STORAGE_KEY)
    return stored === "gs" ? "gs" : "gm"
  } catch {
    return "gm"
  }
}

export function storeFpLevel(level: FpLevel) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(FP_LEVEL_STORAGE_KEY, level)
  } catch {
    // ignore
  }
}

export function getFpLevelLabel(level: FpLevel): string {
  return level === "gs" ? "Grado Superior" : "Grado Medio"
}

export function getPreferredDifficulty(level: FpLevel): "intermedio" | "avanzado" {
  return level === "gs" ? "avanzado" : "intermedio"
}

export function buildFpLevelPrompt(level: FpLevel): string {
  if (level === "gs") {
    return [
      "NIVEL ACTIVO: Prueba de acceso a FP GRADO SUPERIOR.",
      "Sube el nivel de exigencia: razonamiento más profundo, vocabulario más técnico y enunciados más complejos.",
      "Estructura oficial GS: Parte común (Lengua, Inglés, Matemáticas, Geografía e Historia, TIC) y Parte específica (Opción A Humanidades/CCSS, Opción B Tecnología, Opción C Ciencias).",
      "Cuando el alumno pida preguntas o práctica, prioriza ítems de dificultad avanzada y contenidos propios de Grado Superior.",
      "No simplifiques al nivel de Grado Medio salvo que el alumno lo pida explícitamente.",
    ].join("\n")
  }

  return [
    "NIVEL ACTIVO: Prueba de acceso a FP GRADO MEDIO.",
    "Enfoque en los tres ámbitos oficiales: Comunicación, Social y Científico-Tecnológico.",
    "Mantén una dificultad accesible e intermedia, adecuada a quien retoma estudios tras ESO o equivalente.",
    "Prioriza claridad pedagógica y progresión gradual.",
  ].join("\n")
}

export function getItemDifficultyValue(item: Record<string, unknown>): number {
  const raw = item.Dificultad ?? item.dificultad ?? item.DIFICULTAD ?? item.Nivel ?? item.NIVEL
  const n = Number(raw)
  if (!Number.isNaN(n) && n > 0) return n
  const text = String(raw || "").toLowerCase()
  if (text.includes("avanz")) return 3
  if (text.includes("basic")) return 1
  return 2
}

export function scoreItemForFpLevel(item: Record<string, unknown>, level: FpLevel): number {
  const difficulty = getItemDifficultyValue(item)
  const materia = String(item.Materia || item.materia || "").toLowerCase()

  if (level === "gs") {
    let score = difficulty >= 3 ? 4 : difficulty === 2 ? 2 : 0
    if (/opci[oó]n [abc]|humanidad|tecnolog|ciencias naturales/.test(materia)) score += 2
    if (/an[aá]lisis|s[ií]ntesis|evaluaci[oó]n/.test(String(item.NIVEL_TAXONOMIA || item.nivel_taxonomia || "").toLowerCase())) score += 1
    return score
  }

  let score = difficulty <= 2 ? 3 : 1
  if (difficulty === 1) score += 1
  return score
}
