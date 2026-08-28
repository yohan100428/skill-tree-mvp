import type { Edge, Node } from '@xyflow/react'

export interface TreeCategory {
  id: string
  name: string
  finalGoal: string
}

export interface DailyQuest {
  id: string
  categoryId: string
  title: string
  completedDate: string | null
}

export type SkillData = Record<string, unknown> & {
  id: string
  name: string
  description: string
  categoryId: string
  prerequisiteIds: string[]
}

export type SkillNode = Node<SkillData, 'skill'>
export type SkillEdge = Edge

export type MeNode = Node<Record<string, unknown> & { label: string }, 'me'>
export type CategoryNode = Node<Record<string, unknown> & {
  categoryId: string
  name: string
}, 'category'>
export type FinalGoalNode = Node<Record<string, unknown> & {
  categoryId: string
  label: string
}, 'finalGoal'>

export type PersonalTreeNode = MeNode | CategoryNode | FinalGoalNode | SkillNode

export interface PersonalTreeMap {
  nodes: PersonalTreeNode[]
  edges: SkillEdge[]
}

export interface SkillMap {
  nodes: SkillNode[]
  edges: SkillEdge[]
}

export interface WorkspaceData extends SkillMap {
  version: 3
  userName: string
  categories: TreeCategory[]
  quests: DailyQuest[]
  selectedCategoryId: string | null
}

export interface DependencyResult {
  map: SkillMap
  changed: boolean
  reason?: string
}
