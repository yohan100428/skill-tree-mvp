import type { SkillNode } from '../types/skillTree'

export const getSkillDepths = (nodes: SkillNode[]): Map<string, number> => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const depths = new Map<string, number>()

  const findDepth = (skillId: string, visiting: Set<string>): number => {
    const saved = depths.get(skillId)
    if (saved !== undefined) return saved
    if (visiting.has(skillId)) return 0

    const node = nodesById.get(skillId)
    if (!node) return 0
    const nextVisiting = new Set(visiting).add(skillId)
    const localPrerequisites = node.data.prerequisiteIds.filter((id) => nodesById.has(id))
    const depth = localPrerequisites.length === 0
      ? 0
      : Math.max(...localPrerequisites.map((id) => findDepth(id, nextVisiting))) + 1
    depths.set(skillId, depth)
    return depth
  }

  nodes.forEach((node) => findDepth(node.id, new Set()))
  return depths
}

export const groupSkillsByDepth = (nodes: SkillNode[]): SkillNode[][] => {
  const depths = getSkillDepths(nodes)
  const groups: SkillNode[][] = []
  nodes.forEach((node) => {
    const depth = depths.get(node.id) ?? 0
    groups[depth] = [...(groups[depth] ?? []), node]
  })
  return groups.filter(Boolean)
}
