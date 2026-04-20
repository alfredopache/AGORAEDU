// content/suggestions.ts
import { createClient } from "next-sanity"; // Cambiamos la importación para mayor control

export async function createSuggestion(text: string) {
  // 1. Verificación manual del Token
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    throw new Error("SANITY_WRITE_TOKEN no está definido en el archivo .env.local");
  }

  // 2. Creamos un cliente específico para escritura aquí mismo
  const writeClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: "2024-01-01", // Usa una fecha reciente
    token: token,
    useCdn: false, // ¡CRÍTICO para escribir!
  });

  return await writeClient.create({
    _type: 'suggestion',
    text: text,
    status: 'new',
  });
}