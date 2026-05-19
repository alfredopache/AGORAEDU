import { client } from '@/lib/sanity' 

export interface CarpetaItem {
  _id: string
  _type: 'blog' | 'post' | 'project' | 'resource' | 'podcast' | 'recursoImagen' 
  title: string
  slug: string
  youtubeUrl?: string 
  imageUrl?: string 
  fileUrl?: string // 👈 Añadido para guardar la URL del PDF/documento descargable
  description?: string
}

export interface Carpeta {
  _id: string
  title: string
  slug: string
  description?: string
  color: 'blue' | 'indigo' | 'cyan' | 'purple' | 'emerald'
  items: CarpetaItem[]
}

// 1. Obtener todas las carpetas
export async function getCarpetas(): Promise<Carpeta[]> {
  const query = `*[_type == "carpeta"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    color,
    items[]-> {
      _id,
      _type,
      title,
      "slug": slug.current,
      youtubeUrl,
      "imageUrl": imageFile.asset->url,
      "fileUrl": file.asset->url, // 👈 Extrae la URL directa del archivo en Sanity
      description
    }
  }`
  
  const data = await client.fetch(query, {}, { next: { revalidate: 0 } })
  return data || []
}

// 2. Obtener una carpeta específica por su Slug
export async function getCarpetaBySlug(slug: string): Promise<Carpeta | null> {
  const query = `*[_type == "carpeta" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    color,
    items[]-> {
      _id,
      _type,
      title,
      "slug": slug.current,
      youtubeUrl,
      "imageUrl": imageFile.asset->url,
      "fileUrl": file.asset->url, // 👈 Extrae la URL directa del archivo en Sanity
      description
    }
  }`
  
  return await client.fetch(query, { slug }, { next: { revalidate: 0 } })
}