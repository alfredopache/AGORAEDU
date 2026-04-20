import { defineField, defineType } from 'sanity'
import { UsersIcon, LinkIcon } from '@sanity/icons'

export default defineType({
  name: 'member',
  title: 'Miembro del equipo',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Puesto / Cargo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Foto de Perfil',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Biografía Corta',
      type: 'text',
      rows: 3,
      description: 'Una breve descripción que aparecerá al pasar el ratón.',
    }),
    defineField({
      name: 'socials',
      title: 'Redes Sociales',
      type: 'array',
      description: 'Añade los enlaces a redes sociales del miembro.',
      of: [
        {
          type: 'object',
          name: 'socialLink',
          icon: LinkIcon,
          fields: [
            defineField({
              name: 'platform',
              title: 'Plataforma',
              type: 'string',
              options: {
                list: [
                  { title: 'LinkedIn', value: 'linkedin' },
                  { title: 'GitHub', value: 'github' },
                  { title: 'X (Twitter)', value: 'x' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'Discord', value: 'discord' },
                  { title: 'Behance (Diseño)', value: 'behance' },
                  { title: 'Dribbble (Diseño)', value: 'dribbble' },
                  { title: 'Twitch', value: 'twitch' },
                  { title: 'Website Personal', value: 'globe' },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL del perfil',
              type: 'url',
              validation: (Rule) => Rule.required().uri({
                scheme: ['http', 'https']
              }),
            }),
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'url'
            },
            prepare({ title, subtitle }) {
              return {
                title: title ? title.charAt(0).toUpperCase() + title.slice(1) : 'Red Social',
                subtitle: subtitle
              }
            }
          }
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'image'
    }
  }
})