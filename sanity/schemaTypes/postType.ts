import { defineField, defineType } from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Blog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del Artículo',
      type: 'string',
      description: 'Escribe un título atractivo para los alumnos o profesores.',
      validation: (Rule) => Rule.required().min(10).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Enlace (URL)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Fecha de publicación',
      type: 'date',
      options: {
        dateFormat: 'DD-MM-YYYY',
      },
      initialValue: () => new Date().toISOString().split('T')[0],
    }),
    defineField({
      name: 'image',
      title: 'Imagen de portada',
      type: 'image',
      options: {
        hotspot: true, // Permite recortar la imagen visualmente
      },
    }),
    defineField({
      name: 'readTime',
      title: 'Tiempo de lectura',
      type: 'string',
      description: 'Ej: 5 min read',
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumen (Cita)',
      type: 'text',
      rows: 3,
      description: 'Un pequeño adelanto que aparece en la lista de artículos.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'content',
      title: 'Contenido del artículo',
      type: 'array',
      of: [
        { type: 'block' }, // Texto enriquecido
        { type: 'image', title: 'Imagen dentro del texto' } // Permite meter fotos entre párrafos
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Etiquetas',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'member',
      title: 'Miembro del equipo',
      type: 'reference',
      to: [{ type: 'member' }],
    }),
  ],
})