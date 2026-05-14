function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function pickVariant<T>(variants: T[], seedSource: string, offset: number = 0) {
  if (variants.length === 0) return null
  const index = (hashString(seedSource) + offset) % variants.length
  return variants[index]
}

function buildMathOptionSet(correctValue: number) {
  const distractors = [
    correctValue * -1,
    correctValue + 2,
    correctValue - 2,
    correctValue + 3,
    correctValue - 3,
  ].filter((value, index, array) => Number.isFinite(value) && array.indexOf(value) === index && value !== correctValue)

  const options = [correctValue, ...distractors.slice(0, 3)]
  return options.slice(0, 4)
}

export type DatasetQuestionEnrichment = {
  question: string
  options?: string[]
  correctIndex?: number
  explanation?: string
  topic?: string
}

export function enrichDatasetQuestion(item: any, parsedOptions: string[] = [], variantOffset: number = 0): DatasetQuestionEnrichment | null {
  const seed = `${item.ID_Unico || item.ID || item.Año || "0"}-${item.Tema || item.SUBTEMA || item.Pregunta || ""}`
  const subject = normalizeText(item.Materia || item.materia || item.SUBJECT)
  const topic = normalizeText(item.Tema || item.SUBTEMA || item.topic)
  const question = normalizeText(item.Pregunta || item.question || item.enunciado)

  if (subject.includes("ingl") && (topic.includes("tiempos verbales") || topic.includes("formas verbales") || question.includes("correct tense") || question.includes("correct form") || question.includes("verb tense"))) {
    const variants = [
      {
        question: "Choose the correct tense to complete the sentence: I usually ___ breakfast at seven o'clock before going to school.",
        options: ["Present simple", "Past simple", "Present continuous", "Present perfect"],
        correctIndex: 0,
        explanation: "Se usa present simple porque describe una rutina habitual marcada por 'usually'.",
      },
      {
        question: "Choose the correct tense to complete the sentence: Yesterday we ___ to the museum with our teacher.",
        options: ["Present simple", "Past simple", "Present continuous", "Present perfect"],
        correctIndex: 1,
        explanation: "Se usa past simple porque 'yesterday' indica una acción terminada en el pasado.",
      },
      {
        question: "Choose the correct tense to complete the sentence: Look! The children ___ in the playground right now.",
        options: ["Present simple", "Past simple", "Present continuous", "Present perfect"],
        correctIndex: 2,
        explanation: "Se usa present continuous porque la acción está ocurriendo en este momento y aparece 'right now'.",
      },
      {
        question: "Choose the correct tense to complete the sentence: She ___ already finished her homework, so she can go out now.",
        options: ["Present simple", "Past simple", "Present continuous", "Present perfect"],
        correctIndex: 3,
        explanation: "Se usa present perfect porque 'already' conecta una acción completada con su resultado en el presente.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("matem") && (topic.includes("ecuacion") || question.includes("ecuacion de primer grado"))) {
    const variants = [
      { a: 3, b: 5, c: 20 },
      { a: 4, b: -7, c: 13 },
      { a: 5, b: 8, c: 33 },
      { a: 2, b: -9, c: 5 },
    ]
    const variant = pickVariant(variants, seed, variantOffset)
    if (!variant) return null
    const correctValue = (variant.c - variant.b) / variant.a
    const options = buildMathOptionSet(correctValue).map((value, index) => {
      if (index === 0) return `x = ${value}`
      if (index === 1) return `x = ${value}`
      if (index === 2) return `x = ${value}`
      return "No tiene solucion"
    })
    return {
      question: `Resuelve la ecuacion ${variant.a}x ${variant.b >= 0 ? "+" : "-"} ${Math.abs(variant.b)} = ${variant.c}.`,
      options,
      correctIndex: 0,
      explanation: `Primero aislas el termino con x: ${variant.a}x = ${variant.c - variant.b}. Despues divides entre ${variant.a} y obtienes x = ${correctValue}.`,
    }
  }

  if (subject.includes("matem") && (topic.includes("fracciones") || topic.includes("decimales") || question.includes("operaciones con fracciones") || question.includes("operaciones con enteros") || question.includes("decimales"))) {
    const variants = [
      {
        question: "Calcula el resultado de 3/4 + 1/2.",
        options: ["5/4", "4/6", "1/4", "3/8"],
        correctIndex: 0,
        explanation: "Convierte 1/2 en 2/4 y suma: 3/4 + 2/4 = 5/4.",
      },
      {
        question: "Calcula el resultado de 2.5 + 1.75.",
        options: ["4.25", "3.25", "4.5", "4.2"],
        correctIndex: 0,
        explanation: "Alinea los decimales y suma: 2.50 + 1.75 = 4.25.",
      },
      {
        question: "Calcula el resultado de 5/6 - 1/3.",
        options: ["1/2", "4/3", "2/3", "1/3"],
        correctIndex: 0,
        explanation: "Pasa 1/3 a sextos: 1/3 = 2/6. Entonces 5/6 - 2/6 = 3/6 = 1/2.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("matem") && (topic.includes("area") || topic.includes("perimetro") || topic.includes("volumen") || question.includes("area o perimetro"))) {
    const variants = [
      {
        question: "Un rectangulo mide 8 cm de largo y 5 cm de ancho. Cual es su area?",
        options: ["40 cm2", "26 cm2", "13 cm2", "80 cm2"],
        correctIndex: 0,
        explanation: "El area de un rectangulo se calcula multiplicando largo por ancho: 8 x 5 = 40 cm2.",
      },
      {
        question: "Un rectangulo mide 9 cm de largo y 4 cm de ancho. Cual es su perimetro?",
        options: ["26 cm", "36 cm", "13 cm", "18 cm"],
        correctIndex: 0,
        explanation: "El perimetro es 2 x (9 + 4) = 2 x 13 = 26 cm.",
      },
      {
        question: "Un cubo tiene una arista de 3 cm. Cual es su volumen?",
        options: ["27 cm3", "9 cm3", "18 cm3", "12 cm3"],
        correctIndex: 0,
        explanation: "El volumen del cubo es lado x lado x lado: 3 x 3 x 3 = 27 cm3.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("tic") && (topic.includes("programas informaticos") || topic.includes("aplicaciones digitales") || topic.includes("herramientas digitales"))) {
    const variants = [
      {
        question: "Que programa es el mas adecuado para crear una presentacion con diapositivas para clase?",
        options: ["PowerPoint o Impress", "Excel o Calc", "Bloc de notas", "Antivirus"],
        correctIndex: 0,
        explanation: "Los programas de presentaciones estan pensados para crear diapositivas, insertar imagenes y exponer contenido visual.",
      },
      {
        question: "Que aplicacion usarías principalmente para redactar una carta formal con formato y correccion ortografica?",
        options: ["Word o Writer", "Paint", "Calculadora", "Reproductor multimedia"],
        correctIndex: 0,
        explanation: "Un procesador de textos permite escribir, revisar y dar formato a documentos como cartas o informes.",
      },
      {
        question: "Que herramienta digital sirve mejor para organizar datos en tablas y hacer calculos automaticos?",
        options: ["Excel o Calc", "PowerPoint o Impress", "Chrome o Firefox", "Bloc de notas"],
        correctIndex: 0,
        explanation: "Las hojas de calculo permiten usar celdas, formulas y graficos para trabajar con datos numericos.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("tic") && (topic.includes("servicios de internet") || topic.includes("servicios web") || topic.includes("funcionamiento de internet"))) {
    const variants = [
      {
        question: "Que servicio de internet se usa principalmente para enviar y recibir mensajes entre usuarios?",
        options: ["Correo electronico", "Sistema operativo", "Disco duro", "Procesador de textos"],
        correctIndex: 0,
        explanation: "El correo electronico es un servicio de internet diseñado para intercambiar mensajes y archivos entre usuarios.",
      },
      {
        question: "Que servicio permite acceder a paginas enlazadas mediante un navegador?",
        options: ["World Wide Web", "Bluetooth", "Memoria RAM", "Escaner"],
        correctIndex: 0,
        explanation: "La Web permite consultar paginas y recursos a traves de enlaces usando un navegador.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("tic") && (topic.includes("hardware y software") || topic.includes("componentes del ordenador") || topic.includes("conceptos informaticos"))) {
    const variants = [
      {
        question: "Cual de los siguientes elementos es software?",
        options: ["Sistema operativo", "Teclado", "Monitor", "Memoria RAM"],
        correctIndex: 0,
        explanation: "El sistema operativo es un programa; teclado, monitor y RAM son componentes fisicos del ordenador.",
      },
      {
        question: "Que componente se encarga de procesar la informacion y ejecutar instrucciones en el ordenador?",
        options: ["CPU o procesador", "Pantalla", "Ratón", "Impresora"],
        correctIndex: 0,
        explanation: "La CPU interpreta y ejecuta instrucciones, por eso se considera el cerebro del ordenador.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("leng") && (topic.includes("sinon") || question.includes("sinonimos") || question.includes("sinonimia"))) {
    const variants = [
      {
        question: "¿Cual es el sinonimo mas cercano a la palabra 'comenzar'?",
        options: ["Empezar", "Terminar", "Continuar", "Parar"],
        correctIndex: 0,
        explanation: "'Empezar' y 'comenzar' son sinonimos con significado muy parecido, ambos indican el inicio de una accion.",
      },
      {
        question: "¿Cual es el sinonimo mas adecuado para 'feliz' en el siguiente contexto: 'Estoy muy ___'?",
        options: ["Contento", "Triste", "Cansado", "Furioso"],
        correctIndex: 0,
        explanation: "'Contento' es un sinonimo de 'feliz' con significado muy similar en este contexto.",
      },
      {
        question: "¿Cual es el sinonimo de 'grande'?",
        options: ["Enorme", "Diminuto", "Mediano", "Pequeño"],
        correctIndex: 0,
        explanation: "'Enorme' es un sinonimo de 'grande' que amplifica el significado, pero son palabras con sentido similar.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("leng") && (topic.includes("tipolog") || question.includes("tipo de texto") || question.includes("genero textual"))) {
    const variants = [
      {
        question: "¿Que tipo de texto es una noticia periodistica?",
        options: ["Texto periodistico", "Texto literario", "Texto academico", "Texto publicitario"],
        correctIndex: 0,
        explanation: "Las noticias periodisticas pertenecen al ambito de la prensa y tienen como objetivo informar sobre hechos actuales.",
      },
      {
        question: "¿Cual es el genero del siguiente texto: 'Era una noche oscura cuando el viajero llego a la ciudad...'?",
        options: ["Narrativo", "Descriptivo", "Argumentativo", "Instructivo"],
        correctIndex: 0,
        explanation: "Es un texto narrativo porque relata una sucesion de hechos o eventos en el tiempo.",
      },
      {
        question: "¿En que ambito se utiliza principalmente una carta formal dirigida a una institucion?",
        options: ["Ambito administrativo", "Ambito literario", "Ambito publicitario", "Ambito digital"],
        correctIndex: 0,
        explanation: "Las cartas formales dirigidas a instituciones se utilizan en el ambito administrativo y academico.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if (subject.includes("leng") && (topic.includes("partes del discurso") || topic.includes("categoria gramatical") || topic.includes("analisis morfologico") || question.includes("tipo de palabra"))) {
    const variants = [
      {
        question: "¿Que categoria gramatical representa la palabra 'correr' en la frase 'El nino corre en el parque'?",
        options: ["Verbo", "Sustantivo", "Adjetivo", "Preposicion"],
        correctIndex: 0,
        explanation: "'Correr' es un verbo que indica la accion que realiza el sujeto.",
      },
      {
        question: "¿Cual es la categoria gramatical de 'azul' en la oracion 'El cielo es azul'?",
        options: ["Adjetivo", "Sustantivo", "Verbo", "Adverbio"],
        correctIndex: 0,
        explanation: "'Azul' es un adjetivo calificativo que describe una cualidad del sustantivo 'cielo'.",
      },
      {
        question: "¿Que parte de la oracion es 'en la mesa' en la frase 'El libro esta en la mesa'?",
        options: ["Complemento circunstancial", "Sujeto", "Predicado", "Verbo"],
        correctIndex: 0,
        explanation: "'En la mesa' es un complemento circunstancial que indica el lugar donde se encuentra el libro.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if ((subject.includes("sociales") || subject.includes("hist") || subject.includes("geogr")) && (topic.includes("concepto hist") || question.includes("concepto historico") || question.includes("definir concepto"))) {
    const variants = [
      {
        question: "¿Que es la Revolucion Francesa?",
        options: ["Un movimiento politico y social (1789-1799) que transformo Francia e influyó en Europa", "Una rebelion contra el rey Felipe II", "Un conflicto entre Francia e Inglaterra", "Una guerra civil en Paris"],
        correctIndex: 0,
        explanation: "La Revolucion Francesa fue un proceso de cambio radical que termino con el Antiguo Regimen y creo nuevas formas de gobierno basadas en derechos humanos.",
      },
      {
        question: "¿Que significa 'colonialismo'?",
        options: ["El control politico y economico de un territorio por parte de una potencia extranjera", "El comercio entre paises", "Un tipo de religion", "Un sistema de educacion"],
        correctIndex: 0,
        explanation: "El colonialismo fue un sistema mediante el cual potencias europeas dominaban territorios en Africa, Asia y America para obtener recursos y poder.",
      },
      {
        question: "¿Cual fue la importancia del Renacimiento?",
        options: ["Impulso el resurgimiento de la cultura grecolatina y desarrollo del humanismo durante los siglos XIV-XVI", "Fue una guerra religiosa", "Prohibio la ciencia", "Detuvo el progreso de Europa"],
        correctIndex: 0,
        explanation: "El Renacimiento significo el retorno a los valores de la antigüedad clasica y el surgimiento de nuevas formas de pensar que priorizaban la razon y la observacion.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if ((subject.includes("sociales") || subject.includes("hist") || subject.includes("geogr")) && (topic.includes("orden crono") || topic.includes("cronologia") || question.includes("orden de los eventos"))) {
    const variants = [
      {
        question: "¿En que orden cronologico ocurrieron estos eventos?",
        options: ["Caida del Imperio Romano (476) → Renacimiento (XIV-XVI) → Revolucion Francesa (1789)", "Revolucion Francesa → Caida del Imperio Romano → Renacimiento", "Renacimiento → Revolucion Francesa → Caida del Imperio Romano", "Todas ocurrieron simultaneamente"],
        correctIndex: 0,
        explanation: "El orden historico correcto es: primero cayo el Imperio Romano (476), luego el Renacimiento (siglos XIV-XVI), y finalmente la Revolucion Francesa (1789).",
      },
      {
        question: "¿Cual de estos eventos ocurrio primero?",
        options: ["El descubrimiento de America por Colon (1492)", "El nacimiento de Jesucristo (Año 0)", "La Edad Media (V-XV)", "La Revolucion Industrial (XVIII-XIX)"],
        correctIndex: 1,
        explanation: "Cronologicamente, el nacimiento de Jesucristo marca el inicio de nuestra era, ocurriendo mucho antes que el descubrimiento de America en 1492.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  if ((subject.includes("sociales") || subject.includes("hist") || subject.includes("geogr")) && (topic.includes("causa") || topic.includes("consecuencia") || question.includes("por que") || question.includes("como consecuencia"))) {
    const variants = [
      {
        question: "¿Cual fue una de las principales causas de la Revolucion Francesa?",
        options: ["La crisis economica, endeudamiento del Estado y descontento social por desigualdad", "El deseo de conquistar nuevas colonias", "La invension del vapor", "El desacuerdo sobre religion"],
        correctIndex: 0,
        explanation: "La Revolucion Francesa estuvo provocada principalmente por la bancarrota del Estado, los impuestos excesivos y el resentimiento social contra los privilegios de la nobleza.",
      },
      {
        question: "¿Como consecuencia de la Segunda Guerra Mundial (1939-1945), ¿que ocurrio?",
        options: ["Se redibujaron las fronteras de Europa, surgieron nuevas potencias (EE.UU. y URSS) y se creo la ONU", "Se unifico Europa politicamente", "Desaparecio el nacionalismo", "Todos los paises se hicieron democracias"],
        correctIndex: 0,
        explanation: "Tras la Segunda Guerra Mundial, Europa se reorganizo, surgieron dos superpotencias que iniciaron la Guerra Fria, y se fundo la Organizacion de las Naciones Unidas.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  return null
}