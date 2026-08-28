import { describe, expect, it } from 'vitest'
import type { SkillMap, SkillNode } from '../types/skillTree'
import { addDependency, deleteSkill, normalizeMap, removeDependency, wouldCreateCycle } from './skillLogic'

const node = (id: string, prerequisiteIds: string[] = []): SkillNode => ({
  id,
  type: 'skill',
  position: { x: 0, y: 0 },
  data: { id, name: id, description: '', categoryId: 'fitness', prerequisiteIds },
})
const map = (nodes: SkillNode[], edges: SkillMap['edges'] = []): SkillMap => ({ nodes, edges })

describe('neutral skill graph mutations', () => {
  it('normalizes missing and self prerequisites without adding state', () => {
    const result = normalizeMap(map([node('A', ['A', 'missing'])]))
    expect(result.nodes[0].data).toEqual({
      id: 'A', name: 'A', description: '', categoryId: 'fitness', prerequisiteIds: [],
    })
  })

  it('adds an edge and records its source as a target prerequisite', () => {
    const result = addDependency(map([node('A'), node('B')]), 'A', 'B')
    expect(result.changed).toBe(true)
    expect(result.map.edges).toEqual([expect.objectContaining({ source: 'A', target: 'B' })])
    expect(result.map.nodes.find((item) => item.id === 'B')?.data.prerequisiteIds).toEqual(['A'])
  })

  it('rejects self, duplicate, cross-category, and cyclic dependencies', () => {
    const crossCategory = { ...node('C'), data: { ...node('C').data, categoryId: 'study' } }
    const base = addDependency(map([node('A'), node('B'), crossCategory]), 'A', 'B').map
    expect(addDependency(base, 'A', 'A').reason).toBe('A skill cannot depend on itself.')
    expect(addDependency(base, 'A', 'B').reason).toBe('These skills are already connected.')
    expect(addDependency(base, 'A', 'C').reason).toBe('Skills must belong to the same category.')
    expect(wouldCreateCycle(base, 'B', 'A')).toBe(true)
    expect(addDependency(base, 'B', 'A').reason).toBe('This connection would create a cycle.')
  })

  it('removes an edge and its prerequisite reference', () => {
    const connected = addDependency(map([node('A'), node('B')]), 'A', 'B').map
    const result = removeDependency(connected, connected.edges[0].id)
    expect(result.edges).toEqual([])
    expect(result.nodes.find((item) => item.id === 'B')?.data.prerequisiteIds).toEqual([])
  })

  it('deletes a skill and every connected reference', () => {
    const connected = addDependency(map([node('A'), node('B')]), 'A', 'B').map
    const result = deleteSkill(connected, 'A')
    expect(result.nodes.map((item) => item.id)).toEqual(['B'])
    expect(result.edges).toEqual([])
    expect(result.nodes[0].data.prerequisiteIds).toEqual([])
  })
})
