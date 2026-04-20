import { MetadataRoute } from 'next'
import { getProjects } from '@/content/projects'
import { getResources } from '@/content/resources'

// Función auxiliar para evitar el RangeError: Invalid time value
// Asegura que siempre haya una fecha válida para los motores de búsqueda
const safeDate = (dateInput: any) => {
  const date = new Date(dateInput);
  // Si la fecha es inválida (NaN), devolvemos la fecha actual como fallback
  return isNaN(date.getTime()) ? new Date() : date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://agoraedu.eu'

  // 1. Rutas Estáticas
  const routes = [
    '',
    '/proyectos',
    '/blog',
    '/recursos',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 2. Rutas de Proyectos (Dinámicas)
  const projects = await getProjects()
  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/proyectos/${project.slug}`,
    // Usamos safeDate para manejar valores nulos o strings inválidos de Sanity
    lastModified: safeDate(project.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // 3. Rutas de Recursos
  const resources = await getResources()
  const resourceRoutes = resources.map((resource) => ({
    url: `${baseUrl}/recursos`, 
    lastModified: safeDate(resource._createdAt),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // 4. Limpieza de duplicados
  // Eliminamos duplicados si varios recursos apuntan a la misma URL (/recursos)
  // para evitar advertencias en Google Search Console
  const uniqueResourceRoutes = Array.from(
    new Map(resourceRoutes.map(item => [item.url, item])).values()
  );

  return [...routes, ...projectRoutes, ...uniqueResourceRoutes]
}