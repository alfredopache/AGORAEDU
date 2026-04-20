import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/', // Evitamos que el panel de Sanity salga en Google
    },
    sitemap: 'https://agoraedu.eu/sitemap.xml',
  }
}