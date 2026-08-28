import type {
  CategoryNode,
  MeNode,
  PersonalTreeMap,
  SkillEdge,
  TreeCategory,
  WorkspaceData,
} from '../types/skillTree'
import type { XYPosition } from '@xyflow/react'

export const ME_NODE_ID = 'personal-root:me'
const CATEGORY_NODE_PREFIX = 'personal-category:'

export const categoryNodeId = (categoryId: string): string =>
  `${CATEGORY_NODE_PREFIX}${categoryId}`

const categoryAngle = (categories: TreeCategory[], categoryId: string): number => {
  if (!categories.some((category) => category.id === categoryId)) return 0
  let hash = 2166136261
  for (const character of categoryId) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) / 0x100000000) * Math.PI * 2
}

const roundedCoordinate = (value: number): number => {
  const rounded = Math.round(value)
  return Object.is(rounded, -0) ? 0 : rounded
}

export const getCategoryPosition = (
  categories: TreeCategory[],
  categoryId: string,
): XYPosition => {
  const angle = categoryAngle(categories, categoryId)
  return {
    x: roundedCoordinate(Math.cos(angle) * 320),
    y: roundedCoordinate(Math.sin(angle) * 260),
  }
}

const siblingOffset = (index: number): number => {
  if (index === 0) return 0
  const distance = Math.ceil(index / 2) * 110
  return index % 2 === 1 ? distance : -distance
}

export const getSuggestedSkillPosition = (
  workspace: WorkspaceData,
  categoryId: string,
  prerequisiteId?: string,
): XYPosition => {
  const angle = categoryAngle(workspace.categories, categoryId)
  const direction = { x: Math.cos(angle), y: Math.sin(angle) }
  const origin = prerequisiteId
    ? workspace.nodes.find((node) => node.id === prerequisiteId)?.position
    : getCategoryPosition(workspace.categories, categoryId)
  const siblings = workspace.nodes.filter((node) => prerequisiteId
    ? node.data.prerequisiteIds.includes(prerequisiteId)
    : node.data.categoryId === categoryId && node.data.prerequisiteIds.length === 0)
  const offset = siblingOffset(siblings.length)

  return {
    x: roundedCoordinate((origin?.x ?? 0) + direction.x * 220 - direction.y * offset),
    y: roundedCoordinate((origin?.y ?? 0) + direction.y * 220 + direction.x * offset),
  }
}

const derivedEdge = (source: string, target: string): SkillEdge => ({
  id: `personal-edge:${source}->${target}`,
  source,
  target,
  type: 'smoothstep',
  animated: false,
  deletable: false,
})

export const buildPersonalTree = (workspace: WorkspaceData): PersonalTreeMap => {
  const meNode: MeNode = {
    id: ME_NODE_ID,
    type: 'me',
    position: { x: 0, y: 0 },
    data: { label: workspace.userName },
    draggable: false,
    connectable: false,
    deletable: false,
  }
  const categoryNodes: CategoryNode[] = workspace.categories.map((category) => {
    return {
      id: categoryNodeId(category.id),
      type: 'category',
      position: getCategoryPosition(workspace.categories, category.id),
      data: {
        categoryId: category.id,
        name: category.name,
        coinName: category.coinName,
        coins: category.coins,
      },
      draggable: false,
      connectable: false,
      deletable: false,
    }
  })
  const categoryEdges = workspace.categories.map((category) =>
    derivedEdge(ME_NODE_ID, categoryNodeId(category.id)))
  const rootSkillEdges = workspace.nodes
    .filter((skill) => skill.data.prerequisiteIds.length === 0)
    .map((skill) => derivedEdge(categoryNodeId(skill.data.categoryId), skill.id))

  return {
    nodes: [meNode, ...categoryNodes, ...workspace.nodes],
    edges: [...categoryEdges, ...rootSkillEdges, ...workspace.edges],
  }
}
