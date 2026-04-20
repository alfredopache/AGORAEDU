import React from 'react'
import * as Icons from 'lucide-react'
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Proyecto',
  type: 'document',
  fields: [
    // --- 0. CAMPOS DE CONTROL (SISTEMA) ---
    defineField({
      name: 'isSeed',
      title: 'Dato de Prueba (Seed)',
      type: 'boolean',
      readOnly: true,
      description: 'Este campo indica si el proyecto fue creado mediante el script de carga automática.',
    }),

    // --- 1. CABECERA (HERO) ---
    defineField({
      name: 'title',
      title: 'Título del Proyecto',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Fecha de publicación',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (Rule) => Rule.required(),
    }),

    // --- CAMBIO AQUÍ: CATEGORÍA DINÁMICA ---
    defineField({
      name: 'category',
      title: 'Categoría',
      description: 'Selecciona una categoría de las definidas en Configuración Global',
      type: 'reference',
      to: [{ type: 'category' }], // Apunta al documento de configuración
      // Usamos una opción avanzada para mostrar solo las categorías del array de settings
      options: {
        disableNew: true, // Evita crear un nuevo documento de settings desde aquí
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'image',
      title: 'Imagen de portada',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumen corto (Excerpt)',
      type: 'text',
      rows: 3,
      description: 'Aparece en las tarjetas y bajo el título principal.',
    }),
    defineField({
      name: 'file',
      title: 'Archivo del proyecto (PDF/ZIP)',
      type: 'file',
      description: 'Botón de descarga principal.',
    }),

    // --- 2. FICHA TÉCNICA ---
    defineField({
      name: 'specs',
      title: 'Ficha Técnica Personalizada',
      type: 'array',
      description: 'Datos que aparecen en la barra gris (Área, Nivel, etc.)',
      of: [
        {
          type: 'object',
          fields: [
            {
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
            },
            { name: 'label', title: 'Etiqueta', type: 'string' },
            { name: 'value', title: 'Valor', type: 'string' },
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
        },
      ],
    }),

    // --- 3. CUERPO Y TAXONOMÍA ---
    defineField({
      name: 'content',
      title: 'Contenido del Proyecto',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'tags',
      title: 'Conceptos Clave (Tags)',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),

    // --- 4. SECCIÓN FINAL ---
    defineField({
      name: 'showAula',
      title: '¿Mostrar sección "Aplicación en el Aula"?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'aulaContent',
      title: 'Contenido: Aplicación en el Aula',
      type: 'text',
      hidden: ({ document }) => !document?.showAula,
    })
  ],
})