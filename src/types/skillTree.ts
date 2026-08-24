import type { Edge, Node } from '@xyflow/react'

export type SkillStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export type SkillData = Record<string, unknown> & {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  status: SkillStatus
  prerequisiteIds: string[]
}

export type SkillNode = Node<SkillData, 'skill'>
export type SkillEdge = Edge

export interface SkillTree {
  id: string
  name: string
  nodes: SkillNode[]
  edges: SkillEdge[]
}

export interface WorkspaceData {
  version: 1
  activeTreeId: string
  trees: SkillTree[]
}

export interface DependencyResult {
  tree: SkillTree
  changed: boolean
  reason?: string
}
