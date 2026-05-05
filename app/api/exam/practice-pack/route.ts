import { NextRequest, NextResponse } from "next/server"

import { generatePracticeExamPack } from "@/lib/practice-exam-generator"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seedParam = searchParams.get("seed")
    const questionCountParam = searchParams.get("questionCount")
    const difficulty = searchParams.get("difficulty") || "intermedio"
    const subject = searchParams.get("subject") || "mixto"
    const useOfficialPreset = searchParams.get("preset") === "gradoMedio"

    const pack = generatePracticeExamPack({
      seed: seedParam ? Number(seedParam) : undefined,
      difficulty,
      questionCount: useOfficialPreset ? 36 : (questionCountParam ? Number(questionCountParam) : 36),
      subject,
      useOfficialPreset,
    })

    return NextResponse.json({ pack })
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo generar el examen de practica",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}