import { MicrophoneIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'podcast',
  title: 'Podcasts',
  type: 'document',
  icon: MicrophoneIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Título del episodio',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'URL de YouTube',
      type: 'url',
      description: 'Copia y pega el enlace completo del video de YouTube',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción/Resumen',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'coverImage',
      title: 'Imagen de portada',
      type: 'image',
      options: { hotspot: true },
      description: 'Si se deja vacío, se sacará la miniatura de YouTube.',
    }),
    defineField({
      name: 'duration',
      title: 'Duración',
      type: 'string',
      description: 'Ejemplo: 15:20',
    }),defineField({
      name: 'tags', // <--- Nuevo campo
      title: 'Etiquetas',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags', // Esto hace que se vean como "píldoras" en el editor
      },
    }),
    defineField({
      name: 'isFeatured',
      title: 'Destacar manualmente',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})