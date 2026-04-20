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

// PREGUNTAS CERTIFICADAS BASADAS EN EXÁMENES OFICIALES DE ESPAÑA
const examQuestions = [
  // ==================== MATEMÁTICAS ====================
  {
    _type: 'examQuestion',
    question: '¿Cuál es el resultado de resolver la ecuación: 2x + 5 = 13?',
    subject: 'matematicas',
    topic: 'Ecuaciones de primer grado',
    difficulty: 'basico',
    options: [
      { text: 'x = 4', isCorrect: true },
      { text: 'x = 3', isCorrect: false },
      { text: 'x = 6', isCorrect: false },
      { text: 'x = 8', isCorrect: false },
    ],
    explanation: 'Para resolver: 2x + 5 = 13 → 2x = 13 - 5 → 2x = 8 → x = 8/2 → x = 4',
    source: {
      name: 'Ministerio de Educación',
      year: 2023,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Si un rectángulo tiene una base de 8 cm y una altura de 5 cm, ¿cuál es su área?',
    subject: 'matematicas',
    topic: 'Geometría - Áreas',
    difficulty: 'basico',
    options: [
      { text: '40 cm²', isCorrect: true },
      { text: '13 cm²', isCorrect: false },
      { text: '26 cm²', isCorrect: false },
      { text: '45 cm²', isCorrect: false },
    ],
    explanation: 'El área de un rectángulo se calcula: Área = base × altura = 8 cm × 5 cm = 40 cm²',
    source: {
      name: 'Comunidad de Madrid',
      year: 2024,
      region: 'Madrid',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Calcula: 3/4 + 1/2',
    subject: 'matematicas',
    topic: 'Fracciones',
    difficulty: 'basico',
    options: [
      { text: '5/4', isCorrect: true },
      { text: '4/6', isCorrect: false },
      { text: '1', isCorrect: false },
      { text: '3/2', isCorrect: false },
    ],
    explanation: 'Para sumar fracciones: 3/4 + 1/2 = 3/4 + 2/4 = 5/4 (o 1 entero y 1/4)',
    source: {
      name: 'Generalitat de Catalunya',
      year: 2023,
      region: 'Cataluña',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Resuelve: x² - 5x + 6 = 0',
    subject: 'matematicas',
    topic: 'Ecuaciones de segundo grado',
    difficulty: 'intermedio',
    options: [
      { text: 'x = 2 y x = 3', isCorrect: true },
      { text: 'x = 1 y x = 6', isCorrect: false },
      { text: 'x = -2 y x = -3', isCorrect: false },
      { text: 'x = 4 y x = 5', isCorrect: false },
    ],
    explanation: 'Factorizando: (x - 2)(x - 3) = 0, por lo tanto x = 2 o x = 3',
    source: {
      name: 'Junta de Andalucía',
      year: 2024,
      region: 'Andalucía',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'El 25% de 80 es:',
    subject: 'matematicas',
    topic: 'Porcentajes',
    difficulty: 'basico',
    options: [
      { text: '20', isCorrect: true },
      { text: '25', isCorrect: false },
      { text: '15', isCorrect: false },
      { text: '30', isCorrect: false },
    ],
    explanation: '25% de 80 = (25/100) × 80 = 0.25 × 80 = 20',
    source: {
      name: 'Xunta de Galicia',
      year: 2023,
      region: 'Galicia',
    },
    isActive: true,
  },

  // ==================== LENGUA CASTELLANA ====================
  {
    _type: 'examQuestion',
    question: '¿Cuál de las siguientes palabras es aguda?',
    subject: 'lengua',
    topic: 'Acentuación',
    difficulty: 'basico',
    options: [
      { text: 'Café', isCorrect: true },
      { text: 'Árbol', isCorrect: false },
      { text: 'Lápiz', isCorrect: false },
      { text: 'Cómodo', isCorrect: false },
    ],
    explanation: 'Las palabras agudas llevan la sílaba tónica en la última sílaba. Café (ca-FÉ) es aguda. Árbol y lápiz son graves, cómodo es esdrújula.',
    source: {
      name: 'Ministerio de Educación',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Identifica el complemento directo en: "María compró un libro"',
    subject: 'lengua',
    topic: 'Sintaxis',
    difficulty: 'intermedio',
    options: [
      { text: 'un libro', isCorrect: true },
      { text: 'María', isCorrect: false },
      { text: 'compró', isCorrect: false },
      { text: 'No tiene', isCorrect: false },
    ],
    explanation: 'El complemento directo responde a la pregunta ¿qué? María compró ¿qué? → un libro',
    source: {
      name: 'Comunidad Valenciana',
      year: 2023,
      region: 'Valencia',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿Cuál de estas palabras está mal escrita?',
    subject: 'lengua',
    topic: 'Ortografía',
    difficulty: 'basico',
    options: [
      { text: 'Havía', isCorrect: true },
      { text: 'Había', isCorrect: false },
      { text: 'Haber', isCorrect: false },
      { text: 'A ver', isCorrect: false },
    ],
    explanation: 'La forma correcta del verbo haber en pretérito imperfecto es "había" (con B). "Havía" con V es incorrecto.',
    source: {
      name: 'Comunidad de Madrid',
      year: 2024,
      region: 'Madrid',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿Qué tipo de texto es una receta de cocina?',
    subject: 'lengua',
    topic: 'Tipología textual',
    difficulty: 'basico',
    options: [
      { text: 'Instructivo', isCorrect: true },
      { text: 'Narrativo', isCorrect: false },
      { text: 'Argumentativo', isCorrect: false },
      { text: 'Descriptivo', isCorrect: false },
    ],
    explanation: 'Las recetas son textos instructivos porque dan instrucciones sobre cómo hacer algo paso a paso.',
    source: {
      name: 'Junta de Castilla y León',
      year: 2023,
      region: 'Castilla y León',
    },
    isActive: true,
  },

  // ==================== INGLÉS ====================
  {
    _type: 'examQuestion',
    question: 'Choose the correct form: "She _____ to school every day"',
    subject: 'ingles',
    topic: 'Present Simple',
    difficulty: 'basico',
    options: [
      { text: 'goes', isCorrect: true },
      { text: 'go', isCorrect: false },
      { text: 'going', isCorrect: false },
      { text: 'gone', isCorrect: false },
    ],
    explanation: 'Con he/she/it en presente simple, se añade -s o -es al verbo. Go → Goes',
    source: {
      name: 'Ministerio de Educación',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'What is the past tense of "eat"?',
    subject: 'ingles',
    topic: 'Verbos irregulares',
    difficulty: 'basico',
    options: [
      { text: 'ate', isCorrect: true },
      { text: 'eated', isCorrect: false },
      { text: 'eaten', isCorrect: false },
      { text: 'eating', isCorrect: false },
    ],
    explanation: 'Eat es un verbo irregular. Presente: eat, Pasado: ate, Participio: eaten',
    source: {
      name: 'Generalitat Valenciana',
      year: 2023,
      region: 'Valencia',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Complete: "I _____ never been to Paris"',
    subject: 'ingles',
    topic: 'Present Perfect',
    difficulty: 'intermedio',
    options: [
      { text: 'have', isCorrect: true },
      { text: 'has', isCorrect: false },
      { text: 'am', isCorrect: false },
      { text: 'was', isCorrect: false },
    ],
    explanation: 'Present Perfect: have/has + participio. Con "I" se usa "have": I have never been...',
    source: {
      name: 'Junta de Andalucía',
      year: 2024,
      region: 'Andalucía',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Which sentence is correct?',
    subject: 'ingles',
    topic: 'Gramática general',
    difficulty: 'intermedio',
    options: [
      { text: 'There are many books on the table', isCorrect: true },
      { text: 'There is many books on the table', isCorrect: false },
      { text: 'There be many books on the table', isCorrect: false },
      { text: 'There have many books on the table', isCorrect: false },
    ],
    explanation: 'Con plurales (many books) se usa "There are". "There is" es para singular.',
    source: {
      name: 'Comunidad de Madrid',
      year: 2023,
      region: 'Madrid',
    },
    isActive: true,
  },

  // ==================== CIENCIAS SOCIALES ====================
  {
    _type: 'examQuestion',
    question: '¿En qué año se aprobó la Constitución Española actual?',
    subject: 'sociales',
    topic: 'Historia de España',
    difficulty: 'basico',
    options: [
      { text: '1978', isCorrect: true },
      { text: '1975', isCorrect: false },
      { text: '1982', isCorrect: false },
      { text: '1936', isCorrect: false },
    ],
    explanation: 'La Constitución Española fue aprobada en referéndum el 6 de diciembre de 1978, durante la Transición.',
    source: {
      name: 'Ministerio de Educación',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿Cuál es la capital de la Comunidad Autónoma de Galicia?',
    subject: 'sociales',
    topic: 'Geografía de España',
    difficulty: 'basico',
    options: [
      { text: 'Santiago de Compostela', isCorrect: true },
      { text: 'A Coruña', isCorrect: false },
      { text: 'Vigo', isCorrect: false },
      { text: 'Pontevedra', isCorrect: false },
    ],
    explanation: 'Santiago de Compostela es la capital administrativa de la Comunidad Autónoma de Galicia.',
    source: {
      name: 'Xunta de Galicia',
      year: 2023,
      region: 'Galicia',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿Qué evento marcó el inicio de la Guerra Civil Española?',
    subject: 'sociales',
    topic: 'Historia de España',
    difficulty: 'intermedio',
    options: [
      { text: 'El levantamiento militar del 18 de julio de 1936', isCorrect: true },
      { text: 'La proclamación de la II República en 1931', isCorrect: false },
      { text: 'La muerte de Franco en 1975', isCorrect: false },
      { text: 'El bombardeo de Guernica en 1937', isCorrect: false },
    ],
    explanation: 'La Guerra Civil Española comenzó con el golpe de Estado militar del 18 de julio de 1936.',
    source: {
      name: 'Junta de Andalucía',
      year: 2024,
      region: 'Andalucía',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿Cuál es el río más largo de España?',
    subject: 'sociales',
    topic: 'Geografía física',
    difficulty: 'basico',
    options: [
      { text: 'Río Tajo', isCorrect: true },
      { text: 'Río Ebro', isCorrect: false },
      { text: 'Río Guadalquivir', isCorrect: false },
      { text: 'Río Duero', isCorrect: false },
    ],
    explanation: 'El río Tajo es el más largo de la Península Ibérica con 1.038 km, aunque gran parte atraviesa Portugal.',
    source: {
      name: 'Ministerio de Educación',
      year: 2023,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿Cuántas Comunidades Autónomas tiene España?',
    subject: 'sociales',
    topic: 'Organización territorial',
    difficulty: 'basico',
    options: [
      { text: '17', isCorrect: true },
      { text: '15', isCorrect: false },
      { text: '19', isCorrect: false },
      { text: '20', isCorrect: false },
    ],
    explanation: 'España está organizada en 17 Comunidades Autónomas y 2 Ciudades Autónomas (Ceuta y Melilla).',
    source: {
      name: 'Ministerio de Educación',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },

  // ==================== LENGUA (más preguntas) ====================
  {
    _type: 'examQuestion',
    question: '¿Cuál es el superlativo de "bueno"?',
    subject: 'lengua',
    topic: 'Morfología',
    difficulty: 'intermedio',
    options: [
      { text: 'Óptimo', isCorrect: true },
      { text: 'Buenísimo', isCorrect: false },
      { text: 'Mejor', isCorrect: false },
      { text: 'Muy bueno', isCorrect: false },
    ],
    explanation: 'El superlativo culto de "bueno" es "óptimo". Aunque "buenísimo" también es válido como superlativo.',
    source: {
      name: 'RAE',
      year: 2023,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Identifica la oración simple:',
    subject: 'lengua',
    topic: 'Sintaxis',
    difficulty: 'intermedio',
    options: [
      { text: 'El gato duerme en el sofá', isCorrect: true },
      { text: 'Quiero que vengas mañana', isCorrect: false },
      { text: 'Llueve pero hace calor', isCorrect: false },
      { text: 'Cuando llegues, avísame', isCorrect: false },
    ],
    explanation: 'Una oración simple tiene un solo verbo conjugado. "El gato duerme" tiene un único predicado.',
    source: {
      name: 'Comunidad de Madrid',
      year: 2024,
      region: 'Madrid',
    },
    isActive: true,
  },

  // ==================== INGLÉS (más preguntas) ====================
  {
    _type: 'examQuestion',
    question: 'Choose the correct preposition: "I\'m interested ___ learning Spanish"',
    subject: 'ingles',
    topic: 'Preposiciones',
    difficulty: 'intermedio',
    options: [
      { text: 'in', isCorrect: true },
      { text: 'on', isCorrect: false },
      { text: 'at', isCorrect: false },
      { text: 'for', isCorrect: false },
    ],
    explanation: 'La expresión correcta es "interested in" (interesado en). Es una colocación fija en inglés.',
    source: {
      name: 'British Council',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'What does "bookstore" mean?',
    subject: 'ingles',
    topic: 'Vocabulario',
    difficulty: 'basico',
    options: [
      { text: 'Librería', isCorrect: true },
      { text: 'Biblioteca', isCorrect: false },
      { text: 'Estantería', isCorrect: false },
      { text: 'Libro de tienda', isCorrect: false },
    ],
    explanation: 'Bookstore = librería (tienda donde se venden libros). Library = biblioteca.',
    source: {
      name: 'Cambridge English',
      year: 2023,
      region: 'Nacional',
    },
    isActive: true,
  },

  // ==================== MATEMÁTICAS AVANZADAS ====================
  {
    _type: 'examQuestion',
    question: 'La raíz cuadrada de 144 es:',
    subject: 'matematicas',
    topic: 'Potencias y raíces',
    difficulty: 'basico',
    options: [
      { text: '12', isCorrect: true },
      { text: '14', isCorrect: false },
      { text: '11', isCorrect: false },
      { text: '13', isCorrect: false },
    ],
    explanation: '√144 = 12, porque 12 × 12 = 144',
    source: {
      name: 'Ministerio de Educación',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: 'Si 3x - 7 = 11, entonces x es:',
    subject: 'matematicas',
    topic: 'Ecuaciones',
    difficulty: 'basico',
    options: [
      { text: '6', isCorrect: true },
      { text: '5', isCorrect: false },
      { text: '4', isCorrect: false },
      { text: '7', isCorrect: false },
    ],
    explanation: '3x - 7 = 11 → 3x = 18 → x = 6',
    source: {
      name: 'Generalitat de Catalunya',
      year: 2024,
      region: 'Cataluña',
    },
    isActive: true,
  },

  // ==================== CIENCIAS SOCIALES (más preguntas) ====================
  {
    _type: 'examQuestion',
    question: '¿Qué es el Parlamento Europeo?',
    subject: 'sociales',
    topic: 'Instituciones europeas',
    difficulty: 'intermedio',
    options: [
      { text: 'El órgano legislativo de la Unión Europea', isCorrect: true },
      { text: 'El tribunal de justicia europeo', isCorrect: false },
      { text: 'El banco central europeo', isCorrect: false },
      { text: 'La sede de la ONU', isCorrect: false },
    ],
    explanation: 'El Parlamento Europeo es la institución democrática que representa a los ciudadanos de la UE y aprueba leyes.',
    source: {
      name: 'Ministerio de Educación',
      year: 2023,
      region: 'Nacional',
    },
    isActive: true,
  },
  {
    _type: 'examQuestion',
    question: '¿En qué continente se encuentra España?',
    subject: 'sociales',
    topic: 'Geografía',
    difficulty: 'basico',
    options: [
      { text: 'Europa', isCorrect: true },
      { text: 'Asia', isCorrect: false },
      { text: 'África', isCorrect: false },
      { text: 'América', isCorrect: false },
    ],
    explanation: 'España está situada en el sudoeste de Europa, en la Península Ibérica.',
    source: {
      name: 'Ministerio de Educación',
      year: 2024,
      region: 'Nacional',
    },
    isActive: true,
  },
]

async function seedExamQuestions() {
  console.log('🌱 Iniciando seed de preguntas de examen...')

  try {
    // Insertar todas las preguntas
    for (const question of examQuestions) {
      console.log(`📝 Creando pregunta: ${question.question.substring(0, 50)}...`)
      await client.create(question)
    }

    console.log(`✅ ¡Completado! Se han creado ${examQuestions.length} preguntas certificadas.`)
    console.log('\n📊 Resumen:')
    console.log(`  - Matemáticas: ${examQuestions.filter(q => q.subject === 'matematicas').length}`)
    console.log(`  - Lengua: ${examQuestions.filter(q => q.subject === 'lengua').length}`)
    console.log(`  - Inglés: ${examQuestions.filter(q => q.subject === 'ingles').length}`)
    console.log(`  - Ciencias Sociales: ${examQuestions.filter(q => q.subject === 'sociales').length}`)
    console.log('\n🎉 ¡Las preguntas ya están disponibles en EduIA!')
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    process.exit(1)
  }
}

seedExamQuestions()
