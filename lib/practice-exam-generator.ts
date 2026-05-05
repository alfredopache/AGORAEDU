export type PracticeSubject = "lengua" | "ingles" | "sociales" | "matematicas" | "naturales" | "tic"

export interface PracticeExamOption {
  text: string
  isCorrect: boolean
}

export interface PracticeExamQuestion {
  id: string
  subject: PracticeSubject
  topic: string
  prompt: string
  type: "multiple-choice" | "redaccion"
  options: PracticeExamOption[]
  answerText: string
  explanation: string
}

export interface PracticeExamPack {
  id: string
  title: string
  seed: number
  createdAt: string
  subjectLabel: string
  difficulty: string
  passage?: {
    title: string
    text: string
    source: string
    date?: string
  }
  questions: PracticeExamQuestion[]
}

export interface PracticeExamPackConfig {
  seed?: number
  difficulty?: string
  questionCount?: number
  subject?: string
  useOfficialPreset?: boolean
}

type GeneratorContext = {
  rng: () => number
  difficulty: string
}

type QuestionFactory = (context: GeneratorContext, index: number) => Omit<PracticeExamQuestion, "id" | "subject">

const SUBJECT_LABELS: Record<PracticeSubject, string> = {
  lengua: "Lengua y Literatura",
  ingles: "Ingles",
  sociales: "Ciencias Sociales",
  matematicas: "Matematicas",
  naturales: "Ciencias Naturales",
  tic: "TIC",
}

