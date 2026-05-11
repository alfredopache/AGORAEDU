// src/content/resources.ts
import { client } from "@/sanity/lib/client"; // Ajusta esta ruta a tu cliente de Sanity

export interface Resource {
  _id: string;
  title: string;
  fileUrl: string;
  extension: string;
  category: string;
  _createdAt: string;
  size?: string;
  description?: string | null;
}

export async function getResources(): Promise<Resource[]> {
  // Consulta GROQ: Traemos el título, la categoría, la fecha y
  // accedemos al asset para obtener la URL y la extensión original
  const query = `*[_type == "resource"] | order(_createdAt desc) {
    _id,
    title,
    category,
    _createdAt,
    "fileUrl": file.asset->url,
    "extension": file.asset->extension,
    "size": file.asset->size,
    "description": file.description
  }`;

  try {
    const resources = await client.fetch(query);
    
    // Formateamos el tamaño de bytes a algo legible (MB/KB)
    return resources.map((res: any) => ({
      ...res,
      size: res.size ? formatBytes(res.size) : "Desconocido"
    }));
  } catch (error) {
    console.error("Error fetching resources from Sanity:", error);
    return [];
  }
}

// Función auxiliar para que el tamaño se vea profesional (ej: 2.4 MB)
function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}