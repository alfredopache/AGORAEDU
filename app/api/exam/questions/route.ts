import { NextRequest, NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const difficulty = searchParams.get("difficulty")
    const count = parseInt(searchParams.get("count") || "10")
    const topic = searchParams.get("topic") // optional topic filter (e.g., 'Comentario', 'Historia')

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
      const params: any = { difficulty }
      let query = `*[_type == "examQuestion" && difficulty == $difficulty && isActive == true] {
        _id,
        question,
        subject,
        topic,
        difficulty,
        options,
        explanation,
        source
      }`

      if (topic) {
        // Usar match para permitir coincidencias parciales en topic
        query = `*[_type == "examQuestion" && difficulty == $difficulty && topic match $topic && isActive == true] {
          _id,
          question,
          subject,
          topic,
          difficulty,
          options,
          explanation,
          source
        }`
        params.topic = `*${topic}*`
      }

      const allQuestions = await client.fetch(query, params)
      // Mezclar aleatoriamente y devolver exactamente 'count'
      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      return NextResponse.json({ questions: shuffled.slice(0, count) })
    }

    // Si es un ámbito compuesto, buscar por varios subjects
    if (AMBITO_MAP[subject]) {
      const subjects = AMBITO_MAP[subject]
      const params: any = { subjects, difficulty }
      let query = `*[_type == "examQuestion" && subject in $subjects && difficulty == $difficulty && isActive == true] {
        _id,
        question,
        subject,
        topic,
        difficulty,
        options,
        explanation,
        source
      }`

      if (topic) {
        query = `*[_type == "examQuestion" && subject in $subjects && difficulty == $difficulty && topic match $topic && isActive == true] {
          _id,
          question,
          subject,
          topic,
          difficulty,
          options,
          explanation,
          source
        }`
        params.topic = `*${topic}*`
      }

      const questions = await client.fetch(query, params)
      const shuffled = questions.sort(() => Math.random() - 0.5)
      return NextResponse.json({ questions: shuffled.slice(0, count) })
    }

    // Caso por subject individual
    // Caso por subject individual (posible filtro por topic)
    const params: any = { subject, difficulty }
    let query = `*[_type == "examQuestion" && subject == $subject && difficulty == $difficulty && isActive == true] {
      _id,
      question,
      subject,
      topic,
      difficulty,
      options,
      explanation,
      source
    }`

    if (topic) {
      query = `*[_type == "examQuestion" && subject == $subject && difficulty == $difficulty && topic match $topic && isActive == true] {
        _id,
        question,
        subject,
        topic,
        difficulty,
        options,
        explanation,
        source
      }`
      params.topic = `*${topic}*`
    }

    const questions = await client.fetch(query, params)
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
