import { ImageIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'recursoImagen',
  title: 'Imágenes Educativas (Carpetas)',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Título de la imagen',
      type: 'string',
      description: 'Nombre descriptivo para que el alumno sepa qué está abriendo.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imageFile',
      title: 'Archivo de Imagen',
      type: 'image',
      options: {
        hotspot: true, // Permite recortar/centrar la imagen desde Sanity
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción / Instrucciones',
      type: 'text',
      rows: 3,
      description: 'Opcional: Explicación o contexto para los alumnos.',
    }),
  ],
})