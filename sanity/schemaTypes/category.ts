import { TagIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Categoría',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Nombre' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
  ],
})