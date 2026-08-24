import type { DependencyResult, SkillEdge, SkillNode, SkillTree } from '../types/skillTree'

const clampInteger = (value: number, minimum: number, maximum?: number): number => {
  const finiteValue = Number.isFinite(value) ? Math.round(value) : minimum
  return Math.min(Math.max(finiteValue, minimum), maximum ?? Number.POSITIVE_INFINITY)
}

export const recalculateTree = (tree: SkillTree): SkillTree => {
  const nodeIds = new Set(tree.nodes.map((node) => node.id))
  const edges = tree.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target,
  )
  const completedIds = new Set<string>()

  const normalizedNodes = tree.nodes.map((node): SkillNode => {
    const maxLevel = clampInteger(node.data.maxLevel, 1)
    const level = clampInteger(node.data.level, 0, maxLevel)
    if (node.data.status === 'completed' || level === maxLevel) completedIds.add(node.id)

    return {
      ...node,
      data: {
        ...node.data,
        id: node.id,
        maxLevel,
        level,
        prerequisiteIds: [...new Set(node.data.prerequisiteIds)].filter(
          (prerequisiteId) => nodeIds.has(prerequisiteId) && prerequisiteId !== node.id,
        ),
      },
    }
  })

  const nodes = normalizedNodes.map((node): SkillNode => {
    const { level, maxLevel, prerequisiteIds } = node.data
    const completed = completedIds.has(node.id)
    const unlocked = prerequisiteIds.every((id) => completedIds.has(id))
    const status = completed
      ? 'completed'
      : unlocked
        ? level > 0
          ? 'in-progress'
          : 'available'
        : 'locked'

    return { ...node, data: { ...node.data, level: completed ? maxLevel : level, status } }
  })

  return { ...tree, nodes, edges }
}

export const wouldCreateCycle = (tree: SkillTree, source: string, target: string): boolean => {
  if (source === target) return true
  const outgoing = new Map<string, string[]>()
  tree.edges.forEach((edge) => {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target])
  })

  const pending = [target]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const current = pending.pop()!
    if (current === source) return true
    if (visited.has(current)) continue
    visited.add(current)
    pending.push(...(outgoing.get(current) ?? []))
  }
  return false
}

export const addDependency = (tree: SkillTree, source: string, target: string): DependencyResult => {
  if (source === target) return { tree, changed: false, reason: 'A skill cannot depend on itself.' }
  if (!tree.nodes.some((node) => node.id === source) || !tree.nodes.some((node) => node.id === target)) {
    return { tree, changed: false, reason: 'One of these skills no longer exists.' }
  }
  if (tree.edges.some((edge) => edge.source === source && edge.target === target)) {
    return { tree, changed: false, reason: 'These skills are already connected.' }
  }
  if (wouldCreateCycle(tree, source, target)) {
    return { tree, changed: false, reason: 'This connection would create a cycle.' }
  }

  const edge: SkillEdge = {
    id: `${source}->${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: true,
  }
  const nodes = tree.nodes.map((node) =>
    node.id === target
      ? { ...node, data: { ...node.data, prerequisiteIds: [...node.data.prerequisiteIds, source] } }
      : node,
  )
  return { tree: recalculateTree({ ...tree, nodes, edges: [...tree.edges, edge] }), changed: true }
}

export const removeDependency = (tree: SkillTree, edgeId: string): SkillTree => {
  const removed = tree.edges.find((edge) => edge.id === edgeId)
  if (!removed) return recalculateTree(tree)

  return recalculateTree({
    ...tree,
    edges: tree.edges.filter((edge) => edge.id !== edgeId),
    nodes: tree.nodes.map((node) =>
      node.id === removed.target
        ? {
            ...node,
            data: {
              ...node.data,
              prerequisiteIds: node.data.prerequisiteIds.filter((id) => id !== removed.source),
            },
          }
        : node,
    ),
  })
}

export const deleteSkill = (tree: SkillTree, skillId: string): SkillTree =>
  recalculateTree({
    ...tree,
    nodes: tree.nodes
      .filter((node) => node.id !== skillId)
      .map((node) => ({
        ...node,
        data: {
          ...node.data,
          prerequisiteIds: node.data.prerequisiteIds.filter((id) => id !== skillId),
        },
      })),
    edges: tree.edges.filter((edge) => edge.source !== skillId && edge.target !== skillId),
  })
