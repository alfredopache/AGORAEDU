import { NextRequest, NextResponse } from "next/server"
import { writeClient } from "@/sanity/lib/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      subject,
      difficulty,
      questions,
      score,
      totalQuestions,
      correctAnswers,
      totalTime,
    } = body

    if (!sessionId || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Generar análisis del rendimiento
    const analysis = generateAnalysis(
      subject,
      questions,
      correctAnswers,
      totalQuestions,
      score
    )

    // Preparar preguntas: intentar crear en Sanity las preguntas con 'snapshot'
    const preparedQuestions: any[] = []
    if (Array.isArray(questions)) {
      for (const q of questions) {
        const base = {
          _type: 'object',
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
          timeSpent: q.timeSpent,
        }

        if (q?.snapshot && q?.questionId) {
          const doc = {
            _id: q.questionId,
            _type: 'examQuestion',
            question: q.snapshot.question || q.snapshot.questionText || 'Pregunta generada',
            subject: q.snapshot.subject || 'mixto',
            topic: q.snapshot.topic,
            difficulty: q.snapshot.difficulty || 'basico',
            options: q.snapshot.options || [],
            explanation: q.snapshot.explanation || '',
            source: q.snapshot.source || { name: 'Generado', year: new Date().getFullYear(), region: 'Auto' },
            isActive: true,
          }

          try {
            // Intentar crear la pregunta solo si no existe
            // @ts-ignore
            await writeClient.createIfNotExists(doc)
            preparedQuestions.push({
              ...base,
              questionRef: { _type: 'reference', _ref: q.questionId },
            })
            continue
          } catch (err) {
            console.warn('No se pudo crear pregunta de respaldo:', err)
            // En caso de error, caeremos al fallback que guarda snapshot inline
          }
        }

        // Si no hay snapshot o la creación falló, guardar snapshot inline si existe, o referencia si no
        if (q?.snapshot) {
          preparedQuestions.push({
            ...base,
            questionSnapshot: q.snapshot,
          })
        } else {
          preparedQuestions.push({
            ...base,
            questionRef: { _type: 'reference', _ref: q.questionId },
          })
        }
      }
    }

    // Guardar el intento en Sanity (usar cliente de escritura con token)
    const examAttempt = await writeClient.create({
      _type: 'examAttempt',
      sessionId,
      subject,
      difficulty,
      questions: preparedQuestions,
      score,
      totalQuestions,
      correctAnswers,
      totalTime,
      completedAt: new Date().toISOString(),
      analysis: {
        _type: 'object',
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
      },
    })

    return NextResponse.json({
      success: true,
      attemptId: examAttempt._id,
      analysis,
    })
  } catch (error) {
    console.error("Error guardando intento de examen:", error)
    return NextResponse.json(
      { error: "Error al guardar intento de examen" },
      { status: 500 }
    )
  }
}

function generateAnalysis(
  subject: string,
  questions: any[],
  correctAnswers: number,
  totalQuestions: number,
  score: number
) {
  const strengths: string[] = []
  const weaknesses: string[] = []
  let recommendations = ""

  // Análisis por puntuación
  if (score >= 80) {
    strengths.push("Excelente comprensión general de la materia")
    strengths.push("Buen manejo del tiempo")
    recommendations = "Continúa practicando para mantener tu nivel. Considera aumentar la dificultad en tus próximos exámenes."
  } else if (score >= 60) {
    strengths.push("Comprensión básica sólida")
    weaknesses.push("Algunos conceptos necesitan refuerzo")
      recommendations = "Enfócate en los temas donde fallaste. Practica más ejercicios similares y pide explicaciones detalladas a Acceso IA en modo Chat."
  } else {
    weaknesses.push("Necesitas reforzar los fundamentos")
    weaknesses.push("Considera repasar el temario completo")
      recommendations = "Te recomendamos usar el modo Chat de Acceso IA para resolver dudas específicas antes de hacer más exámenes. Empieza con nivel básico y sube gradualmente."
  }

  // Análisis por materia
  const subjectNames: { [key: string]: string } = {
    matematicas: "Matemáticas",
    lengua: "Lengua Castellana",
    ingles: "Inglés",
    sociales: "Ciencias Sociales",
  }

  if (correctAnswers > totalQuestions / 2) {
    strengths.push(`Buen dominio de ${subjectNames[subject] || "la materia"}`)
  } else {
    weaknesses.push(`Necesitas repasar más ${subjectNames[subject] || "esta materia"}`)
  }

  // Análisis del tiempo
  const avgTime = Math.round((questions.reduce((sum, q) => sum + (q.timeSpent || 0), 0)) / questions.length)
  
  if (avgTime < 30) {
    weaknesses.push("Podrías estar respondiendo demasiado rápido - lee con más atención")
  } else if (avgTime > 120) {
    weaknesses.push("Trabajar en la velocidad de respuesta - practica más para ganar confianza")
  } else {
    strengths.push("Buen equilibrio entre velocidad y precisión")
  }

  return {
    strengths,
    weaknesses,
    recommendations,
  }
}
