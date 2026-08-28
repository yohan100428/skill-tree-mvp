import { describe, expect, it } from 'vitest'
import { createDefaultWorkspace } from '../data/defaultTree'
import type { SkillNode, TreeCategory, WorkspaceData } from '../types/skillTree'
import {
  buildPersonalTree,
  categoryNodeId,
  finalGoalNodeId,
  getCategoryPosition,
  getSuggestedSkillPosition,
} from './personalTree'

const category = (id: string, name: string, finalGoal: string): TreeCategory => ({ id, name, finalGoal })
const skill = (id: string, categoryId: string, prerequisiteIds: string[] = []): SkillNode => ({
  id,
  type: 'skill',
  position: { x: 100, y: 100 },
  data: { id, name: id, description: '', categoryId, prerequisiteIds },
})
const edgePairs = (workspace: WorkspaceData) =>
  buildPersonalTree(workspace).edges.map(({ source, target }) => [source, target])

describe('personal skill map graph', () => {
  it('keeps the named user as the only node in a fresh workspace', () => {
    const workspace = { ...createDefaultWorkspace(), userName: '민준' }
    const map = buildPersonalTree(workspace)

    expect(map.nodes).toEqual([expect.objectContaining({
      id: 'personal-root:me',
      type: 'me',
      data: { label: '민준' },
    })])
    expect(map.edges).toEqual([])
  })

  it('creates user to category to final-goal branches when no skills exist', () => {
    const workspace: WorkspaceData = {
      ...createDefaultWorkspace(),
      categories: [
        category('fitness', '운동', '마라톤 완주'),
        category('license', '자격증', '기사 자격증 취득'),
      ],
    }

    expect(buildPersonalTree(workspace).nodes.map(({ id, type }) => ({ id, type }))).toEqual([
      { id: 'personal-root:me', type: 'me' },
      { id: categoryNodeId('fitness'), type: 'category' },
      { id: categoryNodeId('license'), type: 'category' },
      { id: finalGoalNodeId('fitness'), type: 'finalGoal' },
      { id: finalGoalNodeId('license'), type: 'finalGoal' },
    ])
    expect(edgePairs(workspace)).toEqual([
      ['personal-root:me', categoryNodeId('fitness')],
      ['personal-root:me', categoryNodeId('license')],
      [categoryNodeId('fitness'), finalGoalNodeId('fitness')],
      [categoryNodeId('license'), finalGoalNodeId('license')],
    ])
  })

  it('puts a chain of user-defined skills before the final goal', () => {
    const workspace: WorkspaceData = {
      ...createDefaultWorkspace(),
      categories: [category('fitness', '운동', '마라톤 완주')],
      nodes: [skill('warmup', 'fitness'), skill('run', 'fitness', ['warmup'])],
      edges: [{ id: 'warmup->run', source: 'warmup', target: 'run' }],
    }

    expect(edgePairs(workspace)).toEqual([
      ['personal-root:me', categoryNodeId('fitness')],
      [categoryNodeId('fitness'), 'warmup'],
      ['run', finalGoalNodeId('fitness')],
      ['warmup', 'run'],
    ])
  })

  it('converges every terminal skill on the final goal', () => {
    const workspace: WorkspaceData = {
      ...createDefaultWorkspace(),
      categories: [category('fitness', '운동', '마라톤 완주')],
      nodes: [skill('run', 'fitness'), skill('strength', 'fitness')],
    }

    expect(edgePairs(workspace)).toEqual([
      ['personal-root:me', categoryNodeId('fitness')],
      [categoryNodeId('fitness'), 'run'],
      [categoryNodeId('fitness'), 'strength'],
      ['run', finalGoalNodeId('fitness')],
      ['strength', finalGoalNodeId('fitness')],
    ])
  })

  it('places each added skill farther outward along its stable category direction', () => {
    const fitness = category('fitness', '운동', '마라톤 완주')
    const study = category('study', '공부', '논문 완성')
    const license = category('license', '자격증', '기사 자격증 취득')
    const workspace: WorkspaceData = { ...createDefaultWorkspace(), categories: [fitness] }
    const categoryPosition = getCategoryPosition(workspace.categories, 'fitness')
    const rootPosition = getSuggestedSkillPosition(workspace, 'fitness')
    const withRoot = { ...workspace, nodes: [{ ...skill('warmup', 'fitness'), position: rootPosition }] }
    const dependentPosition = getSuggestedSkillPosition(withRoot, 'fitness', 'warmup')

    expect(Math.round(Math.hypot(rootPosition.x - categoryPosition.x, rootPosition.y - categoryPosition.y))).toBe(220)
    expect(Math.round(Math.hypot(dependentPosition.x - rootPosition.x, dependentPosition.y - rootPosition.y))).toBe(220)
    expect(getCategoryPosition([fitness, study], 'fitness')).toEqual(getCategoryPosition([fitness, study, license], 'fitness'))
  })
})
