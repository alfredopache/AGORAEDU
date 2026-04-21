import { NextRequest, NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const difficulty = searchParams.get("difficulty")
    const count = parseInt(searchParams.get("count") || "10")

    if (!subject || !difficulty) {
      return NextResponse.json(
        { error: "Se requieren subject y difficulty" },
        { status: 400 }
      )
    }

    // Mapas para los nuevos ámbitos (opciones agrupadas)
    const AMBITO_MAP: Record<string, string[]> = {
      // Ámbito lingüístico-comunicativo: lenguas, comentario, historia (se representan con subjects existentes)
      ambito_linguistico: ["lengua", "ingles", "sociales"],
      // Ámbito científico-matemático: matemáticas, TIC y ciencias sociales
      ambito_cientifico: ["matematicas", "sociales", "tic"],
    }

    // Si es mixto, obtener preguntas de todas las materias
    if (subject === "mixto") {
      const query = `*[_type == "examQuestion" && difficulty == $difficulty && isActive == true] {
        _id,
        question,
        subject,
        topic,
        difficulty,
        options,
        explanation,
        source
      }`

      const allQuestions = await client.fetch(query, { difficulty })
      // Mezclar aleatoriamente y devolver exactamente 'count'
      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      return NextResponse.json({ questions: shuffled.slice(0, count) })
    }

    // Si es un ámbito compuesto, buscar por varios subjects
    if (AMBITO_MAP[subject]) {
      const subjects = AMBITO_MAP[subject]
      const query = `*[_type == "examQuestion" && subject in $subjects && difficulty == $difficulty && isActive == true] {
        _id,
        question,
        subject,
        topic,
        difficulty,
        options,
        explanation,
        source
      }`

      const questions = await client.fetch(query, { subjects, difficulty })
      const shuffled = questions.sort(() => Math.random() - 0.5)
      return NextResponse.json({ questions: shuffled.slice(0, count) })
    }

    // Caso por subject individual
    const query = `*[_type == "examQuestion" && subject == $subject && difficulty == $difficulty && isActive == true] {
      _id,
      question,
      subject,
      topic,
      difficulty,
      options,
      explanation,
      source
    }`

    const questions = await client.fetch(query, { subject, difficulty })
    const shuffled = questions.sort(() => Math.random() - 0.5)
    return NextResponse.json({ questions: shuffled.slice(0, count) })
  } catch (error) {
    console.error("Error obteniendo preguntas:", error)
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    )
  }
}
