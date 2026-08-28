import type { WorkspaceData } from '../types/skillTree'

export const createDefaultWorkspace = (): WorkspaceData => ({
  version: 3,
  userName: 'ME',
  selectedCategoryId: null,
  categories: [],
  quests: [],
  nodes: [],
  edges: [],
})
