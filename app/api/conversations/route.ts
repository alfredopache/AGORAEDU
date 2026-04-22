import { NextRequest, NextResponse } from "next/server"
import { client, writeClient } from "@/sanity/lib/client"
import { getToken } from "next-auth/jwt"

// GET - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    // Try to identify authenticated user via next-auth token
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const userEmail = token?.email

    let conversations
    if (userEmail) {
      const q = `*[_type == "chatConversation" && userEmail == $userEmail] | order(updatedAt desc) { _id, title, subject, createdAt, updatedAt, "messageCount": count(messages) }`
      conversations = await client.fetch(q, { userEmail })
    } else {
      if (!sessionId) {
        return NextResponse.json({ error: "Se requiere sessionId" }, { status: 400 })
      }
      const q = `*[_type == "chatConversation" && sessionId == $sessionId] | order(updatedAt desc) { _id, title, subject, createdAt, updatedAt, "messageCount": count(messages) }`
      conversations = await client.fetch(q, { sessionId })
    }

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

    // Attach user email if authenticated
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const userEmail = token?.email

    const conversationData: any = {
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

    if (userEmail) {
      conversationData.userEmail = userEmail
    }

    let result

    if (conversationId) {
      // Actualizar conversación existente (usar writeClient)
      result = await writeClient
        .patch(conversationId)
        .set({
          messages: conversationData.messages,
          updatedAt: conversationData.updatedAt,
        })
        .commit()
    } else {
      // Crear nueva conversación (usar writeClient)
      result = await writeClient.create({
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
      return NextResponse.json({ error: "Se requiere conversationId" }, { status: 400 })
    }

    // Identify authenticated user
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const userEmail = token?.email

    // Fetch the conversation to check ownership
    const doc = await client.fetch(`*[_id == $id][0]{ _id, sessionId, userEmail }`, { id: conversationId })
    if (!doc) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })
    }

    if (doc.userEmail) {
      // If conversation has owner, require authenticated matching user
      if (!userEmail || userEmail !== doc.userEmail) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    } else {
      // Fallback: allow deletion only if sessionId param matches
      const sessionId = searchParams.get("sessionId")
      if (!sessionId || sessionId !== doc.sessionId) {
        return NextResponse.json({ error: "No autorizado (session mismatch)" }, { status: 403 })
      }
    }

    await writeClient.delete(conversationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando conversación:", error)
    return NextResponse.json(
      { error: "Error al eliminar conversación" },
      { status: 500 }
    )
  }
}
