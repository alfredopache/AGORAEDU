import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'examQuestion',
  title: 'Preguntas de Examen',
  type: 'document',
  icon: () => '📝',
  fields: [
    defineField({
      name: 'question',
      title: 'Pregunta',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subject',
      title: 'Materia',
      type: 'string',
      options: {
        list: [
          { title: 'Lengua Castellana', value: 'lengua' },
          { title: 'Matemáticas', value: 'matematicas' },
          { title: 'Inglés', value: 'ingles' },
          { title: 'Ciencias Sociales', value: 'sociales' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Tema Específico',
      type: 'string',
      description: 'Ej: Ecuaciones, Sintaxis, Present Perfect, Guerra Civil, etc.',
    }),
    defineField({
      name: 'difficulty',
      title: 'Dificultad',
      type: 'string',
      options: {
        list: [
          { title: 'Básico', value: 'basico' },
          { title: 'Intermedio', value: 'intermedio' },
          { title: 'Avanzado', value: 'avanzado' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'options',
      title: 'Opciones de Respuesta',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Texto de la Opción',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'isCorrect',
              title: '¿Es Correcta?',
              type: 'boolean',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              text: 'text',
              isCorrect: 'isCorrect',
            },
            prepare({ text, isCorrect }) {
              return {
                title: text,
                subtitle: isCorrect ? '✅ Correcta' : '❌ Incorrecta',
              }
            },
          },
        },
      ],
      // Las opciones pueden estar ausentes para preguntas abiertas; no forzamos mínimo.
      // Si existen, preferimos entre 2 y 5, pero lo dejamos sin validación estricta
      // para facilitar la importación de datasets mixtos.
    }),
    defineField({
      name: 'explanation',
      title: 'Explicación de la Respuesta',
      type: 'text',
      description: 'Explica por qué la respuesta correcta es correcta',
    }),
    defineField({
      name: 'source',
      title: 'Fuente Certificada',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Nombre de la Fuente',
          type: 'string',
          description: 'Ej: Ministerio de Educación, Comunidad Autónoma, etc.',
        },
        {
          name: 'year',
          title: 'Año del Examen',
          type: 'number',
          description: 'Año de la prueba oficial',
        },
        {
          name: 'region',
          title: 'Región',
          type: 'string',
          description: 'Comunidad Autónoma o Nacional',
        },
        {
          name: 'url',
          title: 'URL de Referencia',
          type: 'url',
        },
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
      name: 'isActive',
      title: 'Activa',
      type: 'boolean',
      initialValue: true,
      description: 'Si está activa, aparecerá en los exámenes',
    }),
  ],
  preview: {
    select: {
      question: 'question',
      subject: 'subject',
      difficulty: 'difficulty',
    },
    prepare({ question, subject, difficulty }) {
      const difficultyEmoji = {
        basico: '⭐',
        intermedio: '⭐⭐',
        avanzado: '⭐⭐⭐',
      }
      return {
        title: question?.substring(0, 60) + (question?.length > 60 ? '...' : ''),
        subtitle: `${subject} - ${difficultyEmoji[difficulty as keyof typeof difficultyEmoji] || difficulty}`,
      }
    },
  },
})
