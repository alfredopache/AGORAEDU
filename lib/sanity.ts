import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { projectId, dataset, apiVersion } from '@/sanity/env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Ponlo en false para ver los cambios al instante mientras desarrollas
})

// Esta herramienta nos ayudará con las imágenes más tarde
const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)