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
        question: "Choose the correct option to complete the sentence: I usually ___ breakfast at seven o'clock before going to school.",
        options: ["eat", "ate", "am eating", "have eaten"],
        correctIndex: 0,
        explanation: "'Usually' indica una rutina habitual, por eso se usa present simple: 'I usually eat breakfast'.",
      },
      {
        question: "Choose the correct option to complete the sentence: Yesterday we ___ to the museum with our teacher.",
        options: ["go", "went", "are going", "have gone"],
        correctIndex: 1,
        explanation: "'Yesterday' sitúa la acción en un momento pasado y terminado, así que la forma correcta es past simple: 'went'.",
      },
      {
        question: "Choose the correct option to complete the sentence: Look! The children ___ in the playground right now.",
        options: ["play", "played", "are playing", "have played"],
        correctIndex: 2,
        explanation: "'Look!' y 'right now' indican que la acción está ocurriendo en este instante, así que corresponde present continuous: 'are playing'.",
      },
      {
        question: "Choose the correct option to complete the sentence: She ___ her homework already, so she can go out now.",
        options: ["finishes", "finished", "is finishing", "has finished"],
        correctIndex: 3,
        explanation: "'Already' conecta una acción ya completada con una consecuencia presente, por eso la forma correcta es present perfect: 'has finished'.",
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

  // ──────────────────────────────────────────────
  // NUEVOS PATRONES AÑADIDOS
  // ──────────────────────────────────────────────

  // Lengua – comprensión lectora / respuestas sobre el texto
  if (subject.includes("leng") && (topic.includes("comprension") || topic.includes("lectura") || question.includes("segun el texto") || question.includes("responde") || question.includes("elementos de la comunicacion") || question.includes("emisor") || question.includes("receptor"))) {
    const variants = [
      {
        question: "¿Cual es el emisor en una noticia de periodico?",
        options: ["El periodista o medio que publica la informacion", "El lector que lee la noticia", "El personaje del que habla la noticia", "La imprenta que publica el diario"],
        correctIndex: 0,
        explanation: "En un texto periodistico el emisor es quien crea y transmite el mensaje, es decir, el periodista o el medio de comunicacion.",
      },
      {
        question: "¿Que elemento de la comunicacion es 'la lengua española' en una conversacion en español?",
        options: ["El codigo", "El canal", "El receptor", "El contexto"],
        correctIndex: 0,
        explanation: "El codigo es el sistema de signos que comparten emisor y receptor. En este caso, la lengua española es el codigo empleado.",
      },
      {
        question: "En un texto argumentativo, ¿cual es el objetivo principal del emisor?",
        options: ["Convencer al receptor de una idea o punto de vista", "Narrar una historia de forma entretenida", "Describir un objeto o lugar con detalle", "Dar instrucciones para realizar una tarea"],
        correctIndex: 0,
        explanation: "Los textos argumentativos buscan persuadir al lector mediante razonamientos, datos y opiniones fundamentadas.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Lengua – ortografía, puntuación, acentuación
  if (subject.includes("leng") && (topic.includes("ortografi") || topic.includes("acentuacion") || topic.includes("puntuacion") || question.includes("tilde") || question.includes("acento") || question.includes("signo de puntuacion"))) {
    const variants = [
      {
        question: "¿Cual de estas palabras lleva tilde segun las reglas de acentuacion?",
        options: ["Cancion", "Mesa", "Casa", "Libro"],
        correctIndex: 0,
        explanation: "'Cancion' es una palabra aguda acabada en -n, por lo que lleva tilde segun las reglas generales de acentuacion.",
      },
      {
        question: "¿Que signo de puntuacion se usa al inicio de una pregunta en español?",
        options: ["¿", "¡", ";", ":"],
        correctIndex: 0,
        explanation: "En español las preguntas se abren con un signo de interrogacion invertido (¿) y se cierran con uno normal (?).",
      },
      {
        question: "¿Cual de estas palabras es esdrujula y siempre lleva tilde?",
        options: ["Matematicas", "Cancion", "Papel", "Reloj"],
        correctIndex: 0,
        explanation: "Las palabras esdrujulas (acento en la antepenultima silaba) siempre llevan tilde. 'Matematicas' es esdrujula: ma-te-MA-ti-cas.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Lengua – literatura / figuras retoricas / autores
  if (subject.includes("leng") && (topic.includes("literatura") || topic.includes("figura") || topic.includes("retorica") || topic.includes("metafora") || question.includes("figura literaria") || question.includes("recurso estilistico"))) {
    const variants = [
      {
        question: "¿Cual es el recurso literario utilizado en la frase: 'Sus ojos son dos luceros'?",
        options: ["Metafora", "Hiperbole", "Personificacion", "Aliteracion"],
        correctIndex: 0,
        explanation: "Es una metafora porque se establece una comparacion directa entre 'ojos' y 'luceros' sin usar nexos comparativos como 'como'.",
      },
      {
        question: "¿Que figura retorica exagera una realidad para dar enfasis? Ejemplo: 'Te lo he dicho mil veces'.",
        options: ["Hiperbole", "Metafora", "Personificacion", "Sinestesia"],
        correctIndex: 0,
        explanation: "La hiperbole consiste en exagerar una cualidad o cantidad para intensificar el mensaje. 'Mil veces' es una exageracion.",
      },
      {
        question: "¿Cual de estos autores pertenece al Siglo de Oro de la literatura española?",
        options: ["Miguel de Cervantes", "Federico Garcia Lorca", "Antonio Machado", "Ramon Maria del Valle-Inclan"],
        correctIndex: 0,
        explanation: "Miguel de Cervantes (1547-1616), autor de 'Don Quijote de la Mancha', es una de las figuras clave del Siglo de Oro español.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Inglés – comprensión lectora (True/False, questions about a text)
  if (subject.includes("ingl") && (topic.includes("comprension") || topic.includes("reading") || question.includes("according to the text") || question.includes("answer") || question.includes("true or false") || question.includes("comprension"))) {
    const variants = [
      {
        question: "Which statement about a typical school timetable is most likely TRUE?",
        options: ["Students usually have different subjects on different days", "All lessons last exactly 30 minutes", "Students never have breaks during the school day", "Schools always start at 6 a.m."],
        correctIndex: 0,
        explanation: "In most schools, the timetable varies each day to cover different subjects. This is a standard feature of secondary education.",
      },
      {
        question: "In a reading text about healthy habits, which habit is usually recommended for better concentration?",
        options: ["Getting enough sleep and eating a balanced diet", "Studying for 10 hours without breaks", "Drinking large amounts of coffee", "Skipping breakfast to save time"],
        correctIndex: 0,
        explanation: "Regular sleep and good nutrition are consistently linked to improved concentration and academic performance.",
      },
      {
        question: "A news article says a city installed 500 new recycling bins. What is the main purpose of this action?",
        options: ["To encourage citizens to recycle more waste", "To decorate the city streets", "To replace broken street lamps", "To attract more tourists"],
        correctIndex: 0,
        explanation: "Installing recycling bins is a direct environmental measure aimed at increasing waste recycling rates among the population.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Inglés – vocabulario y definiciones
  if (subject.includes("ingl") && (topic.includes("vocabulario") || topic.includes("vocabulary") || topic.includes("definicion") || question.includes("synonyms") || question.includes("meaning") || question.includes("definition"))) {
    const variants = [
      {
        question: "Which word is closest in meaning to 'enormous'?",
        options: ["Huge", "Tiny", "Average", "Narrow"],
        correctIndex: 0,
        explanation: "'Enormous' and 'huge' both mean very large in size. 'Tiny' is the opposite, and 'average' means normal size.",
      },
      {
        question: "What does the word 'sustainable' mean in an environmental context?",
        options: ["Able to be maintained over a long period without harming the environment", "Very expensive and difficult to produce", "Only available in tropical countries", "Already obsolete and no longer used"],
        correctIndex: 0,
        explanation: "'Sustainable' refers to practices or resources that can be maintained over time without depleting natural resources or causing ecological damage.",
      },
      {
        question: "Choose the correct meaning of 'to commute' in the sentence: 'She commutes to work every day'.",
        options: ["To travel regularly between home and work", "To work from home", "To take a holiday", "To arrive late"],
        correctIndex: 0,
        explanation: "To commute means to make a regular journey, usually between home and workplace. It typically refers to daily travel by public transport or car.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Matemáticas – porcentajes y proporcionalidad
  if (subject.includes("matem") && (topic.includes("porcentaje") || topic.includes("proporcion") || question.includes("porcentaje") || question.includes("descuento") || question.includes("tanto por ciento"))) {
    const variants = [
      {
        question: "Un articulo cuesta 80 € y tiene un descuento del 25%. ¿Cual es el precio final?",
        options: ["60 €", "55 €", "65 €", "70 €"],
        correctIndex: 0,
        explanation: "El 25% de 80 € es 20 €. Restando: 80 - 20 = 60 €. El precio final con descuento es 60 €.",
      },
      {
        question: "En una clase de 30 alumnos, el 40% saca nota superior a 7. ¿Cuantos alumnos son?",
        options: ["12", "10", "15", "18"],
        correctIndex: 0,
        explanation: "El 40% de 30 = 0.40 × 30 = 12 alumnos. La clave es convertir el porcentaje en decimal y multiplicar.",
      },
      {
        question: "Un producto pasa de costar 50 € a 60 €. ¿Cual es el porcentaje de aumento?",
        options: ["20%", "10%", "25%", "15%"],
        correctIndex: 0,
        explanation: "Aumento = 60 - 50 = 10. Porcentaje = (10 / 50) × 100 = 20%. El precio ha subido un 20%.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Matemáticas – estadística básica (media, moda, mediana)
  if (subject.includes("matem") && (topic.includes("estadistic") || topic.includes("media") || topic.includes("mediana") || topic.includes("moda") || question.includes("media aritmetica") || question.includes("valor medio"))) {
    const variants = [
      {
        question: "Las notas de un alumno son: 6, 7, 8, 5, 9. ¿Cual es la media aritmetica?",
        options: ["7", "6", "8", "5"],
        correctIndex: 0,
        explanation: "Suma: 6+7+8+5+9 = 35. Media = 35 ÷ 5 = 7. La media aritmetica es la suma de todos los valores dividida entre el numero de valores.",
      },
      {
        question: "En la serie de datos 3, 5, 5, 7, 9, ¿cual es la moda?",
        options: ["5", "3", "7", "9"],
        correctIndex: 0,
        explanation: "La moda es el valor que aparece con mayor frecuencia. El 5 aparece dos veces, mientras que los demas solo aparecen una vez.",
      },
      {
        question: "En la serie ordenada 2, 4, 6, 8, 10, ¿cual es la mediana?",
        options: ["6", "4", "8", "5"],
        correctIndex: 0,
        explanation: "La mediana es el valor central de una serie ordenada. Con 5 valores, el central es el tercero: 6.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Ciencias Naturales – biología / ecología / cuerpo humano
  if ((subject.includes("cienc") || subject.includes("natur") || subject.includes("biolog")) && (topic.includes("ecolog") || topic.includes("seres vivos") || topic.includes("ecosistema") || topic.includes("celula") || topic.includes("sistema") || question.includes("organismo") || question.includes("celula") || question.includes("ecosistema"))) {
    const variants = [
      {
        question: "¿Cual es la funcion principal de la fotosintesis en las plantas?",
        options: ["Transformar energia luminica en energia quimica (glucosa) usando CO2 y agua", "Absorber agua del suelo mediante las raices", "Reproducirse a traves de semillas", "Eliminar oxigeno del ambiente"],
        correctIndex: 0,
        explanation: "La fotosintesis es el proceso por el que las plantas producen glucosa a partir de la luz solar, el CO2 del aire y el agua del suelo, liberando oxigeno como subproducto.",
      },
      {
        question: "¿Que organulo celular es responsable de producir energia en las celulas eucariotas?",
        options: ["Mitocondria", "Vacuola", "Ribosoma", "Nucleo"],
        correctIndex: 0,
        explanation: "La mitocondria realiza la respiracion celular aerobia, convirtiendo glucosa y oxigeno en ATP (energia) que la celula puede usar.",
      },
      {
        question: "¿Como se denomina la relacion en la que un organismo se beneficia mientras el otro no resulta ni beneficiado ni perjudicado?",
        options: ["Comensalismo", "Mutualismo", "Parasitismo", "Depredacion"],
        correctIndex: 0,
        explanation: "En el comensalismo uno de los organismos se beneficia y el otro permanece indiferente. Ejemplo: el rémora que viaja en tiburones.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // TIC – seguridad informática y privacidad digital
  if (subject.includes("tic") && (topic.includes("seguridad") || topic.includes("privacidad") || topic.includes("ciberseguridad") || question.includes("virus") || question.includes("contrasena") || question.includes("phishing") || question.includes("proteccion de datos"))) {
    const variants = [
      {
        question: "¿Cual es la mejor practica para proteger una cuenta de usuario en internet?",
        options: ["Usar una contraseña unica y larga con letras, numeros y simbolos", "Usar el mismo nombre de usuario como contraseña", "Compartir la contraseña con un amigo de confianza", "Escribir la contraseña en un papel cerca del ordenador"],
        correctIndex: 0,
        explanation: "Las contraseñas seguras combinan letras mayusculas y minusculas, numeros y simbolos. Deben ser unicas para cada servicio y no compartirse.",
      },
      {
        question: "¿Que es el 'phishing'?",
        options: ["Una tecnica de engaño que intenta robar datos personales o contraseñas haciendose pasar por una entidad de confianza", "Un programa que mejora la velocidad del ordenador", "Un tipo de copia de seguridad de archivos", "Una red wifi publica segura"],
        correctIndex: 0,
        explanation: "El phishing consiste en correos, mensajes o paginas web falsas que imitan a empresas o entidades reales para conseguir que el usuario revele sus datos.",
      },
      {
        question: "¿Que debes hacer si recibes un correo sospechoso que te pide tus datos bancarios?",
        options: ["No abrir los enlaces, no responder y denunciarlo como spam o phishing", "Responder con tus datos para comprobar si es real", "Reenviarlo a tus contactos como aviso", "Hacer clic en 'darse de baja' para que no te lleguen mas correos"],
        correctIndex: 0,
        explanation: "Nunca se deben proporcionar datos bancarios ni personales a traves de correos no solicitados. Lo correcto es ignorarlos y reportarlos.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // TIC – hojas de calculo y bases de datos
  if (subject.includes("tic") && (topic.includes("hoja de calculo") || topic.includes("spreadsheet") || topic.includes("base de datos") || question.includes("formula") || question.includes("celda") || question.includes("excel") || question.includes("calc"))) {
    const variants = [
      {
        question: "¿Que formula en Excel suma los valores de las celdas A1, A2 y A3?",
        options: ["=SUMA(A1:A3)", "=TOTAL(A1,A3)", "=CONTAR(A1:A3)", "=PROMEDIO(A1;A3)"],
        correctIndex: 0,
        explanation: "=SUMA(A1:A3) suma todos los valores en el rango de A1 a A3. Los dos puntos (:) indican un rango continuo de celdas.",
      },
      {
        question: "En una base de datos relacional, ¿como se llama el campo que identifica de forma unica cada registro?",
        options: ["Clave primaria", "Campo nulo", "Indice externo", "Dato duplicado"],
        correctIndex: 0,
        explanation: "La clave primaria es el campo (o conjunto de campos) que identifica de forma unica e irrepetible cada registro de una tabla.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Matemáticas – funciones y gráficas
  if (subject.includes("matem") && (topic.includes("funcion") || topic.includes("grafica") || question.includes("funcion lineal") || question.includes("pendiente") || question.includes("coordenadas"))) {
    const variants = [
      {
        question: "¿Que forma tiene la grafica de la funcion y = 2x + 3?",
        options: ["Una recta con pendiente positiva que corta el eje Y en 3", "Una parabola que abre hacia arriba", "Una curva con minimo en el origen", "Una recta horizontal"],
        correctIndex: 0,
        explanation: "y = 2x + 3 es una funcion lineal. La pendiente es 2 (positiva, la recta sube) y la ordenada en el origen es 3 (corta el eje Y en y=3).",
      },
      {
        question: "En la funcion y = mx + b, ¿que representa el valor 'm'?",
        options: ["La pendiente (inclinacion) de la recta", "El punto donde la recta corta el eje X", "El valor maximo de la funcion", "El numero de variables de la ecuacion"],
        correctIndex: 0,
        explanation: "En la ecuacion de la recta y = mx + b, m es la pendiente que indica cuanto sube o baja y por cada unidad que avanza x. Un m positivo sube; negativo, baja.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Ciencias – física / química básica
  if ((subject.includes("cienc") || subject.includes("natur") || subject.includes("fisic") || subject.includes("quim")) && (topic.includes("materia") || topic.includes("estados") || topic.includes("mezcla") || topic.includes("elemento") || topic.includes("reaccion") || question.includes("estados de la materia") || question.includes("mezcla") || question.includes("elemento quimico"))) {
    const variants = [
      {
        question: "¿En que estado de la materia las moleculas tienen forma y volumen propios y definidos?",
        options: ["Solido", "Liquido", "Gas", "Plasma"],
        correctIndex: 0,
        explanation: "En estado solido las moleculas estan muy juntas y ordenadas, lo que da al solido forma y volumen propios. En el liquido hay volumen pero no forma fija; en el gas no hay ni uno ni otro.",
      },
      {
        question: "¿Como se llama la mezcla que parece uniforme y no se pueden distinguir sus componentes a simple vista?",
        options: ["Mezcla homogenea", "Mezcla heterogenea", "Compuesto puro", "Elemento simple"],
        correctIndex: 0,
        explanation: "En una mezcla homogenea (o disolucion) los componentes estan distribuidos de manera uniforme. El agua con sal es un ejemplo clasico.",
      },
      {
        question: "¿Cual es el simbolo quimico del oxigeno?",
        options: ["O", "Ox", "Og", "Or"],
        correctIndex: 0,
        explanation: "El oxigeno tiene el simbolo quimico O (del latin Oxygenium). Es el elemento con numero atomico 8 y es fundamental para la respiracion.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  // Geografía e Historia – economia, politica, geografía
  if ((subject.includes("sociales") || subject.includes("geogr") || subject.includes("hist")) && (topic.includes("econom") || topic.includes("globalizacion") || topic.includes("pib") || question.includes("economia") || question.includes("pib") || question.includes("inflacion"))) {
    const variants = [
      {
        question: "¿Que mide el Producto Interior Bruto (PIB) de un pais?",
        options: ["El valor total de bienes y servicios producidos en un pais durante un periodo de tiempo", "El numero total de trabajadores de un pais", "La cantidad de exportaciones anuales", "El nivel de deuda publica acumulada"],
        correctIndex: 0,
        explanation: "El PIB es el indicador economico principal para medir la riqueza producida en un pais en un año. Incluye tanto bienes como servicios.",
      },
      {
        question: "¿Que es la inflacion?",
        options: ["El aumento generalizado y sostenido de los precios de bienes y servicios", "La reduccion del desempleo en un pais", "El aumento de las exportaciones nacionales", "La disminucion del valor de la moneda extranjera"],
        correctIndex: 0,
        explanation: "La inflacion refleja la perdida de poder adquisitivo: si los precios suben, con el mismo dinero se puede comprar menos. Se mide mediante el IPC.",
      },
    ]
    return pickVariant(variants, seed, variantOffset)
  }

  return null
}