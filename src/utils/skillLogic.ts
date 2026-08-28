import type { DependencyResult, SkillEdge, SkillMap, SkillNode } from '../types/skillTree'

export const normalizeMap = (map: SkillMap): SkillMap => {
  const nodeIds = new Set(map.nodes.map((node) => node.id))
  const edges = map.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target,
  )
  return {
    edges,
    nodes: map.nodes.map((node): SkillNode => ({
      ...node,
      data: {
        ...node.data,
        id: node.id,
        prerequisiteIds: [...new Set(node.data.prerequisiteIds)].filter(
          (id) => id !== node.id && nodeIds.has(id),
        ),
      },
    })),
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
  source: string,
  target: string,
): DependencyResult => {
  if (source === target) return { map, changed: false, reason: 'A skill cannot depend on itself.' }
  const sourceNode = map.nodes.find((node) => node.id === source)
  const targetNode = map.nodes.find((node) => node.id === target)
  if (!sourceNode || !targetNode) {
    return { map, changed: false, reason: 'One of these skills no longer exists.' }
  }
  if (sourceNode.data.categoryId !== targetNode.data.categoryId) {
    return { map, changed: false, reason: 'Skills must belong to the same category.' }
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
  return { map: normalizeMap({ nodes, edges: [...map.edges, edge] }), changed: true }
}

export const removeDependency = (map: SkillMap, edgeId: string): SkillMap => {
  const removed = map.edges.find((edge) => edge.id === edgeId)
  if (!removed) return normalizeMap(map)

  return normalizeMap({
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
  })
}

export const deleteSkill = (map: SkillMap, skillId: string): SkillMap => normalizeMap({
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
})
