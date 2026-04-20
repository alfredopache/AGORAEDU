import React from 'react'
import { defineType, defineField } from 'sanity'
import { CogIcon, StarIcon, UnknownIcon, TagIcon } from '@sanity/icons'
import * as LucideIcons from 'lucide-react'

// Mapeo para consistencia visual en el Preview de Sanity
const ICON_MAP: any = {
  'users': LucideIcons.Users,
  'user': LucideIcons.User,
  'graduation': LucideIcons.GraduationCap,
  'book': LucideIcons.Book,
  'presentation': LucideIcons.Presentation,
  'file': LucideIcons.FileText,
  'code': LucideIcons.Code,
  'monitor': LucideIcons.Monitor,
  'database': LucideIcons.Database,
  'key': LucideIcons.Key,
  'lightbulb': LucideIcons.Lightbulb,
  'target': LucideIcons.Target,
  'bar-chart': LucideIcons.BarChart3,
  'line-chart': LucideIcons.LineChart,
  'briefcase': LucideIcons.Briefcase,
  'calculator': LucideIcons.Calculator,
  'clock': LucideIcons.Clock,
  'calendar': LucideIcons.Calendar,
  'zap': LucideIcons.Zap,
  'map': LucideIcons.Map,
  'settings': LucideIcons.Settings,
  'brain': LucideIcons.BrainCircuit,
  'sparkles': LucideIcons.Sparkles,
  'rocket': LucideIcons.Rocket,
}

export default defineType({
  name: 'settings',
  title: 'Configuración Global',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'showPodcastFilters',
      title: 'Mostrar Filtros de Podcasts',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'showSuggestions',
      title: 'Activar Sugerencias',
      type: 'boolean',
      initialValue: true,
    }),

    // --- SECCIÓN: HERO FLOATING CARDS ---
    defineField({
      name: 'heroCards',
      title: 'Tarjetas Flotantes del Hero',
      description: 'Elementos visuales que orbitan en la página principal.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'floatingCard',
          icon: StarIcon,
          fields: [
            defineField({
              name: 'title',
              title: 'Texto de la Tarjeta',
              type: 'string',
              validation: (Rule) => Rule.required().max(25),
            }),
            defineField({
              name: 'icon',
              title: 'Icono',
              type: 'string',
              options: {
                list: [
                  { title: 'IA (Cerebro)', value: 'brain' },
                  { title: 'Innovación (Chispas)', value: 'sparkles' },
                  { title: 'Cohete', value: 'rocket' },
                  { title: 'Personas', value: 'users' },
                  { title: 'Usuario único', value: 'user' },
                  { title: 'Birrete', value: 'graduation' },
                  { title: 'Libro', value: 'book' },
                  { title: 'Pizarra', value: 'presentation' },
                  { title: 'Código', value: 'code' },
                  { title: 'Monitor', value: 'monitor' },
                  { title: 'Base de datos', value: 'database' },
                  { title: 'Bombilla', value: 'lightbulb' },
                  { title: 'Diana/Objetivo', value: 'target' },
                  { title: 'Gráfico Barras', value: 'bar-chart' },
                  { title: 'Maletín', value: 'briefcase' },
                  { title: 'Calculadora', value: 'calculator' },
                  { title: 'Rayo/Energía', value: 'zap' },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              iconName: 'icon',
            },
            prepare({ title, iconName }) {
              const Icon = ICON_MAP[iconName] || UnknownIcon
              return {
                title: title || 'Sin texto',
                subtitle: `Icono: ${iconName}`,
                media: Icon,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(6).warning('Se recomiendan máximo 6 tarjetas.'),
    }),
  ],
})