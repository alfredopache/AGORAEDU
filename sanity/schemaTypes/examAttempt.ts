import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'examAttempt',
  title: 'Intentos de Examen',
  type: 'document',
  icon: () => '📊',
  fields: [
    defineField({
      name: 'sessionId',
      title: 'ID de Sesión',
      type: 'string',
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
          { title: 'Examen Completo', value: 'completo' },
        ],
      },
      validation: (Rule) => Rule.required(),
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
          { title: 'Mixto', value: 'mixto' },
        ],
      },
    }),
    defineField({
      name: 'questions',
      title: 'Preguntas del Examen',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'questionRef',
              title: 'Referencia a Pregunta',
              type: 'reference',
              to: [{ type: 'examQuestion' }],
            },
            {
              name: 'userAnswer',
              title: 'Respuesta del Usuario',
              type: 'number',
              description: 'Índice de la opción seleccionada',
            },
            {
              name: 'isCorrect',
              title: '¿Es Correcta?',
              type: 'boolean',
            },
            {
              name: 'timeSpent',
              title: 'Tiempo Empleado (segundos)',
              type: 'number',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'score',
      title: 'Puntuación',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'totalQuestions',
      title: 'Total de Preguntas',
      type: 'number',
    }),
    defineField({
      name: 'correctAnswers',
      title: 'Respuestas Correctas',
      type: 'number',
    }),
    defineField({
      name: 'totalTime',
      title: 'Tiempo Total (segundos)',
      type: 'number',
    }),
    defineField({
      name: 'completedAt',
      title: 'Completado en',
      type: 'datetime',
    }),
    defineField({
      name: 'analysis',
      title: 'Análisis del Rendimiento',
      type: 'object',
      fields: [
        {
          name: 'strengths',
          title: 'Fortalezas',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'weaknesses',
          title: 'Áreas de Mejora',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'recommendations',
          title: 'Recomendaciones',
          type: 'text',
        },
      ],
    }),
  ],
  preview: {
    select: {
      subject: 'subject',
      score: 'score',
      completedAt: 'completedAt',
    },
    prepare({ subject, score, completedAt }) {
      const date = completedAt ? new Date(completedAt).toLocaleDateString('es-ES') : ''
      const scoreEmoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'
      return {
        title: `${subject} - ${score}% ${scoreEmoji}`,
        subtitle: date,
      }
    },
  },
})
