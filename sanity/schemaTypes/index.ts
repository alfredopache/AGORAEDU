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

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    postType,
    project,
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
  ],
}
  