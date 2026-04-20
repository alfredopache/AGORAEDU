export default {
  name: 'resource',
  title: 'Recursos',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Título del Recurso',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'IA', value: 'IA' },
          { title: 'Emprendimiento', value: 'Emprendimiento' },
          { title: 'Desarrollo', value: 'Desarrollo' },
          { title: 'Presentaciones', value: 'Presentaciones' },
        ],
      },
    },
    {
      name: 'file',
      title: 'Archivo',
      type: 'file',
      fields: [
        {
          name: 'description',
          type: 'string',
          title: 'Descripción corta',
        }
      ],
      validation: (Rule: any) => Rule.required(),
    },
  ],
}