function mulberry32(seed: number) {
  return function () {
    let current = (seed += 0x6d2b79f5)
    current = Math.imul(current ^ (current >>> 15), current | 1)
    current ^= current + Math.imul(current ^ (current >>> 7), current | 61)
    return ((current ^ (current >>> 14)) >>> 0) / 4294967296
  }
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function sampleOne<T>(rng: () => number, values: T[]) {
  return values[Math.floor(rng() * values.length)]
}

function shuffle<T>(rng: () => number, values: T[]) {
  const next = [...values]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

function multipleChoice(
  rng: () => number,
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  topic: string,
) {
  const options = shuffle(rng, [
    { text: correct, isCorrect: true },
    ...distractors.slice(0, 3).map((text) => ({ text, isCorrect: false })),
  ])

  return {
    type: "multiple-choice" as const,
    prompt,
    options,
    answerText: correct,
    explanation,
    topic,
  }
}

function redaccion(
  prompt: string,
  answerText: string,
  explanation: string,
  topic: string,
) {
  return {
    type: "redaccion" as const,
    prompt,
    options: [],
    answerText,
    explanation,
    topic,
  }
}

type PassageDefinition = {
  title: string
  text: string
  summary: string
  type: string
  mainIdea: string
  focus: string
  location: string
  collaboration: string
  environment: string
}

function twoOptionChoice(
  rng: () => number,
  prompt: string,
  correct: string,
  incorrect: string,
  explanation: string,
  topic: string,
) {
  const options = shuffle(rng, [
    { text: correct, isCorrect: true },
    { text: incorrect, isCorrect: false },
  ])

  return {
    type: "multiple-choice" as const,
    prompt,
    options,
    answerText: correct,
    explanation,
    topic,
  }
}

function buildLenguaPassageQuestions(
  rng: () => number,
  passage: PassageDefinition,
  count: number,
) {
  const firstBlock = [
    () => twoOptionChoice(
      rng,
      `a) ¿Cuál es el objetivo principal del texto?`,
      passage.mainIdea,
      `Describir una actividad deportiva escolar.`,
      `El texto explica un proyecto de sostenibilidad en el instituto, por eso su objetivo no es deportivo.`,
      "idea principal",
    ),
    () => twoOptionChoice(
      rng,
      `a) ¿Qué tipo de texto presenta?`,
      `Texto informativo/comunicativo.`,
      `Texto literario.`,
      `El pasaje transmite informacion sobre un proyecto escolar, por lo que es informativo/comunicativo.`,
      "tipo de texto",
    ),
    () => twoOptionChoice(
      rng,
      `b) Según el texto, ¿qué se estudia además del huerto escolar?`,
      passage.environment,
      `La creacion de un club deportivo.`,
      `El texto menciona el estudio de fuentes renovables y movilidad activa, no actividades deportivas.`,
      "detalles",
    ),
    () => twoOptionChoice(
      rng,
      `b) En el texto, ¿qué significa la expresión 'movilidad activa'?`,
      `Usar medios como caminar o ir en bicicleta.`,
      `Ir siempre en coche eléctrico.`,
      `La movilidad activa se refiere a desplazarse a pie o en bicicleta, no al uso del coche.`,
      "vocabulario",
    ),
  ]

  const summaryTemplate = () => redaccion(
    `Redacta un texto breve en dos apartados separados:
A) Explica el tema A.
B) Explica el tema B.
`,
    `A) El tema A trata del proyecto escolar de sostenibilidad en el instituto, donde alumnos y profesores trabajan en huertos, reciclaje y ahorro de energia.
B) El tema B describe el consumo responsable y la movilidad activa como medidas para reducir el impacto ambiental y mejorar la vida cotidiana en la comunidad educativa.
`,
    `Tema A se refiere al proyecto escolar de sostenibilidad y las acciones concretas del instituto. Tema B abarca el consumo responsable y la movilidad activa como parte de la cultura ambiental del centro.`,
    "redaccion",
  )

  const remainderTemplates = [
    () => multipleChoice(
      rng,
      `¿Quiénes participan en las sesiones de comunicación?`,
      passage.collaboration,
      [
        `Solo los profesores del departamento.`,
        `Solo los alumnos de una clase.`,
        `Solo el equipo directivo del instituto.`,
      ],
      `El texto menciona a alumnos, familias y profesores, no a un unico grupo.`,
      "participantes",
    ),
    () => multipleChoice(
      rng,
      `¿Dónde se realizan visitas según el texto?`,
      passage.location,
      [
        `A un museo de historia local.`,
        `A una fabrica de coches.`,
        `A un centro comercial cercano.`,
      ],
      `El texto menciona visitas a un vivero local como parte del proyecto.`,
      "ubicacion",
    ),
    () => multipleChoice(
      rng,
      `¿Cuál es la meta final del proyecto?`,
      passage.focus,
      [
        `Aumentar las ventas de productos educativos.`,
        `Reducir el numero de horas lectivas.`,
        `Obtener un reconocimiento academico.`,
      ],
      `La meta es convertir al instituto en un ejemplo de practicas responsables y cultura ambiental.`,
      "objetivo",
    ),
  ]

  const questions = [] as Omit<PracticeExamQuestion, "id" | "subject">[]
  firstBlock.forEach((template) => questions.push(template()))
  if (count > 4) {
    questions.push(summaryTemplate())
  }

  for (let index = 5; index < count; index += 1) {
    const template = remainderTemplates[(index - 5) % remainderTemplates.length]
    questions.push(template())
  }

  return questions
}

const lenguaFactories: QuestionFactory[] = [
  ({ rng }) => {
    const cases = [
      {
        sentence: "Aunque la plataforma online tenia errores, la reunion se celebro con normalidad.",
        answer: "Oracion compuesta con valor concesivo.",
        distractors: ["Oracion interrogativa directa.", "Sintagma nominal con aposicion.", "Oracion pasiva refleja."],
        explanation: "El nexo 'aunque' introduce una subordinada concesiva.",
      },
      {
        sentence: "Si ahorras energia en casa, reduciras tu factura electrica este mes.",
        answer: "Oracion compuesta con valor condicional.",
        distractors: ["Oracion impersonal refleja.", "Oracion desiderativa.", "Sintagma verbal no finito."],
        explanation: "El nexo 'si' introduce una condicion para que se cumpla la accion principal.",
      },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      `Indica la opcion que clasifica mejor la siguiente oracion: ${current.sentence}`,
      current.answer,
      current.distractors,
      current.explanation,
      "gramatica oracional",
    )
  },
  ({ rng }) => {
    const words = [
      { base: "preciso", answer: "exacto", distractors: ["lejano", "oscuro", "dudoso"] },
      { base: "ampliar", answer: "aumentar", distractors: ["reducir", "detener", "ocultar"] },
      { base: "coherente", answer: "ordenado", distractors: ["ruidoso", "impulsivo", "parcial"] },
    ]
    const current = sampleOne(rng, words)
    return multipleChoice(
      rng,
      `Selecciona el sinonimo mas adecuado para la palabra '${current.base}'.`,
      current.answer,
      current.distractors,
      `El sinonimo correcto mantiene el significado esencial de '${current.base}'.`,
      "vocabulario",
    )
  },
  ({ rng }) => {
    const cases = [
      {
        fragment: "Una empresa local lanza una campaña para fomentar el reciclaje y reducir el consumo de plastico en la ciudad.",
        answer: "Es un texto informativo sobre reciclaje y medio ambiente.",
        distractors: [
          "Es un anuncio comercial sobre un producto nuevo.",
          "Es un texto narrativo sobre una experiencia personal.",
          "Es una poesia de opinion sobre el medio ambiente.",
        ],
        explanation: "El texto explica datos y objetivos de una campaña, por lo que es informativo.",
      },
      {
        fragment: "Los alumnos participan en un foro escolar para debatir ideas y proponer soluciones a la contaminacion urbana.",
        answer: "Es un texto social/comunicativo sobre debate escolar.",
        distractors: [
          "Es un texto expositivo sobre un tema cientifico.",
          "Es un texto instructivo que da pasos a seguir.",
          "Es un texto literario que cuenta una historia ficticia.",
        ],
        explanation: "Describe una actividad comunicativa y social donde se intercambian ideas.",
      },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      `Lee el fragmento y elige la opcion que mejor resume de que va y que tipo de texto es: ${current.fragment}`,
      current.answer,
      current.distractors,
      current.explanation,
      "resumen y tipo de texto",
    )
  },
  ({ rng }) => {
    const passages = [
      {
        fragment: "En muchos institutos se ha puesto en marcha un proyecto interdisciplinar para mejorar la sostenibilidad del centro. Los alumnos de varias clases colaboran en el diseño de un huerto escolar, el ahorro de energia y la reduccion de residuos. El trabajo incluye sesiones de comunicacion para implicar a familias y profesores, visitas a un vivero local, y un plan de accion para reciclar plastico y papel. Tambien se estudian fuentes renovables, los beneficios de la movilidad activa y la importancia de consumir productos de proximidad. La meta es que el instituto se convierta en un ejemplo de practicas responsables, con paneles informativos y actividades practicas que fomenten una cultura ambiental. A lo largo del curso se realizan encuestas para conocer las opiniones del alumnado y se organizan ferias para compartir ideas. El proyecto vincula lengua, ciencias naturales y sociales; de esta manera se hace evidente que el conocimiento se puede aplicar para mejorar el entorno cotidiano y que cada pequeño gesto contribuye a un cambio colectivo. Tambien se analiza el papel de las tecnologias digitales en la comunicacion de iniciativas sostenibles y se reflexiona sobre como la responsabilidad individual complementa los objetivos comunitarios para lograr un cambio real y visible.",
        answer: "Resume un proyecto escolar de sostenibilidad y cultura ambiental: es un texto informativo/comunicativo sobre acciones responsables.",
        distractors: [
          "Es un texto narrativo que cuenta una historia personal de un estudiante.",
          "Es una carta formal solicitando apoyo economico para una causa escolar.",
          "Es un poema sobre la naturaleza y las emociones del autor.",
        ],
        explanation: "El texto describe un proyecto escolar para impulsar practicas sostenibles y comunicar acciones responsables, por lo que es informativo y comunicativo.",
      },
    ]
    const current = sampleOne(rng, passages)
    return multipleChoice(
      rng,
      `Lee el texto (200 palabras) y elige la opcion que mejor resume de que va y que tipo de texto es: ${current.fragment}`,
      current.answer,
      current.distractors,
      current.explanation,
      "resumen y tipo de texto",
    )
  },
  ({ rng }) => {
    const texts = [
      {
        fragment: "Una campaña sobre energia renovable explica como instalar placas solares en casa.",
        answer: "Texto expositivo.",
        distractors: ["Texto dialogado.", "Texto poetico.", "Texto dramatico."],
        explanation: "Presenta informacion de forma objetiva y organizada.",
      },
      {
        fragment: "Debemos usar mas transporte publico porque disminuye la contaminacion y mejora la movilidad.",
        answer: "Texto argumentativo.",
        distractors: ["Texto instructivo.", "Texto narrativo.", "Texto descriptivo puro."],
        explanation: "Defiende una postura mediante razones y conclusion.",
      },
    ]
    const current = sampleOne(rng, texts)
    return multipleChoice(
      rng,
      `Que tipo de texto predomina en este fragmento? ${current.fragment}`,
      current.answer,
      current.distractors,
      current.explanation,
      "tipologia textual",
    )
  },
  ({ rng }) => {
    const verbs = [
      { sentence: "Marta y Luis ___ manana al instituto.", answer: "iran", distractors: ["ibas", "fuiste", "vayas"] },
      { sentence: "Si lo supiera, te lo ___.", answer: "diria", distractors: ["digo", "dijiste", "decian"] },
      { sentence: "Ayer nosotros ___ el resumen en clase.", answer: "escribimos", distractors: ["escribiremos", "escribiendo", "escribiria"] },
    ]
    const current = sampleOne(rng, verbs)
    return multipleChoice(
      rng,
      `Elige la forma verbal correcta para completar la frase: ${current.sentence}`,
      current.answer,
      current.distractors,
      "La opcion correcta mantiene la concordancia temporal y personal de la oracion.",
      "morfologia verbal",
    )
  },
]

const inglesFactories: QuestionFactory[] = [
  ({ rng }) => {
    const cases = [
      { prompt: "Choose the correct option: She ___ a new webinar about green technology every week.", answer: "attends", distractors: ["attend", "is attending", "attended"] },
      { prompt: "Choose the correct option: They ___ a video call when the message arrived.", answer: "were having", distractors: ["have", "had had", "are having"] },
      { prompt: "Choose the correct option: I have worked remotely ___ 2020.", answer: "since", distractors: ["for", "during", "from"] },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      current.prompt,
      current.answer,
      current.distractors,
      "The correct answer matches the tense or preposition required by the sentence.",
      "grammar and usage",
    )
  },
  ({ rng }) => {
    const cases = [
      { word: "cheap", answer: "inexpensive", distractors: ["dangerous", "crowded", "ancient"] },
      { word: "usually", answer: "normally", distractors: ["suddenly", "carefully", "silently"] },
      { word: "job", answer: "work", distractors: ["weather", "journey", "ticket"] },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      `Choose the word closest in meaning to '${current.word}'.`,
      current.answer,
      current.distractors,
      "The correct option keeps the same meaning in a common everyday context.",
      "vocabulary",
    )
  },
  ({ rng }) => {
    const cases = [
      { text: "You must wear a helmet when you ride a motorbike.", answer: "obligation", distractors: ["permission", "habit", "possibility"] },
      { text: "You may use your phone after the exam.", answer: "permission", distractors: ["obligation", "prohibition", "prediction"] },
      { text: "It might rain this afternoon.", answer: "possibility", distractors: ["order", "routine", "ability"] },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      `What does the modal expression indicate in this sentence? ${current.text}`,
      current.answer,
      current.distractors,
      "Modal verbs often express obligation, permission or possibility depending on context.",
      "modal verbs",
    )
  },
  ({ rng }) => {
    const cases = [
      { question: "Where ___ your brother work?", answer: "does", distractors: ["do", "is", "has"] },
      { question: "How many languages ___ she speak?", answer: "can", distractors: ["is", "does", "was"] },
      { question: "What time ___ the film start yesterday?", answer: "did", distractors: ["does", "has", "was"] },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      `Complete the question correctly: ${current.question}`,
      current.answer,
      current.distractors,
      "The auxiliary must agree with the tense and structure of the question.",
      "question formation",
    )
  },
]

const socialesFactories: QuestionFactory[] = [
  ({ rng }) => {
    const cases = [
      {
        prompt: "Que institucion de la Union Europea esta implicada directamente en el Pacto Verde Europeo?",
        answer: "El Parlamento Europeo.",
        distractors: ["El Tribunal de Cuentas.", "El Banco Central Europeo.", "La Agencia Europea del Medicamento."],
        explanation: "El Parlamento Europeo impulsa politicas clave dentro del Pacto Verde Europeo.",
      },
      {
        prompt: "Que institucion del Estado espanol ejerce el poder ejecutivo?",
        answer: "El Gobierno.",
        distractors: ["El Congreso por si solo.", "El Tribunal Supremo.", "La Fiscalia General del Estado."],
        explanation: "El poder ejecutivo corresponde al Gobierno.",
      },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(rng, current.prompt, current.answer, current.distractors, current.explanation, "instituciones")
  },
  ({ rng }) => {
    const cases = [
      {
        prompt: "Que hecho marca el inicio de la Revolucion Francesa?",
        answer: "La toma de la Bastilla en 1789.",
        distractors: ["La Revolucion Rusa de 1917.", "La firma del Tratado de Versalles.", "La marcha sobre Roma."],
        explanation: "La toma de la Bastilla simboliza el arranque de la Revolucion Francesa.",
      },
      {
        prompt: "Que etapa historica se asocia con la expansion colonial europea de finales del siglo XIX?",
        answer: "El imperialismo.",
        distractors: ["El feudalismo.", "La transicion democratica.", "La desamortizacion."],
        explanation: "El imperialismo describe la expansion colonial y el reparto de territorios.",
      },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(rng, current.prompt, current.answer, current.distractors, current.explanation, "historia")
  },
  ({ rng }) => {
    const cases = [
      {
        prompt: "Que indicador refleja el envejecimiento de una poblacion?",
        answer: "Una base estrecha en la piramide de poblacion.",
        distractors: ["Un aumento del relieve montanoso.", "Mas precipitacion anual.", "Un saldo comercial positivo."],
        explanation: "Una base estrecha indica baja natalidad y envejecimiento demografico.",
      },
      {
        prompt: "Que elemento explica mejor la concentracion de poblacion en el litoral mediterraneo espanol?",
        answer: "La actividad turistica y de servicios.",
        distractors: ["La presencia de tundra.", "La mineria del carbon en expansion.", "La baja accesibilidad a infraestructuras."],
        explanation: "El litoral concentra turismo, industria y servicios, lo que atrae poblacion.",
      },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(rng, current.prompt, current.answer, current.distractors, current.explanation, "geografia humana")
  },
  ({ rng }) => {
    const cases = [
      {
        prompt: "Cual es la comunidad autonoma con dos ciudades autonomas vinculadas administrativamente a Espana en el norte de Africa?",
        answer: "Ninguna; Ceuta y Melilla son ciudades autonomas, no comunidad autonoma.",
        distractors: ["Andalucia.", "Canarias.", "Region de Murcia."],
        explanation: "Ceuta y Melilla tienen estatus de ciudades autonomas propias.",
      },
      {
        prompt: "Que actividad economica pertenece al sector terciario?",
        answer: "La gestion de un hotel.",
        distractors: ["La extraccion de hierro.", "El cultivo de cereales.", "La fabricacion de muebles."],
        explanation: "El sector terciario agrupa servicios como hosteleria, comercio o transporte.",
      },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(rng, current.prompt, current.answer, current.distractors, current.explanation, "territorio y economia")
  },
]

const matematicasFactories: QuestionFactory[] = [
  ({ rng }) => {
    const price = randomInt(rng, 40, 120)
    const discount = sampleOne(rng, [10, 15, 20, 25])
    const discounted = Number((price * (1 - discount / 100)).toFixed(2))
    return multipleChoice(
      rng,
      `Un servicio de streaming cuesta ${price} euros al mes y tiene un descuento del ${discount}%. Cual es su precio final?`,
      `${discounted.toFixed(2)} euros`,
      [`${(price - discount).toFixed(2)} euros`, `${(price * (discount / 100)).toFixed(2)} euros`, `${(price + discount).toFixed(2)} euros`],
      "El precio final se obtiene restando al precio inicial el porcentaje de descuento aplicado.",
      "porcentajes",
    )
  },
  ({ rng }) => {
    const a = randomInt(rng, 2, 8)
    const b = randomInt(rng, 3, 12)
    const c = a + b
    return multipleChoice(
      rng,
      `Resuelve la ecuacion x + ${a} = ${c}.`,
      `${b}`,
      [`${a}`, `${c}`, `${c + a}`],
      "Despejar x consiste en restar el mismo numero en ambos lados de la igualdad.",
      "ecuaciones",
    )
  },
  ({ rng }) => {
    const numerator = randomInt(rng, 1, 4)
    const denominator = randomInt(rng, numerator + 1, 9)
    const multiplier = randomInt(rng, 2, 5)
    return multipleChoice(
      rng,
      `Cual de estas fracciones es equivalente a ${numerator}/${denominator}?`,
      `${numerator * multiplier}/${denominator * multiplier}`,
      [`${numerator + multiplier}/${denominator * multiplier}`, `${numerator * multiplier}/${denominator + multiplier}`, `${numerator + denominator}/${denominator * multiplier}`],
      "Dos fracciones son equivalentes si multiplicas numerador y denominador por el mismo numero.",
      "fracciones",
    )
  },
  ({ rng }) => {
    const radius = randomInt(rng, 3, 10)
    const area = Number((Math.PI * radius * radius).toFixed(2))
    return multipleChoice(
      rng,
      `Calcula el area aproximada de un circulo de radio ${radius} cm. Usa pi = 3,1416.`,
      `${area.toFixed(2)} cm2`,
      [`${(2 * Math.PI * radius).toFixed(2)} cm2`, `${(Math.PI * radius).toFixed(2)} cm2`, `${(radius * radius).toFixed(2)} cm2`],
      "El area del circulo es pi por el radio al cuadrado.",
      "geometria",
    )
  },
  ({ rng }) => {
    const units = randomInt(rng, 4, 9)
    const price = randomInt(rng, 3, 7)
    const total = units * price
    return multipleChoice(
      rng,
      `Si compras ${units} cuadernos a ${price} euros cada uno, cuanto pagas en total?`,
      `${total} euros`,
      [`${units + price} euros`, `${total - price} euros`, `${price} euros`],
      "Es un problema de proporcionalidad directa: cantidad por precio unitario.",
      "proporcionalidad",
    )
  },
]

const naturalesFactories: QuestionFactory[] = [
  ({ rng }) => {
    const prompt = "Que organulo celular realiza principalmente la fotosintesis en las celulas vegetales?"
    return multipleChoice(
      rng,
      prompt,
      "El cloroplasto.",
      ["El ribosoma.", "La mitocondria.", "El lisosoma."],
      "La fotosintesis se realiza en los cloroplastos gracias a la clorofila.",
      "celula y fotosintesis",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Cual es el recorrido correcto del alimento en el aparato digestivo humano?",
      "Boca, faringe, esofago, estomago, intestino delgado e intestino grueso.",
      [
        "Boca, traquea, estomago, intestino grueso e intestino delgado.",
        "Boca, faringe, pulmones, higado e intestino grueso.",
        "Boca, laringe, pancreas, estomago e intestino delgado.",
      ],
      "Ese es el orden anatomico normal del proceso digestivo.",
      "aparato digestivo",
    )
  },
  ({ rng }) => {
    const cases = [
      { prompt: "Que relacion se establece entre una abeja y una flor cuando la abeja obtiene nectar y la flor es polinizada?", answer: "Mutualismo." },
      { prompt: "Como se llama la relacion en la que un organismo se beneficia y el otro no resulta perjudicado ni beneficiado?", answer: "Comensalismo." },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      current.prompt,
      current.answer,
      ["Parasitismo.", "Depredacion.", "Competencia."],
      "La definicion debe encajar con el efecto que se produce entre los organismos.",
      "ecosistemas",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Que sistema del cuerpo humano transporta oxigeno y nutrientes por todo el organismo?",
      "El sistema circulatorio.",
      ["El sistema oseo.", "El sistema excretor.", "El sistema endocrino."],
      "La sangre distribuye oxigeno y nutrientes a traves del sistema circulatorio.",
      "cuerpo humano",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Que practica ayuda mas a prevenir enfermedades infecciosas?",
      "Lavarse las manos con frecuencia y mantener la vacunacion al dia.",
      ["Tomar antibioticos sin receta.", "Dormir menos horas para estudiar mas.", "Evitar beber agua en verano."],
      "La higiene y la vacunacion reducen el contagio y la gravedad de muchas enfermedades.",
      "salud y prevencion",
    )
  },
]

const ticFactories: QuestionFactory[] = [
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Que formula de hoja de calculo suma los valores del rango A1 a A5?",
      "=SUMA(A1:A5)",
      ["=PROMEDIO(A1:A5)", "=A1+A5", "=SUMAR(A1;A5)"],
      "La funcion SUMA permite agregar todos los valores de un rango continuo.",
      "hojas de calculo",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Cual de los siguientes elementos es hardware?",
      "El teclado.",
      ["El navegador web.", "El sistema operativo.", "La hoja de calculo."],
      "El hardware es la parte fisica del equipo; el teclado es un periferico fisico.",
      "hardware y software",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Que practica mejora mas la seguridad de una cuenta online?",
      "Usar una contrasena larga y activar la verificacion en dos pasos.",
      ["Reutilizar la misma clave en todos los servicios.", "Compartir la clave con companeros de clase.", "Guardar la contrasena en un papel visible."],
      "Una contrasena robusta y el segundo factor reducen el riesgo de acceso no autorizado.",
      "ciberseguridad",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Que tecnologia se usa para entrenar modelos de inteligencia artificial con grandes cantidades de datos?",
      "El machine learning.",
      ["La imprenta.", "El lenguaje de marca HTML.", "Un sistema de archivos."],
      "El machine learning es la rama de la IA que aprende patrones a partir de datos.",
      "inteligencia artificial",
    )
  },
  ({ rng }) => {
    const cases = [
      { ext: ".csv", answer: "Un archivo de datos tabulares separado por comas." },
      { ext: ".pdf", answer: "Un documento pensado para mantener el formato al compartirlo." },
      { ext: ".png", answer: "Una imagen digital sin perdida de calidad en la compresion." },
    ]
    const current = sampleOne(rng, cases)
    return multipleChoice(
      rng,
      `Que describe mejor la extension ${current.ext}?`,
      current.answer,
      ["Un archivo ejecutable del sistema.", "Un paquete comprimido siempre editable.", "Un formato exclusivo para audio."],
      "Las extensiones ayudan a identificar el tipo y uso mas comun de un archivo.",
      "formatos digitales",
    )
  },
  ({ rng }) => {
    return multipleChoice(
      rng,
      "Que dispositivo conecta varios equipos dentro de una misma red local?",
      "Un switch.",
      ["Un microfono.", "Una webcam.", "Un proyector."],
      "El switch distribuye la conexion entre varios equipos de la red local.",
      "redes",
    )
  },
]

const FACTORY_MAP: Record<PracticeSubject, QuestionFactory[]> = {
  lengua: lenguaFactories,
  ingles: inglesFactories,
  sociales: socialesFactories,
  matematicas: matematicasFactories,
  naturales: naturalesFactories,
  tic: ticFactories,
}

function mapRequestedSubject(subject?: string): PracticeSubject | "mixto" {
  if (!subject || subject === "mixto") return "mixto"
  if (subject === "lengua" || subject === "lengua-literatura" || subject === "lengua y literatura") return "lengua"
  if (subject === "matematicas") return "matematicas"
  if (subject === "ingles") return "ingles"
  if (subject === "sociales") return "sociales"
  if (subject === "naturales") return "naturales"
  if (subject === "tic") return "tic"
  return "mixto"
}

function buildMixedPlan(questionCount: number) {
  const order: PracticeSubject[] = ["lengua", "ingles", "sociales", "matematicas", "naturales", "tic"]
  const plan: PracticeSubject[] = []
  for (let index = 0; index < questionCount; index += 1) {
    plan.push(order[index % order.length])
  }
  return plan
}

export function generatePracticeExamPack(config: PracticeExamPackConfig = {}): PracticeExamPack {
  const seed = config.seed ?? Math.floor(Math.random() * 1_000_000_000)
  const rng = mulberry32(seed)
  const difficulty = config.difficulty || "intermedio"
  const requestedSubject = mapRequestedSubject(config.subject)
  const questionCount = config.useOfficialPreset
    ? 36
    : Math.max(6, Math.min(config.questionCount || 12, 36))
  const plan = requestedSubject === "mixto"
    ? buildMixedPlan(questionCount)
    : Array.from({ length: questionCount }, () => requestedSubject)

  const passage = requestedSubject === "lengua"
    ? sampleOne(rng, [
      {
        title: "Proyecto escolar de sostenibilidad",
        text: `Valencia, 4 de mayo de 2026. El País ha informado sobre un instituto de la provincia que ha iniciado un proyecto educativo para mejorar la sostenibilidad y reducir el impacto ambiental del centro.
Los alumnos de varias clases trabajan juntos en el diseño de un huerto escolar y en la optimizacion del ahorro energetico.
El plan contempla la gestion de residuos y la introduccion de procesos de reciclaje de plastico y papel.
El proyecto incluye sesiones de comunicacion para implicar a familias y profesores en la iniciativa.
Tambien se han programado visitas a un vivero local para conocer tecnicas de cultivo sostenible.
Los estudiantes estudian fuentes renovables como la energia solar y el uso responsable del agua.
El reportaje destaca que el instituto aspira a ser un ejemplo de practicas responsables.
Se han instalado paneles informativos por todo el centro para sensibilizar a la comunidad educativa.
Entre las acciones estan talleres, campañas y eventos centrados en la movilidad activa.
El centro apuesta por el consumo de productos de proximidad en su cafeteria escolar.
A lo largo del curso se hacen encuestas para detectar ideas y necesidades del alumnado.
El equipo docente organiza ferias de sostenibilidad para compartir iniciativas con las familias.
El proyecto vincula contenidos de lengua, ciencias naturales y sociales en actividades practicas.
El informe subraya que cada gesto cotidiano puede contribuir a un cambio colectivo.
Tambien se valora el uso de tecnologia digital para difundir iniciativas ecoeficientes.
La iniciativa sostiene que la responsabilidad individual debe complementar las medidas comunitarias.
Los organizadores revisan los resultados de forma periodica y ajustan el plan segun los datos.
Finalmente, se destaca el compromiso del instituto con una cultura ambiental activa y participativa.
`,
        source: "El País",
        date: "4 de mayo de 2026",
        summary: "Resume un proyecto escolar de sostenibilidad y cultura ambiental: es un texto informativo/comunicativo sobre acciones responsables.",
        type: "Texto informativo/comunicativo.",
        mainIdea: "Presentar un proyecto escolar sobre sostenibilidad, reciclaje y responsabilidad ambiental.",
        focus: "Convertir al instituto en un ejemplo de practicas responsables y cultura ambiental.",
        location: "Visitas a un vivero local.",
        collaboration: "Alumnos, familias y profesores.",
        environment: "Estudiar fuentes renovables, movilidad activa y productos de proximidad.",
      },
      {
        title: "Campaña de consumo responsable",
        text: `Madrid, 4 de mayo de 2026. ABC publica hoy el lanzamiento de una campaña escolar destinada a reforzar el consumo responsable entre los alumnos.
El reportaje explica que los centros educativos han preparado charlas y talleres para clasificar residuos correctamente.
Los organizadores pretenden reducir el uso de plastico y promover alternativas sostenibles.
Se anima a estudiantes y familias a elegir productos locales siempre que sea posible.
La estrategia incluye la creacion de materiales informativos y guias sencillas para el dia a dia.
Tambien se ha invitado a expertos en economia circular para asesorar las actividades.
Los alumnos aprenden a distinguir un uso eficiente de la energia y el agua.
A traves de comparativas practicas, la iniciativa muestra el impacto ambiental de cada decision.
La campana subraya que las decisiones de compra tienen efectos directos sobre el entorno.
Se han producido videos educativos y contenidos para redes sociales del propio instituto.
El objetivo es que los jovenes se conviertan en agentes de cambio dentro de su escuela.
Tambien se ha convocado un concurso de propuestas para reducir residuos y reutilizar materiales.
Los grupos escolares trabajan en ideas para evitar los desechos de un solo uso.
La campaña propone un seguimiento con indicadores claros y metas mensuales.
Las sesiones de retroalimentacion ayudan a ajustar las actividades segun los resultados.
Los profesores y alumnos analizan los avances y comparten sus conclusiones.
El texto afirma que el compromiso colectivo es clave para la efectividad del proyecto.
El enfoque es mostrar que la sostenibilidad puede integrarse en las rutinas escolares.
El cierre remarca la importancia de formar habitos responsables desde la escuela.
`,
        source: "ABC",
        date: "4 de mayo de 2026",
        summary: "Resume una campana educativa de consumo responsable: es un texto informativo/comunicativo sobre sostenibilidad personal y comunitaria.",
        type: "Texto informativo/comunicativo.",
        mainIdea: "Explicar una campana escolar para fomentar el consumo responsable y la economia circular.",
        focus: "Concienciar a los estudiantes sobre el impacto ambiental de sus decisiones diarias.",
        location: "Talleres, charlas y actividades en redes sociales.",
        collaboration: "Estudiantes, profesores y expertos.",
        environment: "Reducir plastico, ahorrar energia y apoyar productos locales.",
      },
    ])
    : undefined

  const generated: PracticeExamQuestion[] = []
  const seenPrompts = new Set<string>()
  const counters = new Map<PracticeSubject, number>()

  if (requestedSubject === "lengua" && passage) {
    const passageQuestions = buildLenguaPassageQuestions(rng, passage, questionCount)
    passageQuestions.forEach((question, index) => {
      generated.push({
        id: `practice-lengua-${index + 1}-${Math.floor(rng() * 100000)}`,
        subject: "lengua",
        ...question,
      })
    })
  } else {
    for (const subject of plan) {
      const factories = FACTORY_MAP[subject]
      const nextIndex = counters.get(subject) || 0
      let attempts = 0

      while (attempts < factories.length * 3) {
        const factory = factories[(nextIndex + attempts) % factories.length]
        const question = factory({ rng, difficulty }, generated.length)
        const dedupeKey = `${subject}|${question.prompt}`
        attempts += 1
        if (seenPrompts.has(dedupeKey)) {
          continue
        }
        seenPrompts.add(dedupeKey)
        counters.set(subject, nextIndex + attempts)
        generated.push({
          id: `practice-${subject}-${generated.length + 1}-${Math.floor(rng() * 100000)}`,
          subject,
          ...question,
        })
        break
      }
    }
  }

  const subjectLabel = requestedSubject === "mixto" || config.useOfficialPreset
    ? "Mixto Grado Medio"
    : SUBJECT_LABELS[requestedSubject]

  return {
    id: `practice-pack-${seed}`,
    title: `Simulador de practica - ${subjectLabel}`,
    seed,
    createdAt: new Date().toISOString(),
    subjectLabel,
    difficulty,
    passage,
    questions: generated,
  }
}