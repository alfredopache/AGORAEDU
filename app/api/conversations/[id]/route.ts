import { NextRequest, NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"

// Definimos el tipo para que sea una Promesa, como exige Next.js 15/16
type Props = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    // IMPORTANTE: Ahora hay que esperar a que params se resuelva
    const { id } = await params

    const query = `*[_type == "chatConversation" && _id == $id][0] {
      _id,
      title,
      subject,
      messages,
      createdAt,
      updatedAt
    }`

    const conversation = await client.fetch(query, { id })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Error obteniendo conversación:", error)
    return NextResponse.json(
      { error: "Error al obtener conversación" },
      { status: 500 }
    )
  }
}
