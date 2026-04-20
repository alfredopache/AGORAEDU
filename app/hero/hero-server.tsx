// app/hero/hero-server.tsx
import { client } from "@/sanity/lib/client"
import { HeroClient } from "./hero-client" // Asegúrate de que el nombre coincida

export const dynamic = 'force-dynamic'

export default async function HeroServer() {
  const query = `*[_type == "settings"][0]{ heroCards }`
  const data = await client.fetch(query)
  const cards = data?.heroCards || []

  return (
    <HeroClient sanityCards={cards} />
  )
}