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

    // --- Utilidades para evitar opciones repetidas y añadir variedad ---
    function shuffle<T>(arr: T[]) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = arr[i]
        arr[i] = arr[j]
        arr[j] = tmp
      }
      return arr
    }

    function ensureUniqueOptions(opts: Array<{ text: string; isCorrect: boolean }>, desired = 4) {
      const map = new Map<string, { text: string; isCorrect: boolean }>()
      opts.forEach(o => map.set(o.text, { text: o.text, isCorrect: o.isCorrect }))
      let attempts = 0
      while (map.size < desired && attempts < 20) {
        const candidate = `Opción ${Math.random().toString(36).slice(2, 6)}`
        if (!map.has(candidate)) map.set(candidate, { text: candidate, isCorrect: false })
        attempts++
      }
      const arr = Array.from(map.values()).slice(0, desired)
      if (!arr.some(a => a.isCorrect)) {
        arr[0].isCorrect = true
      } else if (arr.filter(a => a.isCorrect).length > 1) {
        let found = false
        arr.forEach((a) => {
          if (a.isCorrect) {
            if (!found) found = true
            else a.isCorrect = false
          }
        })
      }
      return shuffle(arr)
    }

    // Nueva versión del generador de preguntas de respaldo con mayor variedad
    function generateFallbackQuestion(subjectName: string, difficultyLevel: string, topic?: string) {
      const uid = makeId(subjectName)
      const baseTopic = topic || (subjectName === 'matematicas' ? 'Álgebra' : subjectName === 'lengua' ? 'Ortografía' : 'General')
      let questionText = ''
      let rawOptions: Array<{ text: string; isCorrect: boolean }> = []

      if (subjectName === 'matematicas') {
        const a = randomInt(1, 12)
        const b = randomInt(1, 12)
        questionText = `¿Cuál es el resultado de ${a} × ${b}?`
        const correct = a * b
        const wrong = new Set<number>()
        while (wrong.size < 3) {
          const candidate = correct + (Math.random() < 0.5 ? -randomInt(1, 6) : randomInt(1, 12))
          if (candidate > 0 && candidate !== correct) wrong.add(candidate)
        }
        rawOptions = [{ text: String(correct), isCorrect: true }, ...Array.from(wrong).map(n => ({ text: String(n), isCorrect: false }))]
      } else if (subjectName === 'ingles') {
        const pool: Array<[string, string]> = [
          ['hola', 'hello'], ['adiós', 'goodbye'], ['gracias', 'thanks'], ['por favor', 'please'], ['buenos días', 'good morning'], ['noche', 'night']
        ]
        const pick = pool[Math.floor(Math.random() * pool.length)]
        questionText = `Choose the correct translation for: '${pick[0]}'`
        const englishDistractors = ['hello', 'goodbye', 'please', 'thanks', 'good morning', 'night'].filter(w => w !== pick[1])
        shuffle(englishDistractors)
        rawOptions = [{ text: pick[1], isCorrect: true }, ...englishDistractors.slice(0, 3).map(t => ({ text: t, isCorrect: false }))]
      } else if (subjectName === 'lengua') {
        const pool = [
          { base: ['arbol', 'árbol'] },
          { base: ['lapiz', 'lápiz'] },
          { base: ['facil', 'fácil'] },
          { base: ['cafe', 'café'] },
          { base: ['camion', 'camión'] }
        ]
        const pick = pool[Math.floor(Math.random() * pool.length)]
        questionText = `Selecciona la opción con la palabra correctamente acentuada: '${pool.map(p => p.base[0]).slice(0,4).join(', ')}'`
        const correct = pick.base[1]
        const distractors = pool.map(p => p.base[1]).filter(w => w !== correct)
        shuffle(distractors)
        rawOptions = [{ text: correct, isCorrect: true }, ...distractors.slice(0, 3).map(t => ({ text: t, isCorrect: false }))]
      } else if (subjectName === 'sociales') {
        const countries = [
          ['España', 'Europa'], ['Brasil', 'América'], ['Japón', 'Asia'], ['Egipto', 'África'], ['Australia', 'Oceanía']
        ]
        const pick = countries[Math.floor(Math.random() * countries.length)]
        questionText = `¿En qué continente se encuentra ${pick[0]}?`
        const continents = ['Europa', 'Asia', 'África', 'América', 'Oceanía']
        const wrong = continents.filter(c => c !== pick[1])
        shuffle(wrong)
        rawOptions = [{ text: pick[1], isCorrect: true }, ...wrong.slice(0, 3).map(w => ({ text: w, isCorrect: false }))]
      } else if (subjectName === 'tic') {
        const pairs = [
          ['HTML', 'HyperText Markup Language'],
          ['CSS', 'Cascading Style Sheets'],
          ['JSON', 'JavaScript Object Notation'],
          ['API', 'Application Programming Interface']
        ]
        const pick = pairs[Math.floor(Math.random() * pairs.length)]
        questionText = `¿Qué significa '${pick[0]}'?`
        const wrong = pairs.map(p => p[1]).filter(p => p !== pick[1])
        shuffle(wrong)
        rawOptions = [{ text: pick[1], isCorrect: true }, ...wrong.slice(0, 3).map(t => ({ text: t, isCorrect: false }))]
      } else {
        questionText = `Pregunta de ${subjectName} (generada aleatoriamente)`
        rawOptions = [
          { text: 'Opción A', isCorrect: Math.random() < 0.5 },
          { text: 'Opción B', isCorrect: false },
          { text: 'Opción C', isCorrect: false },
          { text: 'Opción D', isCorrect: false }
        ]
      }

      const options = ensureUniqueOptions(rawOptions, 4)

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
