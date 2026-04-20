import { defineType, defineField } from 'sanity'
import { CommentIcon } from '@sanity/icons'

export default defineType({
  name: 'suggestion',
  title: 'Sugerencias de Temas',
  type: 'document',
  icon: CommentIcon, // Siempre ayuda visualmente en la barra lateral
  fields: [
    defineField({
      name: 'text',
      title: 'Sugerencia',
      type: 'text',
      // Solo es editable si el documento NO existe todavía (durante la creación por API)
      readOnly: ({ document }) => !!document?._createdAt, 
    }),
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Nueva 🆕', value: 'new' },
          { title: 'Leída 👁️', value: 'read' },
          { title: 'En producción 🎬', value: 'doing' },
          { title: 'Completada ✅', value: 'done' }, // Añadí esta por si acaso
        ]
      },
      initialValue: 'new'
    })
  ],
  // Ordenar para que las más nuevas salgan primero en el Studio
  orderings: [
    {
      title: 'Fecha de recepción',
      name: 'arrivalDateDesc',
      by: [{ field: '_createdAt', direction: 'desc' }]
    }
  ],
  preview: {
    select: {
      title: 'text',
      subtitle: 'status'
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Sin contenido',
        subtitle: `Estado: ${subtitle}`
      }
    }
  }
})