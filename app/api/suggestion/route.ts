// app/api/suggestion/route.ts
import { createSuggestion } from "@/content/suggestions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 3) {
      return NextResponse.json({ error: "Texto demasiado corto" }, { status: 400 });
    }

    const result = await createSuggestion(text);

    return NextResponse.json({ 
      success: true, 
      id: result._id 
    });
    
  } catch (error) {
    console.error("API Error [Suggestion]:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la sugerencia" }, 
      { status: 500 }
    );
  }
}