import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

const baseConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
}

export const client = createClient(baseConfig)

// Client para operaciones de escritura (server-only). Usa el token de entorno si está disponible.
export const writeClient = createClient({
  ...baseConfig,
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN,
})
