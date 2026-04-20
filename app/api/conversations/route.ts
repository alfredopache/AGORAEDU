import { NextRequest, NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"

// GET - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Se requiere sessionId" },
        { status: 400 }
      )
    }

    const query = `*[_type == "chatConversation" && sessionId == $sessionId] | order(updatedAt desc) {
      _id,
      title,
      subject,
      createdAt,
      updatedAt,
      "messageCount": count(messages)
    }`

    const conversations = await client.fetch(query, { sessionId })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error obteniendo conversaciones:", error)
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    )
  }
}

// POST - Crear o actualizar conversación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, sessionId, title, subject, messages } = body

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    const conversationData = {
      _type: "chatConversation",
      title: title || "Nueva conversación",
      sessionId,
      subject: subject || "general",
      messages: messages.map((msg) => ({
        _type: "object",
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    }

    let result

    if (conversationId) {
      // Actualizar conversación existente
      result = await client
        .patch(conversationId)
        .set({
          messages: conversationData.messages,
          updatedAt: conversationData.updatedAt,
        })
        .commit()
    } else {
      // Crear nueva conversación
      result = await client.create({
        ...conversationData,
        createdAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      conversationId: result._id,
    })
  } catch (error) {
    console.error("Error guardando conversación:", error)
    return NextResponse.json(
      { error: "Error al guardar conversación" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar conversación
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("id")

    if (!conversationId) {
      return NextResponse.json(
        { error: "Se requiere conversationId" },
        { status: 400 }
      )
    }

    await client.delete(conversationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando conversación:", error)
    return NextResponse.json(
      { error: "Error al eliminar conversación" },
      { status: 500 }
    )
  }
}
