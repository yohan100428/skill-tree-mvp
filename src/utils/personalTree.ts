import type {
  CategoryNode,
  FinalGoalNode,
  MeNode,
  PersonalTreeMap,
  SkillEdge,
  TreeCategory,
  WorkspaceData,
} from '../types/skillTree'
import { Position } from '@xyflow/react'
import type { NodeHandle, XYPosition } from '@xyflow/react'

export const ME_NODE_ID = 'personal-root:me'
const CATEGORY_NODE_PREFIX = 'personal-category:'
const FINAL_GOAL_NODE_PREFIX = 'personal-final-goal:'
const NODE_SIZE = {
  me: { initialWidth: 154, initialHeight: 154 },
  category: { initialWidth: 150, initialHeight: 68 },
  finalGoal: { initialWidth: 170, initialHeight: 78 },
  skill: { initialWidth: 164, initialHeight: 76 },
} as const

const nodeHandles = (width: number, height: number, target: boolean, source: boolean): NodeHandle[] => [
  ...(target ? [{
    id: null,
    type: 'target' as const,
    position: Position.Top,
    x: width / 2 - 5,
    y: -5,
    width: 10,
    height: 10,
  }] : []),
  ...(source ? [{
    id: null,
    type: 'source' as const,
    position: Position.Bottom,
    x: width / 2 - 5,
    y: height - 5,
    width: 10,
    height: 10,
  }] : []),
]

export const categoryNodeId = (categoryId: string): string =>
  `${CATEGORY_NODE_PREFIX}${categoryId}`

export const finalGoalNodeId = (categoryId: string): string =>
  `${FINAL_GOAL_NODE_PREFIX}${categoryId}`

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
    ...NODE_SIZE.me,
    handles: nodeHandles(NODE_SIZE.me.initialWidth, NODE_SIZE.me.initialHeight, false, true),
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
      ...NODE_SIZE.category,
      handles: nodeHandles(NODE_SIZE.category.initialWidth, NODE_SIZE.category.initialHeight, true, true),
      data: {
        categoryId: category.id,
        name: category.name,
      },
      draggable: false,
      connectable: false,
      deletable: false,
    }
  })
  const finalGoalNodes: FinalGoalNode[] = workspace.categories.map((category) => {
    const angle = categoryAngle(workspace.categories, category.id)
    const direction = { x: Math.cos(angle), y: Math.sin(angle) }
    const categoryPosition = getCategoryPosition(workspace.categories, category.id)
    const categorySkills = workspace.nodes.filter((skill) => skill.data.categoryId === category.id)
    const farthestProjection = Math.max(
      categoryPosition.x * direction.x + categoryPosition.y * direction.y,
      ...categorySkills.map((skill) => skill.position.x * direction.x + skill.position.y * direction.y),
    )
    return {
      id: finalGoalNodeId(category.id),
      type: 'finalGoal',
      position: {
        x: roundedCoordinate(direction.x * (farthestProjection + 260)),
        y: roundedCoordinate(direction.y * (farthestProjection + 260)),
      },
      ...NODE_SIZE.finalGoal,
      handles: nodeHandles(NODE_SIZE.finalGoal.initialWidth, NODE_SIZE.finalGoal.initialHeight, true, false),
      data: { categoryId: category.id, label: category.finalGoal },
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
  const finalGoalEdges = workspace.categories.flatMap((category) => {
    const categorySkills = workspace.nodes.filter((skill) => skill.data.categoryId === category.id)
    const categorySkillIds = new Set(categorySkills.map((skill) => skill.id))
    const terminalSkills = categorySkills.filter((skill) =>
      !workspace.edges.some((edge) => edge.source === skill.id && categorySkillIds.has(edge.target)))
    const sources = terminalSkills.length > 0
      ? terminalSkills.map((skill) => skill.id)
      : [categoryNodeId(category.id)]
    return sources.map((source) => derivedEdge(source, finalGoalNodeId(category.id)))
  })

  return {
    nodes: [
      meNode,
      ...categoryNodes,
      ...finalGoalNodes,
      ...workspace.nodes.map((node) => ({
        ...NODE_SIZE.skill,
        handles: nodeHandles(NODE_SIZE.skill.initialWidth, NODE_SIZE.skill.initialHeight, true, true),
        ...node,
      })),
    ],
    edges: [...categoryEdges, ...rootSkillEdges, ...finalGoalEdges, ...workspace.edges],
  }
}
