import { createDefaultWorkspace } from '../data/defaultTree'
import type {
  DailyQuest,
  SkillData,
  SkillEdge,
  SkillNode,
  TreeCategory,
  WorkspaceData,
} from '../types/skillTree'
import { recalculateMap, toNonNegativeInteger } from './skillLogic'

export const STORAGE_KEY = 'skill-tree-workspace-v2'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isCategory = (value: unknown): value is TreeCategory =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.coinName === 'string' &&
  typeof value.coins === 'number' &&
  Number.isFinite(value.coins)

const isQuest = (value: unknown): value is DailyQuest =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.categoryId === 'string' &&
  typeof value.title === 'string' &&
  typeof value.rewardCoins === 'number' &&
  Number.isFinite(value.rewardCoins) &&
  (value.completedDate === null || typeof value.completedDate === 'string')

const isSkillData = (value: unknown): value is SkillData =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.description === 'string' &&
  typeof value.categoryId === 'string' &&
  typeof value.requiredCoins === 'number' &&
  Number.isFinite(value.requiredCoins) &&
  ['locked', 'available', 'unlocked'].includes(String(value.status)) &&
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

const hasUniqueIds = (items: Array<{ id: string }>): boolean =>
  new Set(items.map((item) => item.id)).size === items.length

const isValidGraph = (nodes: SkillNode[], edges: SkillEdge[]): boolean => {
  if (!hasUniqueIds(nodes) || !hasUniqueIds(edges)) return false
  if (nodes.some((node) => node.data.id !== node.id)) return false

  const nodeIds = new Set(nodes.map((node) => node.id))
  const edgePairs = new Set<string>()
  const incoming = new Map(nodes.map((node) => [node.id, new Set<string>()]))
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]))
  const indegree = new Map(nodes.map((node) => [node.id, 0]))

  for (const edge of edges) {
    const pair = `${edge.source}\u0000${edge.target}`
    if (
      edge.source === edge.target ||
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target) ||
      edgePairs.has(pair)
    ) return false
    edgePairs.add(pair)
    incoming.get(edge.target)!.add(edge.source)
    outgoing.get(edge.source)!.push(edge.target)
    indegree.set(edge.target, indegree.get(edge.target)! + 1)
  }

  for (const node of nodes) {
    const prerequisites = node.data.prerequisiteIds
    const expected = incoming.get(node.id)!
    if (
      new Set(prerequisites).size !== prerequisites.length ||
      prerequisites.length !== expected.size ||
      prerequisites.some((id) => !expected.has(id))
    ) return false
  }

  const pending = [...indegree].filter(([, count]) => count === 0).map(([id]) => id)
  let visited = 0
  while (pending.length > 0) {
    const current = pending.pop()!
    visited += 1
    for (const target of outgoing.get(current)!) {
      const next = indegree.get(target)! - 1
      indegree.set(target, next)
      if (next === 0) pending.push(target)
    }
  }
  return visited === nodes.length
}

const parseWorkspace = (value: unknown): WorkspaceData | null => {
  if (
    !isRecord(value) ||
    value.version !== 2 ||
    !Array.isArray(value.categories) ||
    !value.categories.every(isCategory) ||
    !Array.isArray(value.quests) ||
    !value.quests.every(isQuest) ||
    !Array.isArray(value.nodes) ||
    !value.nodes.every(isSkillNode) ||
    !Array.isArray(value.edges) ||
    !value.edges.every(isSkillEdge) ||
    !(value.selectedCategoryId === null || typeof value.selectedCategoryId === 'string')
  ) return null

  if (
    !hasUniqueIds(value.categories) ||
    !hasUniqueIds(value.quests) ||
    !isValidGraph(value.nodes, value.edges)
  ) return null

  const categories = value.categories.map((category) => ({
    ...category,
    coins: toNonNegativeInteger(category.coins),
  }))
  const categoryIds = new Set(categories.map((category) => category.id))
  if (
    (value.selectedCategoryId !== null && !categoryIds.has(value.selectedCategoryId)) ||
    value.quests.some((quest) => !categoryIds.has(quest.categoryId)) ||
    value.nodes.some((node) => !categoryIds.has(node.data.categoryId))
  ) return null

  const quests = value.quests.map((quest) => ({
    ...quest,
    rewardCoins: toNonNegativeInteger(quest.rewardCoins),
  }))
  const map = recalculateMap({ nodes: value.nodes, edges: value.edges }, categories)
  return {
    version: 2,
    selectedCategoryId: value.selectedCategoryId,
    categories,
    quests,
    ...map,
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
    // Keep the in-memory app usable when storage is unavailable or full.
  }
}
