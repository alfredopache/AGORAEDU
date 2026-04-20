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

    // Si es mixto, obtener preguntas de todas las materias
    let query
    if (subject === "mixto") {
      query = `*[_type == "examQuestion" && difficulty == $difficulty && isActive == true] | order(_createdAt desc) [0...${count}] {
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
      
      // Mezclar aleatoriamente
      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      
      return NextResponse.json({ questions: shuffled.slice(0, count) })
    } else {
      query = `*[_type == "examQuestion" && subject == $subject && difficulty == $difficulty && isActive == true] | order(_createdAt desc) [0...${count}] {
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
      
      // Mezclar aleatoriamente
      const shuffled = questions.sort(() => Math.random() - 0.5)

      return NextResponse.json({ questions: shuffled })
    }
  } catch (error) {
    console.error("Error obteniendo preguntas:", error)
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    )
  }
}
