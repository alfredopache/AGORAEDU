// src/content/resources.ts
import { client } from "@/sanity/lib/client"; // Ajusta esta ruta a tu cliente de Sanity

const AUTHOR_PATTERN = /\b(?:elaborad[oa]|desarrollad[oa]|escrit[oa]|cread[oa]) por ([^.,;]+)/i;

interface SanityResourceResult {
  _id: string;
  title: string;
  fileUrl: string;
  extension: string;
  category: string;
  _createdAt: string;
  size?: number | null;
  description?: string | null;
  author?: string | null;
}

export interface Resource {
  _id: string;
  title: string;
  fileUrl: string;
  extension: string;
  category: string;
  _createdAt: string;
  size?: string;
  description?: string | null;
  author?: string | null;
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
    "description": file.description,
    author
  }`;

  try {
    const resources = await client.fetch<SanityResourceResult[]>(query);
    
    // Formateamos el tamaño de bytes a algo legible (MB/KB)
    return resources.map((res) => {
      const normalizedAuthor = normalizeAuthor(res.author, res.description);
      const normalizedDescription = normalizeDescription(res.description);

      return {
        ...res,
        author: normalizedAuthor,
        description: normalizedDescription || res.description,
        size: res.size ? formatBytes(res.size) : "Desconocido"
      };
    });
  } catch (error) {
    console.error("Error fetching resources from Sanity:", error);
    return [];
  }
}

function normalizeAuthor(author?: string | null, description?: string | null) {
  const trimmedAuthor = author?.trim();
  if (trimmedAuthor) return trimmedAuthor;

  const match = description?.match(AUTHOR_PATTERN);
  return match?.[1]?.trim() || null;
}

function normalizeDescription(description?: string | null) {
  if (!description) return description;

  return description
    .replace(/\s*[,;]?\s*\b(?:elaborad[oa]|desarrollad[oa]|escrit[oa]|cread[oa]) por [^.,;]+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
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