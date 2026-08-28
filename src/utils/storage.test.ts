import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultWorkspace } from '../data/defaultTree'
import type { WorkspaceData } from '../types/skillTree'
import { LEGACY_STORAGE_KEY, loadWorkspace, saveWorkspace, STORAGE_KEY } from './storage'

const populatedWorkspace = (): WorkspaceData => ({
  version: 3,
  userName: '민준',
  selectedCategoryId: 'fitness',
  categories: [{ id: 'fitness', name: '운동', finalGoal: '마라톤 완주' }],
  quests: [{ id: 'daily', categoryId: 'fitness', title: '달리기', completedDate: '2026-08-28' }],
  nodes: [{
    id: 'run',
    type: 'skill',
    position: { x: 777, y: 333 },
    data: { id: 'run', name: '달리기', description: 'Root skill', categoryId: 'fitness', prerequisiteIds: [] },
  }],
  edges: [],
})

const legacyWorkspace = () => ({
  version: 2,
  userName: 'ME',
  selectedCategoryId: 'fitness',
  categories: [{ id: 'fitness', name: '운동', coinName: 'Fitness Coin', coins: 0 }],
  quests: [{ id: 'fitness-daily', categoryId: 'fitness', title: '오늘 운동하기', rewardCoins: 1, completedDate: null as string | null }],
  nodes: [
    { id: 'fitness-start', type: 'skill', position: { x: 150, y: 30 }, data: { id: 'fitness-start', name: '운동 시작', description: '', categoryId: 'fitness', requiredCoins: 0, status: 'available', prerequisiteIds: [] as string[] } },
    { id: 'fitness-next', type: 'skill', position: { x: 370, y: 30 }, data: { id: 'fitness-next', name: '운동 지속', description: '', categoryId: 'fitness', requiredCoins: 5, status: 'locked', prerequisiteIds: ['fitness-start'] } },
  ],
  edges: [{ id: 'fitness-start->fitness-next', source: 'fitness-start', target: 'fitness-next', type: 'smoothstep', animated: true }],
})

describe('version 3 workspace persistence', () => {
  beforeEach(() => localStorage.clear())

  it('uses a lean version 3 workspace model', () => {
    expect(createDefaultWorkspace().version).toBe(3)
    expect(STORAGE_KEY).toBe('skill-tree-workspace-v3')
  })

  it('round-trips goals, quests, skills, and positions', () => {
    const workspace = populatedWorkspace()
    saveWorkspace(localStorage, workspace)

    expect(loadWorkspace(localStorage)).toEqual(workspace)
  })

  it('migrates user-authored version 2 data without coin or unlock fields', () => {
    const legacy = legacyWorkspace()
    legacy.userName = '민준'
    legacy.categories[0].coins = 47
    legacy.quests[0].completedDate = '2026-08-24'
    legacy.nodes[0].position = { x: 777, y: 333 }
    legacy.nodes[0].data.description = 'Root skill'
    legacy.nodes[0].data.status = 'unlocked'
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy))

    const migrated = loadWorkspace(localStorage)
    expect(migrated.version).toBe(3)
    expect(migrated.userName).toBe('민준')
    expect(migrated.categories[0]).toEqual({ id: 'fitness', name: '운동', finalGoal: '최종목표' })
    expect(migrated.quests[0]).toEqual({
      id: 'fitness-daily', categoryId: 'fitness', title: '오늘 운동하기', completedDate: '2026-08-24',
    })
    expect(migrated.nodes[0]).toEqual(expect.objectContaining({
      position: { x: 777, y: 333 },
      data: {
        id: 'fitness-start',
        name: '운동 시작',
        description: 'Root skill',
        categoryId: 'fitness',
        prerequisiteIds: [],
      },
    }))
    expect(migrated.edges.length).toBeGreaterThan(0)
  })

  it('prefers current data when both storage versions exist', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyWorkspace()))
    saveWorkspace(localStorage, populatedWorkspace())

    expect(loadWorkspace(localStorage).userName).toBe('민준')
  })

  it('returns the empty workspace for malformed current JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')
    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects invalid category references', () => {
    const invalid = populatedWorkspace()
    invalid.nodes[0].data.categoryId = 'missing'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects blank final goals', () => {
    const invalid = populatedWorkspace()
    invalid.categories[0].finalGoal = '   '
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects duplicate ids and cyclic graphs', () => {
    const invalid = populatedWorkspace()
    invalid.nodes.push({
      id: 'strength',
      type: 'skill',
      position: { x: 0, y: 0 },
      data: { id: 'strength', name: '근력', description: '', categoryId: 'fitness', prerequisiteIds: ['run'] },
    })
    invalid.edges.push(
      { id: 'run->strength', source: 'run', target: 'strength' },
      { id: 'strength->run', source: 'strength', target: 'run' },
    )
    invalid.nodes[0].data.prerequisiteIds = ['strength']
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects skill ids reserved for derived mind-map nodes', () => {
    const invalid = populatedWorkspace()
    invalid.nodes[0].id = 'personal-root:me'
    invalid.nodes[0].data.id = 'personal-root:me'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })
})
