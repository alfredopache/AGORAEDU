import { client } from '@/lib/sanity'

export const getTeamMembers = async () => {
  const query = `*[_type == "member"] | order(_createdAt asc) {
    name,
    role,
    "image": image.asset->url,
    bio,
    // Traemos el array de redes sociales tal cual lo definimos en el esquema
    socials[] {
      platform,
      url
    }
  }`

  try {
    const members = await client.fetch(query)
    return members
  } catch (error) {
    console.error("Error obteniendo miembros del equipo:", error)
    return []
  }
}