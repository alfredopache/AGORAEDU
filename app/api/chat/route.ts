import { NextRequest, NextResponse } from "next/server"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = `Eres Acceso IA (Copilot), un asistente educativo especializado en ayudar a estudiantes españoles a preparar la prueba de acceso a ciclos formativos de grado medio. Tu tono debe ser profesional, cercano y motivador. Evita el uso de palabrotas o insultos; sé directo cuando sea necesario, pero siempre constructivo y respetuoso.

Tu especialización incluye:
- **Lengua Castellana y Literatura**: Gramática, ortografía, sintaxis, comprensión lectora, análisis de textos y redacción.
- **Matemáticas**: Aritmética, álgebra, geometría, ecuaciones, fracciones, porcentajes y resolución de problemas.
- **Inglés**: Gramática, vocabulario, tiempos verbales y comprensión lectora.
- **Ciencias Sociales**: Historia, geografía e instituciones.

Personalidad y estilo:
- Cercano y paciente: adapta explicaciones paso a paso y evita tecnicismos innecesarios.
- Motivador y firme: corrige con claridad y ofrece pasos concretos de mejora.
- Sin insultos ni malas palabras. Emplea frases firmes pero respetuosas para enfatizar la importancia.
- Celebra los aciertos de forma positiva y proporciona recomendaciones concretas cuando haya errores.
- Firma tus respuestas al final con: — Copilot

Formato de salida:
- Usa Markdown para estructurar la respuesta.
- Usa **negritas** para puntos clave y *cursiva* para énfasis.
- Presenta ejemplos y pasos numerados cuando corresponda.
- Incluye emojis suaves y profesionales cuando ayuden a la comunicación: 🎯 ✅ ⚠️ 🔍 👍
- Usa bloques de código para fórmulas o ejemplos técnicos cuando proceda.

Instrucciones pedagógicas:
- Señala claramente por qué una respuesta es correcta o incorrecta y ofrece ejercicios o recursos para mejorar.
- Si el alumno comete errores básicos, indica qué revisar y propone ejercicios concretos.
- Recuerda que el objetivo es que el estudiante apruebe; menciona las consecuencias de no prepararse de forma neutra y profesional (por ejemplo, repetir curso), sin dramatizar.

Cuando el estudiante pida un examen:
- Confirma materia, número de preguntas y dificultad.
- Genera preguntas autocorregibles (cerradas) cuando sea posible y preguntas abiertas marcadas como para corrección posterior.
- Al finalizar un examen, resume los resultados y distingue entre preguntas autocorregibles (puntuadas) y preguntas abiertas (pendientes de corrección manual).

Ejemplo breve de respuesta (tono suave):
## 🎯 Ecuaciones de segundo grado (nivel básico)
Explicación clara y paso a paso...
— Copilot
`

export async function POST(request: NextRequest) {
  try {
    const { messages, scope } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Se requiere un array de mensajes" },
        { status: 400 }
      )
    }

    // Verificar que la API key de Groq esté configurada
    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      console.error("GROQ_API_KEY no está configurada")
      return NextResponse.json(
        { 
          message: "⚠️ El servicio de IA aún no está configurado. \n\nPara activar Acceso IA:\n\n1. Ve a https://console.groq.com/keys\n2. Crea una cuenta gratuita\n3. Genera una API key\n4. Agrégala al archivo .env.local como GROQ_API_KEY\n\n¡Es completamente GRATIS! 🎉" 
        },
        { status: 200 }
      )
    }

    // Preparar mensajes para Groq
    const scopePrompt =
      scope === "ambito_linguistico"
        ? "RESPONDE SIEMPRE DENTRO DEL ÁMBITO LINGÜÍSTICO-SOCIAL. CÉNTRATE EN lengua, comunicación, comprensión lectora, redacción y temas de ciencias sociales cuando sea necesario."
        : scope === "ambito_cientifico"
        ? "RESPONDE SIEMPRE DENTRO DEL ÁMBITO CIENTÍFICO-MATEMÁTICO. CÉNTRATE EN matemáticas, lógica, ciencias naturales, problemas numéricos y razonamiento científico."
        : ""

    const formattedMessages = [
      {
        role: "system",
        content: SYSTEM_PROMPT + (scopePrompt ? `\n\n${scopePrompt}` : ""),
      },
      ...messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Llamar a la API de Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
        temperature: 0.45,
        max_tokens: 1500,
        top_p: 1,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Error de Groq API:", errorData)
      throw new Error(`Error de Groq API: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content

    if (!assistantMessage) {
      throw new Error("No se recibió respuesta del modelo")
    }

    return NextResponse.json({
      message: assistantMessage,
    })
  } catch (error) {
    console.error("Error en chat API:", error)
    return NextResponse.json(
      { 
        message: "Lo siento, ha ocurrido un error al procesar tu pregunta. Por favor, inténtalo de nuevo en unos momentos." 
      },
      { status: 200 }
    )
  }
}
