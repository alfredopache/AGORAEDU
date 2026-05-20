import { DocumentIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'recursoArchivo',
  title: 'Archivos Descargables (Carpetas)',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Título del archivo',
      type: 'string',
      description: 'Nombre descriptivo que verá el alumno (ej: "Apuntes Tema 4", "Plantilla Excel").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'Archivo Adjunto',
      type: 'file',
      description: 'Sube el documento aquí (PDF, Word, Excel, ZIP, etc.).',
      options: {
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar', // Extensiones sugeridas en el selector
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción / Instrucciones',
      type: 'text',
      rows: 3,
      description: 'Opcional: Explicación o contexto sobre qué contiene este archivo.',
    }),
  ],
})