import { createDefaultWorkspace } from '../data/defaultTree'
import type { SkillData, SkillEdge, SkillNode, SkillTree, WorkspaceData } from '../types/skillTree'
import { recalculateTree } from './skillLogic'

export const STORAGE_KEY = 'skill-tree-workspace-v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isSkillData = (value: unknown): value is SkillData =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.description === 'string' &&
  typeof value.level === 'number' &&
  typeof value.maxLevel === 'number' &&
  ['locked', 'available', 'in-progress', 'completed'].includes(String(value.status)) &&
  Array.isArray(value.prerequisiteIds) &&
  value.prerequisiteIds.every((id) => typeof id === 'string')

const isSkillNode = (value: unknown): value is SkillNode =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  value.type === 'skill' &&
  isRecord(value.position) &&
  typeof value.position.x === 'number' &&
  Number.isFinite(value.position.x) &&
  typeof value.position.y === 'number' &&
  Number.isFinite(value.position.y) &&
  isSkillData(value.data)

const isSkillEdge = (value: unknown): value is SkillEdge =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.source === 'string' &&
  typeof value.target === 'string'

const isSkillTree = (value: unknown): value is SkillTree =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  Array.isArray(value.nodes) &&
  value.nodes.every(isSkillNode) &&
  Array.isArray(value.edges) &&
  value.edges.every(isSkillEdge)

const parseWorkspace = (value: unknown): WorkspaceData | null => {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.activeTreeId !== 'string' ||
    !Array.isArray(value.trees) ||
    value.trees.length === 0 ||
    !value.trees.every(isSkillTree) ||
    !value.trees.some((tree) => tree.id === value.activeTreeId)
  ) {
    return null
  }

  return {
    version: 1,
    activeTreeId: value.activeTreeId,
    trees: value.trees.map(recalculateTree),
  }
}

export const loadWorkspace = (storage: Storage): WorkspaceData => {
  try {
    const serialized = storage.getItem(STORAGE_KEY)
    if (!serialized) return createDefaultWorkspace()
    return parseWorkspace(JSON.parse(serialized)) ?? createDefaultWorkspace()
  } catch {
    return createDefaultWorkspace()
  }
}

export const saveWorkspace = (storage: Storage, workspace: WorkspaceData): void => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  } catch {
    // The editor remains usable when storage is unavailable or full.
  }
}
