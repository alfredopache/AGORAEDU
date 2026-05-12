import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'resource',
  title: 'Recursos',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del Recurso',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'IA', value: 'IA' },
          { title: 'Emprendimiento', value: 'Emprendimiento' },
          { title: 'Desarrollo', value: 'Desarrollo' },
          { title: 'Presentaciones', value: 'Presentaciones' },
        ],
      },
    }),
    defineField({
      name: 'author',
      title: 'Autor',
      type: 'string',
      description: 'Nombre de la persona que ha elaborado o escrito el recurso.',
    }),
    defineField({
      name: 'file',
      title: 'Archivo',
      type: 'file',
      fields: [
        defineField({
          name: 'description',
          type: 'string',
          title: 'Descripción corta',
        })
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
})