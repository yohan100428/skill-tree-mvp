import { describe, expect, it } from 'vitest'
import { createDefaultWorkspace } from '../data/defaultTree'
import type { SkillNode, WorkspaceData } from '../types/skillTree'
import { buildPersonalTree, getCategoryPosition, getSuggestedSkillPosition } from './personalTree'

const skill = (
  id: string,
  categoryId: string,
  prerequisiteIds: string[] = [],
): SkillNode => ({
  id,
  type: 'skill',
  position: { x: 100, y: 100 },
  data: {
    id,
    name: id,
    description: '',
    categoryId,
    requiredCoins: 0,
    prerequisiteIds,
    status: 'locked',
  },
})

describe('personal skill map graph', () => {
  it('keeps ME as the only node in a fresh workspace', () => {
    const map = buildPersonalTree(createDefaultWorkspace())

    expect(map.nodes.map(({ id, type }) => ({ id, type }))).toEqual([
      { id: 'personal-root:me', type: 'me' },
    ])
    expect(map.edges).toEqual([])
  })

  it('branches every category from ME on the same map', () => {
    const workspace: WorkspaceData = {
      ...createDefaultWorkspace(),
      selectedCategoryId: 'fitness',
      categories: [
        { id: 'fitness', name: '운동', coinName: 'Fitness Coin', coins: 3 },
        { id: 'license', name: '자격증', coinName: 'License Coin', coins: 1 },
      ],
    }

    const map = buildPersonalTree(workspace)

    expect(map.nodes.map((node) => node.id)).toEqual([
      'personal-root:me',
      'personal-category:fitness',
      'personal-category:license',
    ])
    expect(map.edges.map(({ source, target }) => [source, target])).toEqual([
      ['personal-root:me', 'personal-category:fitness'],
      ['personal-root:me', 'personal-category:license'],
    ])
  })

  it('connects root skills to their category and dependent skills to prerequisites', () => {
    const rootSkill = skill('fitness-start', 'fitness')
    const dependentSkill = skill('fitness-30-days', 'fitness', ['fitness-start'])
    const workspace: WorkspaceData = {
      ...createDefaultWorkspace(),
      selectedCategoryId: 'fitness',
      categories: [{ id: 'fitness', name: '운동', coinName: 'Fitness Coin', coins: 0 }],
      nodes: [rootSkill, dependentSkill],
      edges: [{ id: 'fitness-start->fitness-30-days', source: 'fitness-start', target: 'fitness-30-days' }],
    }

    const map = buildPersonalTree(workspace)

    expect(map.edges.map(({ source, target }) => [source, target])).toEqual([
      ['personal-root:me', 'personal-category:fitness'],
      ['personal-category:fitness', 'fitness-start'],
      ['fitness-start', 'fitness-30-days'],
    ])
  })

  it('places a new skill farther outward along its category branch', () => {
    const workspace: WorkspaceData = {
      ...createDefaultWorkspace(),
      selectedCategoryId: 'fitness',
      categories: [{ id: 'fitness', name: '운동', coinName: 'Fitness Coin', coins: 0 }],
    }
    const categoryPosition = getCategoryPosition(workspace.categories, 'fitness')
    const rootPosition = getSuggestedSkillPosition(workspace, 'fitness')
    const withRoot = { ...workspace, nodes: [{ ...skill('fitness-start', 'fitness'), position: rootPosition }] }

    expect(categoryPosition).toEqual({ x: 0, y: 260 })
    expect(rootPosition).toEqual({ x: 0, y: 480 })
    expect(getSuggestedSkillPosition(withRoot, 'fitness', 'fitness-start')).toEqual({ x: 0, y: 700 })
  })
})
