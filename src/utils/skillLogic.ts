import type {
  DependencyResult,
  SkillEdge,
  SkillMap,
  SkillNode,
  TreeCategory,
  UnlockResult,
} from '../types/skillTree'

export const toNonNegativeInteger = (value: number): number =>
  Number.isFinite(value)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(value)))
    : 0

export const recalculateMap = (map: SkillMap, categories: TreeCategory[]): SkillMap => {
  const nodeIds = new Set(map.nodes.map((node) => node.id))
  const categoryCoins = new Map(categories.map((category) => [category.id, category.coins]))
  const edges = map.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target,
  )

  const normalizedNodes = map.nodes.map((node): SkillNode => ({
    ...node,
    data: {
      ...node.data,
      id: node.id,
      requiredCoins: toNonNegativeInteger(node.data.requiredCoins),
      prerequisiteIds: [...new Set(node.data.prerequisiteIds)].filter(
        (id) => id !== node.id && nodeIds.has(id),
      ),
    },
  }))
  const unlockedIds = new Set(
    normalizedNodes.filter((node) => node.data.status === 'unlocked').map((node) => node.id),
  )

  return {
    edges,
    nodes: normalizedNodes.map((node): SkillNode => {
      if (unlockedIds.has(node.id)) return node
      const coins = categoryCoins.get(node.data.categoryId)
      const hasCoins = coins !== undefined && coins >= node.data.requiredCoins
      const hasPrerequisites = node.data.prerequisiteIds.every((id) => unlockedIds.has(id))
      return {
        ...node,
        data: { ...node.data, status: hasCoins && hasPrerequisites ? 'available' : 'locked' },
      }
    }),
  }
}

export const unlockSkill = (
  map: SkillMap,
  categories: TreeCategory[],
  skillId: string,
): UnlockResult => {
  const current = recalculateMap(map, categories)
  const skill = current.nodes.find((node) => node.id === skillId)
  if (!skill || skill.data.status !== 'available') return { map: current, changed: false }

  return {
    changed: true,
    map: recalculateMap({
      ...current,
      nodes: current.nodes.map((node) => node.id === skillId
        ? { ...node, data: { ...node.data, status: 'unlocked' } }
        : node),
    }, categories),
  }
}

export const wouldCreateCycle = (map: SkillMap, source: string, target: string): boolean => {
  if (source === target) return true
  const outgoing = new Map<string, string[]>()
  map.edges.forEach((edge) => {
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

export const addDependency = (
  map: SkillMap,
  categories: TreeCategory[],
  source: string,
  target: string,
): DependencyResult => {
  if (source === target) return { map, changed: false, reason: 'A skill cannot depend on itself.' }
  if (!map.nodes.some((node) => node.id === source) || !map.nodes.some((node) => node.id === target)) {
    return { map, changed: false, reason: 'One of these skills no longer exists.' }
  }
  if (map.edges.some((edge) => edge.source === source && edge.target === target)) {
    return { map, changed: false, reason: 'These skills are already connected.' }
  }
  if (wouldCreateCycle(map, source, target)) {
    return { map, changed: false, reason: 'This connection would create a cycle.' }
  }

  const edge: SkillEdge = {
    id: `${source}->${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: true,
  }
  const nodes = map.nodes.map((node) => node.id === target
    ? { ...node, data: { ...node.data, prerequisiteIds: [...node.data.prerequisiteIds, source] } }
    : node)
  return { map: recalculateMap({ nodes, edges: [...map.edges, edge] }, categories), changed: true }
}

export const removeDependency = (
  map: SkillMap,
  categories: TreeCategory[],
  edgeId: string,
): SkillMap => {
  const removed = map.edges.find((edge) => edge.id === edgeId)
  if (!removed) return recalculateMap(map, categories)

  return recalculateMap({
    edges: map.edges.filter((edge) => edge.id !== edgeId),
    nodes: map.nodes.map((node) => node.id === removed.target
      ? {
          ...node,
          data: {
            ...node.data,
            prerequisiteIds: node.data.prerequisiteIds.filter((id) => id !== removed.source),
          },
        }
      : node),
  }, categories)
}

export const deleteSkill = (
  map: SkillMap,
  categories: TreeCategory[],
  skillId: string,
): SkillMap => recalculateMap({
  nodes: map.nodes
    .filter((node) => node.id !== skillId)
    .map((node) => ({
      ...node,
      data: {
        ...node.data,
        prerequisiteIds: node.data.prerequisiteIds.filter((id) => id !== skillId),
      },
    })),
  edges: map.edges.filter((edge) => edge.source !== skillId && edge.target !== skillId),
}, categories)
