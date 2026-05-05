import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'userStreak',
  title: 'Rachas de Usuarios',
  type: 'document',
  icon: () => '🔥',
  fields: [
    defineField({
      name: 'email',
      title: 'Email del Usuario',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'currentStreak',
      title: 'Racha Actual (días)',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'longestStreak',
      title: 'Racha Más Larga',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'lastPracticeDate',
      title: 'Último Día de Práctica (YYYY-MM-DD)',
      type: 'string',
    }),
    defineField({
      name: 'totalPracticeDays',
      title: 'Total Días de Práctica',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      email: 'email',
      streak: 'currentStreak',
    },
    prepare(selection: { email?: string; streak?: string | number }) {
      const { email, streak } = selection
      const formattedStreak = Number(streak || 0)
      return {
        title: email || 'Usuario desconocido',
        subtitle: `🔥 ${formattedStreak} días de racha`,
      }
    },
  },
})
