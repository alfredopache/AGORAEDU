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

    // Helper: generar preguntas de respaldo cuando la base de datos no tenga suficientes
    const ALL_SUBJECTS = ["matematicas", "lengua", "ingles", "sociales", "tic"]

    function randomInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function makeId(prefix = "fallback") {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }

    function generateFallbackQuestion(subjectName: string, difficultyLevel: string, topic?: string) {
      // Generar una pregunta simple según subject y difficulty
      const uid = makeId(subjectName)
      const baseTopic = topic || (subjectName === 'matematicas' ? 'Álgebra' : subjectName === 'lengua' ? 'Ortografía' : 'General')
      let questionText = ''
      const options: Array<any> = []

      if (subjectName === 'matematicas') {
        const a = randomInt(1, 12)
        const b = randomInt(1, 12)
        questionText = `¿Cuál es el resultado de ${a} × ${b}?`
        const correct = a * b
        const wrong1 = correct + randomInt(1, 6)
        const wrong2 = Math.max(1, correct - randomInt(1, 6))
        const wrong3 = correct + randomInt(7, 12)
        const vals = [correct, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5)
        vals.forEach((v) => options.push({ text: String(v), isCorrect: v === correct }))
      } else if (subjectName === 'ingles') {
        questionText = `Choose the correct translation for: 'hola'` // simple placeholder
        const vals = ["hello", "bye", "please", "thanks"].sort(() => Math.random() - 0.5)
        vals.forEach((v) => options.push({ text: v, isCorrect: v === "hello" }))
      } else if (subjectName === 'lengua') {
        questionText = `Selecciona la opción con la palabra correctamente acentuada: 'arbol, camión, lapiz, facil'`
        const vals = ["árbol", "camión", "lápiz", "fácil"].sort(() => Math.random() - 0.5)
        vals.forEach((v) => options.push({ text: v, isCorrect: v === "camión" || v === "árbol" || v === "lápiz" || v === "fácil" }))
        // mark only one as correct (pick one)
        const correctIdx = randomInt(0, options.length - 1)
        options.forEach((o, i) => (o.isCorrect = i === correctIdx))
      } else if (subjectName === 'sociales') {
        questionText = `¿En qué continente se encuentra España?`
        const vals = ["Europa", "Asia", "África", "América"].sort(() => Math.random() - 0.5)
        vals.forEach((v) => options.push({ text: v, isCorrect: v === "Europa" }))
      } else if (subjectName === 'tic') {
        questionText = `¿Qué significa 'HTML'?`
        const vals = ["HyperText Markup Language", "HighText Machine Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language"].sort(() => Math.random() - 0.5)
        vals.forEach((v) => options.push({ text: v, isCorrect: v === "HyperText Markup Language" }))
      } else {
        // gen genérica
        questionText = `Pregunta de ${subjectName} (generada aleatoriamente)`
        const vals = ["Opción A", "Opción B", "Opción C", "Opción D"].sort(() => Math.random() - 0.5)
        const correctIdx = randomInt(0, 3)
        vals.forEach((v, i) => options.push({ text: v, isCorrect: i === correctIdx }))
      }

      return {
        _id: uid,
        question: questionText,
        subject: subjectName,
        topic: baseTopic,
        difficulty: difficultyLevel,
        options,
        explanation: `Explicación generada: la respuesta correcta es ${options.find(o => o.isCorrect)?.text}`,
        source: { name: "Generado aleatoriamente", year: new Date().getFullYear(), region: "Auto" },
      }
    }

    function generateFallbackQuestions(countNeeded: number, subjectSources: string[] | string, difficultyLevel: string, topic?: string) {
      const out: any[] = []
      for (let i = 0; i < countNeeded; i++) {
        let subj = typeof subjectSources === 'string' ? subjectSources : subjectSources[Math.floor(Math.random() * subjectSources.length)]
        if (!subj) subj = ALL_SUBJECTS[Math.floor(Math.random() * ALL_SUBJECTS.length)]
        out.push(generateFallbackQuestion(subj, difficultyLevel, topic))
      }
      return out
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
      let final = shuffled.slice(0, count)
      if (final.length < count) {
        const need = count - final.length
        const generated = generateFallbackQuestions(need, ALL_SUBJECTS, difficulty, topic ?? undefined)
        final = final.concat(generated).slice(0, count)
      }
      return NextResponse.json({ questions: final })
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
      let final = shuffled.slice(0, count)
      if (final.length < count) {
        const need = count - final.length
        const generated = generateFallbackQuestions(need, subjects, difficulty, topic ?? undefined)
        final = final.concat(generated).slice(0, count)
      }
      return NextResponse.json({ questions: final })
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
    let final = shuffled.slice(0, count)
    if (final.length < count) {
      const need = count - final.length
      const generated = generateFallbackQuestions(need, subject, difficulty, topic ?? undefined)
      final = final.concat(generated).slice(0, count)
    }
    return NextResponse.json({ questions: final })
  } catch (error) {
    console.error("Error obteniendo preguntas:", error)
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    )
  }
}
