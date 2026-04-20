import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Crear cliente de Sanity con configuración explícita
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ms990wam',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-03-11',
  useCdn: false,
})

async function seedJorgeBallesteros() {
  console.log('🌱 Agregando Jorge Ballesteros al equipo...')

  try {
    // Verificar si ya existe
    const existing = await client.fetch(
      `*[_type == "member" && name == "Jorge Ballesteros"][0]`
    )

    if (existing) {
      console.log('ℹ️  Jorge Ballesteros ya existe en el equipo. Omitiendo...')
      return
    }

    // Crear el documento del miembro
    const member = {
      _type: 'member',
      name: 'Jorge Ballesteros',
      role: 'DESARROLLADOR FULL-STACK',
      bio: 'Desarrollador Front-End y Back-end con 7 años de experiencia en el desarrollo.',
      socials: [
        {
          _type: 'socialLink',
          platform: 'instagram',
          url: 'https://instagram.com/gorjue.j'
        }
      ],
      // Nota: La imagen debe subirse manualmente desde Sanity Studio
      // o proporcionar una URL de imagen si tienes una
    }

    const result = await client.create(member)
    console.log('✅ Jorge Ballesteros agregado exitosamente!')
    console.log(`   ID: ${result._id}`)
    console.log('')
    console.log('⚠️  IMPORTANTE: Debes agregar su foto de perfil manualmente:')
    console.log('   1. Ve a: http://localhost:3000/admin')
    console.log('   2. Abre "Miembro del equipo"')
    console.log('   3. Busca "Jorge Ballesteros"')
    console.log('   4. Sube su foto de perfil')
    console.log('   5. Haz clic en "Publish"')
  } catch (error) {
    console.error('❌ Error al agregar Jorge Ballesteros:', error)
    throw error
  }
}

async function main() {
  try {
    await seedJorgeBallesteros()
    console.log('')
    console.log('🎉 ¡Proceso completado!')
  } catch (error) {
    console.error('Error en el proceso:', error)
    process.exit(1)
  }
}

main()
