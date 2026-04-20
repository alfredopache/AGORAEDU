import { createClient } from '@sanity/client'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import * as dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN, 
  apiVersion: '2024-01-01',
})

const rl = readline.createInterface({ input, output })

// --- DATOS DE EJEMPLO PARA GALERÍA (CON PICSUM) ---
const seedGallery = [
  {
    _type: 'gallery',
    title: 'Laboratorio de Innovación',
    type: 'image',
    alt: 'Estudiantes trabajando con tecnología de punta',
    caption: 'Espacio de experimentación con IA y Robótica',
    order: 1,
    // Nota: Sanity no permite inyectar una URL directamente en un campo 'image'
    // Se creará el documento y deberás subir la imagen en el Studio.
    // He puesto la URL en el título para que sepas cuál elegir si quieres.
  },
  {
    _type: 'gallery',
    title: 'Workshop IA Generativa',
    type: 'videoUrl',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    alt: 'Miniatura de taller práctico',
    caption: 'Resumen de la jornada de formación para docentes',
    order: 2,
  },
  {
    _type: 'gallery',
    title: 'Campus Virtual 2026',
    type: 'image',
    alt: 'Vista aérea del campus tecnológico',
    caption: 'Nuestras instalaciones preparadas para el futuro',
    order: 3,
  }
]

// --- DATOS DE EJEMPLO PARA PODCASTS ---
const seedPodcasts = [
  {
    _type: 'podcast',
    title: 'El futuro de la IA en ADE',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    publishedAt: new Date().toISOString(),
    description: 'Análisis de cómo la IA está transformando la gestión empresarial.',
    duration: '22:15',
  },
  {
    _type: 'podcast',
    title: 'Automatización y Empleo',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    publishedAt: new Date().toISOString(),
    description: '¿Sustitución o aumento? El debate sobre el trabajo del futuro.',
    duration: '15:30',
  }
]

// --- DATOS DE EJEMPLO PARA PROYECTOS ---
const seedProjects = [
  {
    _type: 'project',
    title: 'Sistema de Predicción de Mercados',
    slug: { _type: 'slug', current: 'prediccion-mercados-ia' },
    publishedAt: new Date().toISOString(),
    author: 'Equipo de Datos',
    excerpt: 'Algoritmo diseñado para predecir tendencias en mercados emergentes.',
    categories: ['Finanzas', 'IA'],
    content: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Este proyecto utiliza redes neuronales recurrentes para analizar series temporales.' }],
        markDefs: [],
        style: 'normal',
      },
    ],
  }
]

async function runSeed() {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error('❌ Error: No se encontró SANITY_API_WRITE_TOKEN en .env.local')
    process.exit(1)
  }

  console.log('\n🚀 --- SANITY SEED TOOL (v2 con Galería) --- 🚀')
  console.log(`Proyecto: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`)
  console.log('1. Podcasts')
  console.log('2. Proyectos')
  console.log('3. Galería (Imágenes y Vídeos)')
  console.log('4. Salir\n')

  const answer = await rl.question('Selecciona el esquema: ')

  let dataToImport: any[] = []
  let schemaName = ''

  switch (answer) {
    case '1':
      dataToImport = seedPodcasts
      schemaName = 'podcast'
      break
    case '2':
      dataToImport = seedProjects
      schemaName = 'project'
      break
    case '3':
      dataToImport = seedGallery
      schemaName = 'gallery'
      break
    case '4':
      console.log('Cerrando script...')
      rl.close()
      return
    default:
      console.log('Opción inválida.')
      rl.close()
      return
  }

  console.log(`\nImportando ${dataToImport.length} documentos en "${schemaName}"...`)

  try {
    const transaction = client.transaction()
    dataToImport.forEach((doc) => {
      transaction.create(doc)
    })
    
    await transaction.commit()
    console.log('\n✅ ¡Inyección completada!')
    
    if (schemaName === 'gallery') {
      console.log('---------------------------------------------------------')
      console.log('💡 RECOMENDACIÓN PARA PICSUM:')
      console.log('Como Sanity gestiona imágenes como assets internos, ve al Studio')
      console.log('y sube estas URLs para completar los campos vacíos:')
      console.log('- https://picsum.photos/seed/ia/1200/800')
      console.log('- https://picsum.photos/seed/tech/1200/800')
      console.log('---------------------------------------------------------')
    }
  } catch (err: any) {
    console.error('❌ Error en la transacción:', err.message || err)
  } finally {
    rl.close()
  }
}

runSeed()