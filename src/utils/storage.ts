import { createDefaultWorkspace } from '../data/defaultTree'
import type { DailyQuest, SkillData, SkillEdge, SkillNode, TreeCategory, WorkspaceData } from '../types/skillTree'

export const STORAGE_KEY = 'skill-tree-workspace-v3'
export const LEGACY_STORAGE_KEY = 'skill-tree-workspace-v2'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const hasUniqueIds = (items: Array<{ id: string }>): boolean =>
  new Set(items.map((item) => item.id)).size === items.length

const isCategory = (value: unknown): value is TreeCategory =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.finalGoal === 'string' &&
  Boolean(value.name.trim()) &&
  Boolean(value.finalGoal.trim())

const isQuest = (value: unknown): value is DailyQuest =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.categoryId === 'string' &&
  typeof value.title === 'string' &&
  (value.completedDate === null || typeof value.completedDate === 'string')

const isSkillData = (value: unknown): value is SkillData =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.description === 'string' &&
  typeof value.categoryId === 'string' &&
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

const isValidGraph = (nodes: SkillNode[], edges: SkillEdge[]): boolean => {
  if (!hasUniqueIds(nodes) || !hasUniqueIds(edges)) return false
  if (nodes.some((node) => node.data.id !== node.id)) return false
  if (nodes.some((node) => (
    node.id === 'personal-root:me' ||
    node.id.startsWith('personal-category:') ||
    node.id.startsWith('personal-final-goal:')
  ))) return false

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

const createWorkspace = (
  value: Record<string, unknown>,
  categories: TreeCategory[],
  quests: DailyQuest[],
  nodes: SkillNode[],
  edges: SkillEdge[],
): WorkspaceData | null => {
  if (!hasUniqueIds(categories) || !hasUniqueIds(quests) || !isValidGraph(nodes, edges)) return null
  const categoryIds = new Set(categories.map((category) => category.id))
  const selectedCategoryId = value.selectedCategoryId
  if (
    !(selectedCategoryId === null || typeof selectedCategoryId === 'string') ||
    (selectedCategoryId !== null && !categoryIds.has(selectedCategoryId)) ||
    quests.some((quest) => !categoryIds.has(quest.categoryId)) ||
    nodes.some((node) => !categoryIds.has(node.data.categoryId))
  ) return null

  return {
    version: 3,
    userName: typeof value.userName === 'string' && value.userName.trim() ? value.userName.trim() : 'ME',
    selectedCategoryId,
    categories,
    quests,
    nodes,
    edges,
  }
}

const parseWorkspace = (value: unknown): WorkspaceData | null => {
  if (
    !isRecord(value) ||
    value.version !== 3 ||
    !Array.isArray(value.categories) || !value.categories.every(isCategory) ||
    !Array.isArray(value.quests) || !value.quests.every(isQuest) ||
    !Array.isArray(value.nodes) || !value.nodes.every(isSkillNode) ||
    !Array.isArray(value.edges) || !value.edges.every(isSkillEdge)
  ) return null

  return createWorkspace(
    value,
    value.categories.map(({ id, name, finalGoal }) => ({ id, name: name.trim(), finalGoal: finalGoal.trim() })),
    value.quests.map(({ id, categoryId, title, completedDate }) => ({ id, categoryId, title, completedDate })),
    value.nodes.map(({ id, type, position, data }) => ({
      id,
      type,
      position: { x: position.x, y: position.y },
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        prerequisiteIds: [...data.prerequisiteIds],
      },
    })),
    value.edges.map(({ id, source, target, type, animated }) => ({ id, source, target, type, animated })),
  )
}

const migrateLegacyWorkspace = (value: unknown): WorkspaceData | null => {
  if (
    !isRecord(value) || value.version !== 2 ||
    !Array.isArray(value.categories) ||
    !value.categories.every((category) => isRecord(category) && typeof category.id === 'string' && typeof category.name === 'string') ||
    !Array.isArray(value.quests) ||
    !value.quests.every((quest) => isRecord(quest) && typeof quest.id === 'string' && typeof quest.categoryId === 'string' && typeof quest.title === 'string' && (quest.completedDate === null || typeof quest.completedDate === 'string')) ||
    !Array.isArray(value.nodes) ||
    !value.nodes.every((node) => isRecord(node) && typeof node.id === 'string' && node.type === 'skill' && isRecord(node.position) && typeof node.position.x === 'number' && Number.isFinite(node.position.x) && typeof node.position.y === 'number' && Number.isFinite(node.position.y) && isRecord(node.data) && typeof node.data.id === 'string' && typeof node.data.name === 'string' && typeof node.data.description === 'string' && typeof node.data.categoryId === 'string' && Array.isArray(node.data.prerequisiteIds) && node.data.prerequisiteIds.every((id) => typeof id === 'string')) ||
    !Array.isArray(value.edges) || !value.edges.every(isSkillEdge)
  ) return null

  const categories: TreeCategory[] = value.categories.map((category) => ({
    id: String(category.id),
    name: String(category.name).trim(),
    finalGoal: '최종목표',
  }))
  const quests: DailyQuest[] = value.quests.map((quest) => ({
    id: String(quest.id),
    categoryId: String(quest.categoryId),
    title: String(quest.title),
    completedDate: quest.completedDate as string | null,
  }))
  const nodes: SkillNode[] = value.nodes.map((node) => {
    const data = node.data as Record<string, unknown>
    const position = node.position as Record<string, unknown>
    return {
      id: String(node.id),
      type: 'skill',
      position: { x: Number(position.x), y: Number(position.y) },
      data: {
        id: String(data.id),
        name: String(data.name),
        description: String(data.description),
        categoryId: String(data.categoryId),
        prerequisiteIds: [...(data.prerequisiteIds as string[])],
      },
    }
  })
  const edges: SkillEdge[] = value.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
  }))
  return createWorkspace(value, categories, quests, nodes, edges)
}

export const loadWorkspace = (storage: Storage): WorkspaceData => {
  try {
    const current = storage.getItem(STORAGE_KEY)
    if (current !== null) return parseWorkspace(JSON.parse(current)) ?? createDefaultWorkspace()
    const legacy = storage.getItem(LEGACY_STORAGE_KEY)
    if (legacy !== null) return migrateLegacyWorkspace(JSON.parse(legacy)) ?? createDefaultWorkspace()
    return createDefaultWorkspace()
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
