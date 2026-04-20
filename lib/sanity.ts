import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-02-13', // Puedes usar la fecha de hoy
  useCdn: false, // Ponlo en false para ver los cambios al instante mientras desarrollas
})

// Esta herramienta nos ayudará con las imágenes más tarde
const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)