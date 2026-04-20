import { client } from '@/lib/sanity' 

// Definimos la estructura del Autor para que sea reutilizable
export interface Member {
  name: string;
  role: string;
  image: string; // La URL procesada de la imagen
}

export interface BlogPost {
  slug: string;
  date: string;
  title: string;
  content: any; 
  excerpt: string;
  readTime: string;
  image: any;    
  tags: string[];
  // Añadimos el autor a la interfaz (opcional por si hay posts antiguos sin autor)
  member?: Member; 
}

// 1. FUNCIÓN PARA LA LISTA
// Aquí también traemos el autor por si quieres mostrar su nombre en las tarjetas
export const getBlogEntries = async (): Promise<BlogPost[]> => {
  const query = `*[_type == "post"] | order(date desc) {
    "slug": slug.current,
    date,
    title,
    content,
    excerpt,
    readTime,
    image,
    tags,
    "member": member-> {
      name,
      role,
      "image": image.asset->url
    }
  }`

  return await client.fetch(query)
}

// 2. FUNCIÓN PARA UN SOLO POST
export const getBlogPost = async (slug: string): Promise<BlogPost> => {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    "slug": slug.current,
    date,
    title,
    content,
    excerpt,
    readTime,
    image,
    tags,
    "member": member-> {
      name,
      role,
      "image": image.asset->url
    }
  }`
  
  return await client.fetch(query, { slug })
}