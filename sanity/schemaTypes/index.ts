import { type SchemaTypeDefinition } from 'sanity'
import { postType } from './postType'
import member from './member'
import project from './project'
import podcast from './podcast'
import suggestion from './suggestion'
import settings from './settings'
import resources from './resources'
import category from './category'
import aboutSettings from './aboutSettings'
import chatConversation from './chatConversation'
import examQuestion from './examQuestion'
import examAttempt from './examAttempt'
import userStreak from './userStreak'
import carpeta from './carpeta'
import recursoImagen from './recursoImagen'
import recursoArchivo from './recursoArchivo'

// 1. Definimos el array de tipos plano
const types: SchemaTypeDefinition[] = [
  postType,
  project,
  carpeta,
  category,
  podcast,
  resources,
  member,
  suggestion,
  settings,
  aboutSettings,
  chatConversation,
  examQuestion,
  examAttempt,
  userStreak,
  recursoImagen,
  recursoArchivo,
]

// 2. Exportamos exactamente la constante "schema" que busca tu sanity.config.ts
export const schema = {
  types: types
}