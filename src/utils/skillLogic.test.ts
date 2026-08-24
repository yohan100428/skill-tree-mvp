import { describe, expect, it } from 'vitest'
import type { SkillNode, SkillTree } from '../types/skillTree'
import {
  addDependency,
  deleteSkill,
  recalculateTree,
  removeDependency,
  wouldCreateCycle,
} from './skillLogic'

const node = (
  id: string,
  status: SkillNode['data']['status'],
  prerequisiteIds: string[] = [],
  level = 0,
  maxLevel = 1,
): SkillNode => ({
  id,
  type: 'skill',
  position: { x: 0, y: 0 },
  data: { id, name: id, description: '', level, maxLevel, status, prerequisiteIds },
})

const tree = (nodes: SkillNode[], edges: SkillTree['edges'] = []): SkillTree => ({
  id: 'tree',
  name: 'Tree',
  nodes,
  edges,
})

describe('recalculateTree', () => {
  it('unlocks B when its only prerequisite A is completed', () => {
    const result = recalculateTree(tree([
      node('A', 'completed', [], 1),
      node('B', 'locked', ['A']),
    ]))

    expect(result.nodes.find((item) => item.id === 'B')?.data.status).toBe('available')
  })

  it('keeps B locked while any of two prerequisites is incomplete', () => {
    const result = recalculateTree(tree([
      node('A', 'available'),
      node('C', 'completed', [], 1),
      node('B', 'available', ['A', 'C']),
    ]))

    expect(result.nodes.find((item) => item.id === 'B')?.data.status).toBe('locked')
  })

  it('unlocks B when both prerequisites are completed', () => {
    const result = recalculateTree(tree([
      node('A', 'completed', [], 1),
      node('C', 'completed', [], 1),
      node('B', 'locked', ['A', 'C']),
    ]))

    expect(result.nodes.find((item) => item.id === 'B')?.data.status).toBe('available')
  })

  it('clamps levels and derives in-progress status', () => {
    const result = recalculateTree(tree([node('A', 'available', [], 8, 0)]))
    const data = result.nodes[0].data

    expect(data.maxLevel).toBe(1)
    expect(data.level).toBe(1)
    expect(data.status).toBe('completed')
  })

  it('ignores missing prerequisite ids safely', () => {
    const result = recalculateTree(tree([node('A', 'locked', ['missing'])]))

    expect(result.nodes[0].data.prerequisiteIds).toEqual([])
    expect(result.nodes[0].data.status).toBe('available')
  })
})

describe('dependency mutations', () => {
  it('adds an edge and locks its target', () => {
    const result = addDependency(tree([node('A', 'available'), node('B', 'available')]), 'A', 'B')

    expect(result.changed).toBe(true)
    expect(result.tree.edges).toHaveLength(1)
    expect(result.tree.nodes.find((item) => item.id === 'B')?.data).toMatchObject({
      prerequisiteIds: ['A'],
      status: 'locked',
    })
  })

  it('rejects self, duplicate, and cyclic dependencies', () => {
    const base = addDependency(tree([node('A', 'available'), node('B', 'available')]), 'A', 'B').tree

    expect(addDependency(base, 'A', 'A').reason).toBe('A skill cannot depend on itself.')
    expect(addDependency(base, 'A', 'B').reason).toBe('These skills are already connected.')
    expect(wouldCreateCycle(base, 'B', 'A')).toBe(true)
    expect(addDependency(base, 'B', 'A').reason).toBe('This connection would create a cycle.')
  })

  it('removes an edge and its prerequisite reference', () => {
    const connected = addDependency(tree([node('A', 'available'), node('B', 'available')]), 'A', 'B').tree
    const result = removeDependency(connected, connected.edges[0].id)

    expect(result.edges).toHaveLength(0)
    expect(result.nodes.find((item) => item.id === 'B')?.data.prerequisiteIds).toEqual([])
  })

  it('deletes a skill and all connected references', () => {
    const connected = addDependency(tree([node('A', 'available'), node('B', 'available')]), 'A', 'B').tree
    const result = deleteSkill(connected, 'A')

    expect(result.nodes.map((item) => item.id)).toEqual(['B'])
    expect(result.edges).toEqual([])
    expect(result.nodes[0].data).toMatchObject({ prerequisiteIds: [], status: 'available' })
  })
})
