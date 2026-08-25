import type {
  CategoryNode,
  MeNode,
  PersonalTreeMap,
  SkillEdge,
  WorkspaceData,
} from '../types/skillTree'

export const ME_NODE_ID = 'personal-root:me'
const CATEGORY_NODE_PREFIX = 'personal-category:'

export const categoryNodeId = (categoryId: string): string =>
  `${CATEGORY_NODE_PREFIX}${categoryId}`

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
    data: { label: 'ME' },
    draggable: false,
    connectable: false,
    deletable: false,
  }
  const categoryCount = workspace.categories.length
  const categoryNodes: CategoryNode[] = workspace.categories.map((category, index) => {
    const angle = categoryCount === 1
      ? -Math.PI / 2
      : -Math.PI / 2 + (Math.PI * 2 * index) / categoryCount
    return {
      id: categoryNodeId(category.id),
      type: 'category',
      position: {
        x: Math.round(Math.cos(angle) * 320),
        y: Math.round(Math.sin(angle) * 260),
      },
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
