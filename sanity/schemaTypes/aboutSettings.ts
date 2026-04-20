import React from 'react'
import { defineField, defineType } from 'sanity'
import { InfoOutlineIcon, HelpCircleIcon } from '@sanity/icons'
import * as Icons from 'lucide-react'

export default defineType({
  name: 'aboutSettings',
  title: 'Ajustes Sobre Nosotros',
  type: 'document',
  icon: InfoOutlineIcon,
  fields: [
    defineField({
      name: 'stats',
      title: 'Estadísticas (Ticker)',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({
            name: 'icon',
            title: 'Icono',
            type: 'string',
            options: {
              list: [
                { title: 'Personas', value: 'users' },
                { title: 'Usuario único', value: 'user' },
                { title: 'Birrete', value: 'graduation' },
                { title: 'Libro', value: 'book' },
                { title: 'Pizarra/Presentación', value: 'presentation' },
                { title: 'Documento', value: 'file' },
                { title: 'Código', value: 'code' },
                { title: 'Pantalla/Monitor', value: 'monitor' },
                { title: 'Base de datos', value: 'database' },
                { title: 'Llave/Seguridad', value: 'key' },
                { title: 'Bombilla', value: 'lightbulb' },
                { title: 'Diana/Objetivo', value: 'target' },
                { title: 'Gráfico de barras', value: 'bar-chart' },
                { title: 'Gráfico de líneas', value: 'line-chart' },
                { title: 'Maletín', value: 'briefcase' },
                { title: 'Calculadora/Finanzas', value: 'calculator' },
                { title: 'Reloj', value: 'clock' },
                { title: 'Calendario', value: 'calendar' },
                { title: 'Rayo/Energía', value: 'zap' },
                { title: 'Mapa/Ubicación', value: 'map' },
                { title: 'Ajustes/Proceso', value: 'settings' },
              ],
            },
          }),
          defineField({ name: 'label', type: 'string', title: 'Etiqueta' }),
          defineField({ name: 'value', type: 'string', title: 'Valor' }),
        ],
        preview: {
          select: {
            title: 'label',
            subtitle: 'value',
            iconName: 'icon',
          },
          prepare({ title, subtitle, iconName }: any) {
            const iconMap: any = {
              'users': Icons.Users,
              'user': Icons.User,
              'graduation': Icons.GraduationCap,
              'book': Icons.Book,
              'presentation': Icons.Presentation,
              'file': Icons.FileText,
              'code': Icons.Code,
              'monitor': Icons.Monitor,
              'database': Icons.Database,
              'key': Icons.Key,
              'lightbulb': Icons.Lightbulb,
              'target': Icons.Target,
              'bar-chart': Icons.BarChart3,
              'line-chart': Icons.LineChart,
              'briefcase': Icons.Briefcase,
              'calculator': Icons.Calculator,
              'clock': Icons.Clock,
              'calendar': Icons.Calendar,
              'zap': Icons.Zap,
              'map': Icons.Map,
              'settings': Icons.Settings,
            }
            const Icon = iconMap[iconName] || Icons.HelpCircle
            return {
              title: title || 'Sin etiqueta',
              subtitle: subtitle || 'Sin valor',
              media: React.createElement(Icon),
            }
          },
        },
      }]
    }),
    defineField({
      name: 'socialLinks',
      title: 'Redes Sociales Globales',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { 
            name: 'name', 
            type: 'string', 
            title: 'Plataforma',
            options: {
              list: [
                { title: 'YouTube', value: 'Youtube' },
                { title: 'Instagram', value: 'Instagram' },
                { title: 'LinkedIn', value: 'Linkedin' },
                { title: 'X (Twitter)', value: 'X' },
                { title: 'TikTok', value: 'Tiktok' },
                { title: 'WhatsApp', value: 'Whatsapp' },
              ]
            }
          },
          { name: 'url', type: 'url', title: 'URL' }
        ]
      }]
    })
  ]
})