import { client } from '@/lib/sanity'

/**
 * Interfaz para los items de la ficha técnica (Specs)
 */
export interface ProjectSpec {
  icon: string;
  label: string;
  value: string;
}

/**
 * Interfaz principal del Proyecto
 */
export interface Project {
  slug: string;
  date: string;
  category: string; // Seguirá siendo string porque extraeremos el título en la query
  title: string;
  content: any; 
  excerpt: string;
  image: string;
  tags: string[];
  fileURL?: string; 
  showAula?: boolean; 
  aulaContent?: string; 
  specs?: ProjectSpec[];
  isSeed?: boolean;
}

/**
 * 1. OBTENER TODOS LOS PROYECTOS
 */
export const getProjects = async (): Promise<Project[]> => {
  // CAMBIO: category->title extrae el nombre de la categoría referenciada
  const query = `*[_type == "project"] | order(date desc) {
    "slug": slug.current,
    date,
    "category": category->title, 
    title,
    content,
    excerpt,
    "image": image.asset->url,
    tags,
    "fileURL": file.asset->url,
    showAula,
    aulaContent,
    specs,
    isSeed
  }`

  try {
    const projects = await client.fetch(query)
    return projects
  } catch (error) {
    console.error("❌ Error al obtener proyectos:", error)
    return []
  }
}

/**
 * 2. OBTENER UN PROYECTO ÚNICO
 */
export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  const query = `*[_type == "project" && slug.current == $slug][0] {
    "slug": slug.current,
    date,
    "category": category->title,
    title,
    content,
    excerpt,
    "image": image.asset->url,
    tags,
    "fileURL": file.asset->url,
    showAula,
    aulaContent,
    specs,
    isSeed
  }`

  try {
    return await client.fetch(query, { slug })
  } catch (error) {
    console.error("❌ Error al obtener el proyecto por slug:", error)
    return null
  }
}

/**
 * 3. OBTENER PROYECTOS RELACIONADOS
 * CAMBIO: Ahora comparamos por el título de la categoría referenciada
 */
export const getRelatedProjects = async (categoryTitle: string, currentSlug: string): Promise<Project[]> => {
  const query = `*[_type == "project" && category->title == $categoryTitle && slug.current != $currentSlug][0...3] {
    "slug": slug.current,
    date,
    "category": category->title,
    title,
    excerpt,
    "image": image.asset->url,
    specs,
    isSeed
  }`

  try {
    return await client.fetch(query, { categoryTitle, currentSlug })
  } catch (error) {
    console.error("❌ Error al obtener proyectos relacionados:", error)
    return []
  }
}

/**
 * 4. OBTENER EL PROYECTO MÁS RECIENTE
 */
export const getLatestProject = async (): Promise<{ title: string; slug: string } | null> => {
  const query = `*[_type == "project"] | order(date desc)[0] {
    title,
    "slug": slug.current
  }`

  try {
    return await client.fetch(query)
  } catch (error) {
    console.error("❌ Error al obtener el último proyecto:", error)
    return null
  }
}