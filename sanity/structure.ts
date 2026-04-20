import type { StructureResolver } from 'sanity/structure'
import { 
  CogIcon, 
  TagIcon, 
  CaseIcon, 
  UsersIcon, 
  DatabaseIcon, 
  DocumentIcon, 
  InfoOutlineIcon 
} from '@sanity/icons'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Panel de Control')
    .items([
      // 1. Proyectos
      S.documentTypeListItem('project')
        .title('Proyectos')
        .icon(CaseIcon),

      // 2. Blog
      S.documentTypeListItem('post')
        .title('Blog'),

      // 3. Podcasts
      S.documentTypeListItem('podcast')
        .title('Podcasts')
        .icon(DatabaseIcon),

      // 4. Recursos (CAMBIO: Probamos con 'resource' en singular)
      // Si tu archivo en schemaTypes tiene name: 'resource', usa 'resource' aquí.
      S.documentTypeListItem('resource') 
        .title('Recursos')
        .icon(DocumentIcon),

      S.divider(),

      // 5. Equipo
      S.documentTypeListItem('member')
        .title('Equipo')
        .icon(UsersIcon),

      // 6. Sugerencias
      S.documentTypeListItem('suggestion')
        .title('Sugerencias')
        .icon(InfoOutlineIcon),

      S.divider(),

      // 7. CONFIGURACIÓN
      S.listItem()
        .title('Configuración')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Ajustes')
            .items([
              S.listItem()
                .title('Ajustes Generales')
                .icon(CogIcon)
                .child(
                  S.document()
                    .schemaType('settings')
                    .documentId('settings')
                ),
              // --- NUEVA SECCIÓN ---
              S.listItem()
                .title('Sobre Nosotros')
                .icon(InfoOutlineIcon)
                .child(
                  S.document()
                    .schemaType('aboutSettings')
                    .documentId('aboutSettings')
                ),
              S.documentTypeListItem('category')
                .title('Categorías de Proyectos')
                .icon(TagIcon),
            ])
        ),

      // Filtro actualizado para incluir 'aboutSettings' y evitar duplicados
      ...S.documentTypeListItems().filter(
        (listItem) => 
          !['project', 'post', 'podcast', 'resource', 'member', 'suggestion', 'settings', 'category', 'aboutSettings'].includes(
            listItem.getId() || ''
          )
      ),
    ])