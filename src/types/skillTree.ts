import type { Edge, Node } from '@xyflow/react'

export type SkillStatus = 'locked' | 'available' | 'unlocked'

export interface TreeCategory {
  id: string
  name: string
  coinName: string
  coins: number
}

export interface DailyQuest {
  id: string
  categoryId: string
  title: string
  rewardCoins: number
  completedDate: string | null
}

export type SkillData = Record<string, unknown> & {
  id: string
  name: string
  description: string
  categoryId: string
  requiredCoins: number
  prerequisiteIds: string[]
  status: SkillStatus
}

export type SkillNode = Node<SkillData, 'skill'>
export type SkillEdge = Edge

export interface SkillMap {
  nodes: SkillNode[]
  edges: SkillEdge[]
}

export interface WorkspaceData extends SkillMap {
  version: 2
  categories: TreeCategory[]
  quests: DailyQuest[]
  selectedCategoryId: string | null
}

export interface DependencyResult {
  map: SkillMap
  changed: boolean
  reason?: string
}

export interface UnlockResult {
  map: SkillMap
  changed: boolean
}
