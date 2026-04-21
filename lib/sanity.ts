import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { projectId, dataset, apiVersion } from '@/sanity/env'

const isStub = process.env.SKIP_SANITY_CLIENT === '1'

export const client = isStub
  ? ({ fetch: async () => [] } as any)
  : createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // Ponlo en false para ver los cambios al instante mientras desarrollas
    })

// Esta herramienta nos ayudará con las imágenes más tarde
const builder = isStub ? null : imageUrlBuilder(client)
export const urlFor = (source: any) =>
  isStub
    ? stubBuilder
    : builder!.image(source)

const stubBuilder = {
  width: () => stubBuilder,
  height: () => stubBuilder,
  quality: () => stubBuilder,
  auto: () => stubBuilder,
  fit: () => stubBuilder,
  format: () => stubBuilder,
  crop: () => stubBuilder,
  url: () => '/placeholder.svg',
}
