import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'chatConversation',
  title: 'Conversaciones de Chat',
  type: 'document',
  icon: () => '💬',
  fields: [
    defineField({
      name: 'title',
      title: 'Título de la Conversación',
      type: 'string',
      description: 'Generado automáticamente del primer mensaje',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sessionId',
      title: 'ID de Sesión',
      type: 'string',
      description: 'ID único para la sesión del navegador',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'userEmail',
      title: 'Email del usuario (propietario)',
      type: 'string',
      description: 'Correo del usuario autenticado que creó/posee la conversación (si aplica)',
    }),
    defineField({
      name: 'messages',
      title: 'Mensajes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'role',
              title: 'Rol',
              type: 'string',
              options: {
                list: [
                  { title: 'Usuario', value: 'user' },
                  { title: 'Asistente', value: 'assistant' },
                ],
              },
            },
            {
              name: 'content',
              title: 'Contenido',
              type: 'text',
            },
            {
              name: 'timestamp',
              title: 'Fecha y Hora',
              type: 'datetime',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'createdAt',
      title: 'Creado',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Última Actualización',
      type: 'datetime',
    }),
    defineField({
      name: 'subject',
      title: 'Materia Principal',
      type: 'string',
      options: {
        list: [
          { title: 'Lengua Castellana', value: 'lengua' },
          { title: 'Matemáticas', value: 'matematicas' },
          { title: 'Inglés', value: 'ingles' },
          { title: 'Ciencias Sociales', value: 'sociales' },
          { title: 'General', value: 'general' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subject: 'subject',
      createdAt: 'createdAt',
    },
    prepare({ title, subject, createdAt }) {
      const date = createdAt ? new Date(createdAt).toLocaleDateString('es-ES') : ''
      return {
        title: title || 'Sin título',
        subtitle: `${subject || 'General'} - ${date}`,
      }
    },
  },
})
