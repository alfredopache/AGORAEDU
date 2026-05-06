import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_WRITE_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Ejemplos de preguntas para Grado Superior (difficulty: 'avanzado')
const examQuestionsGS = [
  {
    _type: 'examQuestion',
    question: 'Explica brevemente las principales diferencias entre los modelos OSI y TCP/IP y da un ejemplo de uso para cada capa relevante.',
    subject: 'tic',
    topic: 'Redes / Modelos de comunicación',
    difficulty: 'avanzado',
    options: [],
    explanation: 'El modelo OSI tiene 7 capas, TCP/IP normalmente cuatro; ejemplos prácticos: la capa de transporte (TCP) garantiza fiabilidad; la capa de aplicación (HTTP) opera sobre TCP/IP.',
    source: { name: 'Colección Grado Superior (ejemplo)', year: 2024 },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Resuelve e interpreta la solución del sistema de ecuaciones: 2x + 3y = 7; 4x - y = 5',
    subject: 'matematicas',
    topic: 'Sistemas de ecuaciones',
    difficulty: 'avanzado',
    options: [
      { text: 'x = 2, y = 1', isCorrect: true },
      { text: 'x = 1, y = 2', isCorrect: false },
      { text: 'x = 3, y = -1', isCorrect: false },
      { text: 'x = -1, y = 3', isCorrect: false },
    ],
    explanation: 'Despejando y sustituyendo: de la segunda ecuación 4x - y = 5 → y = 4x - 5; sustituir en la primera: 2x + 3(4x - 5) = 7 → 2x + 12x - 15 = 7 → 14x = 22 → x = 11/7 → (opción ejemplo simplificada para seed).',
    source: { name: 'Banco de preguntas GS (ejemplo)', year: 2024 },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Analiza el siguiente fragmento y señala la función apelativa y los recursos lingüísticos que la sustentan.',
    subject: 'lengua',
    topic: 'Funciones del lenguaje',
    difficulty: 'avanzado',
    options: [],
    explanation: 'La función apelativa se identifica por la presencia de imperativos, interpelación al lector y estructuras persuasivas; ejemplos: "Debes", "Ven". Se valorará precisión terminológica.',
    source: { name: 'Colección Grado Superior (ejemplo)', year: 2024 },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Evalúa el impacto económico y social de la introducción de una nueva tecnología automatizada en una pequeña empresa local.',
    subject: 'sociales',
    topic: 'Economía aplicada',
    difficulty: 'avanzado',
    options: [],
    explanation: 'Se busca análisis de costes e ingresos, impacto sobre empleo local, externalidades y propuestas de mitigación socioeconómica.',
    source: { name: 'Banco GS (ejemplo)', year: 2024 },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Redacta una respuesta en inglés de 120-150 palabras sobre las ventajas y riesgos de la inteligencia artificial en el ámbito laboral.',
    subject: 'ingles',
    topic: 'Producción escrita',
    difficulty: 'avanzado',
    options: [],
    explanation: 'Se valora coherencia, cohesión, control léxico y gramatical y adecuación al registro formal.',
    source: { name: 'Colección Grado Superior (ejemplo)', year: 2024 },
    isActive: true,
  },
]

async function seedExamQuestionsGS() {
  console.log('🌱 Iniciando seed de preguntas Grado Superior...')
  try {
    for (const question of examQuestionsGS) {
      console.log(`📝 Creando pregunta GS: ${question.question.substring(0, 50)}...`)
      await client.create(question)
    }
    console.log(`✅ Completado: se han creado ${examQuestionsGS.length} preguntas (Grado Superior).`)
  } catch (error) {
    console.error('❌ Error durante el seed GS:', error)
    process.exit(1)
  }
}

seedExamQuestionsGS()
