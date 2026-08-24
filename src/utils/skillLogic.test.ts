import { describe, expect, it } from 'vitest'
import type { SkillMap, SkillNode, TreeCategory } from '../types/skillTree'
import {
  addDependency,
  deleteSkill,
  recalculateMap,
  removeDependency,
  unlockSkill,
  wouldCreateCycle,
} from './skillLogic'

const categories = (coins: number): TreeCategory[] => [
  { id: 'fitness', name: 'Fitness', coinName: 'Fitness Coin', coins },
]

const node = (
  id: string,
  status: SkillNode['data']['status'] = 'locked',
  prerequisiteIds: string[] = [],
  requiredCoins = 0,
): SkillNode => ({
  id,
  type: 'skill',
  position: { x: 0, y: 0 },
  data: {
    id,
    name: id,
    description: '',
    categoryId: 'fitness',
    requiredCoins,
    status,
    prerequisiteIds,
  },
})

const map = (nodes: SkillNode[], edges: SkillMap['edges'] = []): SkillMap => ({ nodes, edges })

describe('recalculateMap', () => {
  it('keeps a skill locked when its category has fewer coins than required', () => {
    const result = recalculateMap(map([node('A', 'available', [], 100)]), categories(70))
    expect(result.nodes[0].data.status).toBe('locked')
  })

  it('keeps a funded skill locked while any prerequisite is not unlocked', () => {
    const result = recalculateMap(
      map([node('A', 'locked'), node('B', 'available', ['A'], 100)]),
      categories(100),
    )
    expect(result.nodes.find((item) => item.id === 'B')?.data.status).toBe('locked')
  })

  it('makes a funded skill available when every prerequisite is unlocked', () => {
    const result = recalculateMap(
      map([node('A', 'unlocked'), node('B', 'locked', ['A'], 100)]),
      categories(100),
    )
    expect(result.nodes.find((item) => item.id === 'B')?.data.status).toBe('available')
  })

  it('preserves an unlocked skill when requirements later stop matching', () => {
    const result = recalculateMap(map([node('A', 'unlocked', [], 100)]), categories(0))
    expect(result.nodes[0].data.status).toBe('unlocked')
  })

  it('removes missing and self prerequisite ids safely', () => {
    const result = recalculateMap(map([node('A', 'locked', ['A', 'missing'])]), categories(0))
    expect(result.nodes[0].data.prerequisiteIds).toEqual([])
    expect(result.nodes[0].data.status).toBe('available')
  })

  it('clamps coin requirements to a safe non-negative integer', () => {
    const result = recalculateMap(map([node('A', 'locked', [], Number.MAX_VALUE)]), categories(0))
    expect(result.nodes[0].data.requiredCoins).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('unlockSkill', () => {
  it('unlocks an available skill without spending category coins', () => {
    const categoryList = categories(100)
    const result = unlockSkill(map([node('A', 'available', [], 100)]), categoryList, 'A')
    expect(result.changed).toBe(true)
    expect(result.map.nodes[0].data.status).toBe('unlocked')
    expect(categoryList[0].coins).toBe(100)
  })

  it('does not unlock a locked skill', () => {
    const result = unlockSkill(map([node('A', 'locked', [], 100)]), categories(70), 'A')
    expect(result.changed).toBe(false)
    expect(result.map.nodes[0].data.status).toBe('locked')
  })
})

describe('dependency mutations', () => {
  it('adds an edge and records its source as a target prerequisite', () => {
    const result = addDependency(map([node('A', 'available'), node('B', 'available')]), categories(0), 'A', 'B')
    expect(result.changed).toBe(true)
    expect(result.map.edges).toHaveLength(1)
    expect(result.map.nodes.find((item) => item.id === 'B')?.data).toMatchObject({
      prerequisiteIds: ['A'],
      status: 'locked',
    })
  })

  it('rejects self, duplicate, and cyclic dependencies', () => {
    const base = addDependency(map([node('A'), node('B')]), categories(0), 'A', 'B').map
    expect(addDependency(base, categories(0), 'A', 'A').reason).toBe('A skill cannot depend on itself.')
    expect(addDependency(base, categories(0), 'A', 'B').reason).toBe('These skills are already connected.')
    expect(wouldCreateCycle(base, 'B', 'A')).toBe(true)
    expect(addDependency(base, categories(0), 'B', 'A').reason).toBe('This connection would create a cycle.')
  })

  it('removes an edge and its prerequisite reference', () => {
    const connected = addDependency(map([node('A'), node('B')]), categories(0), 'A', 'B').map
    const result = removeDependency(connected, categories(0), connected.edges[0].id)
    expect(result.edges).toHaveLength(0)
    expect(result.nodes.find((item) => item.id === 'B')?.data.prerequisiteIds).toEqual([])
  })

  it('deletes a skill and all connected references', () => {
    const connected = addDependency(map([node('A'), node('B')]), categories(0), 'A', 'B').map
    const result = deleteSkill(connected, categories(0), 'A')
    expect(result.nodes.map((item) => item.id)).toEqual(['B'])
    expect(result.edges).toEqual([])
    expect(result.nodes[0].data).toMatchObject({ prerequisiteIds: [], status: 'available' })
  })
})
