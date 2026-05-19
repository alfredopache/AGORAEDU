import { Folder } from 'lucide-react'

export default {
  name: 'carpeta',
  title: 'Carpetas / Colecciones',
  type: 'document',
  icon: Folder,
  fields: [
    {
      name: 'title',
      title: 'Nombre de la Carpeta',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Descripción de la Carpeta',
      type: 'text',
      rows: 3,
    },
    {
      name: 'color',
      title: 'Color de la Carpeta',
      type: 'string',
      initialValue: 'blue',
      options: {
        list: [
          { title: 'Azul', value: 'blue' },
          { title: 'Índigo', value: 'indigo' },
          { title: 'Cian', value: 'cyan' },
          { title: 'Violeta', value: 'purple' },
          { title: 'Esmeralda', value: 'emerald' },
        ],
      },
    },
    {
      name: 'items',
      title: 'Contenido Vinculado',
      description: 'Añade entradas de Blog, Proyectos, Podcasts o Recursos a esta carpeta.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'project' },   // Correcto
            { type: 'post' },      // CORREGIDO: Antes 'blog'
            { type: 'podcast' },   // CORREGIDO: Antes 'multimedia'
            { type: 'resource' },  // CORREGIDO: Antes 'resource' (plural según tu index)
            { type: 'recursoImagen' } // Nuevo tipo para imágenes educativas
          ],
        },
      ],
    },
  ],
}