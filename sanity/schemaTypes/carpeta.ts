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
          /* Colores originales */
          { title: 'Azul', value: 'blue' },
          { title: 'Índigo', value: 'indigo' },
          { title: 'Cian', value: 'cyan' },
          { title: 'Púrpura', value: 'purple' },
          { title: 'Esmeralda', value: 'emerald' },
          /* 🎨 Nuevos colores añadidos */
          { title: 'Violeta', value: 'violet' },
          { title: 'Fucsia', value: 'fuchsia' },
          { title: 'Rosa', value: 'pink' },
          { title: 'Rosa Intenso (Rose)', value: 'rose' },
          { title: 'Ámbar', value: 'amber' },
          { title: 'Naranja', value: 'orange' },
          { title: 'Rojo', value: 'red' },
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
            { type: 'project' },       // Proyectos
            { type: 'post' },          // Artículos / Blog
            { type: 'podcast' },       // Videos / YouTube
            { type: 'recursoImagen' }, // Imágenes educativas directas
            { type: 'recursoArchivo' } // 🗂️ Tu nuevo esquema de archivos/descargables
            // Eliminado el antiguo 'resource' para evitar inconsistencias de datos 
          ],
        },
      ],
    },
  ],
}