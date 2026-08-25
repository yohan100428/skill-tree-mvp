import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultWorkspace, createLegacyDemoWorkspace } from '../data/defaultTree'
import { loadWorkspace, saveWorkspace, STORAGE_KEY } from './storage'

describe('version 2 workspace persistence', () => {
  beforeEach(() => localStorage.clear())

  it('migrates the untouched legacy demo to the empty initial workspace', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createLegacyDemoWorkspace()))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('preserves legacy-shaped data after the user has changed it', () => {
    const workspace = createLegacyDemoWorkspace()
    workspace.nodes[0].data.description = '내가 만든 설명'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))

    expect(loadWorkspace(localStorage).nodes[0].data.description).toBe('내가 만든 설명')
  })

  it('round-trips categories, quests, skill unlocks, edges, and positions', () => {
    const workspace = createLegacyDemoWorkspace()
    workspace.categories[0].coins = 47
    workspace.quests[0].completedDate = '2026-08-24'
    workspace.nodes[0].position = { x: 777, y: 333 }
    workspace.nodes[0].data.description = 'Root skill'
    workspace.nodes[0].data.status = 'unlocked'

    saveWorkspace(localStorage, workspace)

    const restored = loadWorkspace(localStorage)
    expect(restored.version).toBe(2)
    expect(restored.selectedCategoryId).toBe('fitness')
    expect(restored.categories[0]).toMatchObject({ coinName: 'Fitness Coin', coins: 47 })
    expect(restored.quests[0]).toMatchObject({ completedDate: '2026-08-24', rewardCoins: 1 })
    expect(restored.nodes[0]).toMatchObject({
      position: { x: 777, y: 333 },
      data: { categoryId: 'fitness', description: 'Root skill', status: 'unlocked' },
    })
    expect(restored.edges.length).toBeGreaterThan(0)
  })

  it('returns the empty initial workspace for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')
    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('returns the empty initial workspace for a skill with an invalid category', () => {
    const invalid = createLegacyDemoWorkspace()
    invalid.nodes[0].data.categoryId = 'missing'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))
    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('ignores the previous version 1 storage document', () => {
    localStorage.setItem('skill-tree-workspace-v1', JSON.stringify({
      version: 1,
      activeTreeId: 'old',
      trees: [{ id: 'old', name: 'Old', nodes: [], edges: [] }],
    }))
    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects duplicate category, quest, or node ids', () => {
    const invalid = createLegacyDemoWorkspace()
    invalid.nodes.push({ ...invalid.nodes[0], data: { ...invalid.nodes[0].data } })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects a cyclic stored graph', () => {
    const invalid = createLegacyDemoWorkspace()
    invalid.edges.push({
      id: 'fitness-100-days->fitness-start',
      source: 'fitness-100-days',
      target: 'fitness-start',
    })
    invalid.nodes[0].data.prerequisiteIds.push('fitness-100-days')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('rejects disagreement between edges and prerequisite ids', () => {
    const invalid = createLegacyDemoWorkspace()
    invalid.nodes.find((node) => node.id === 'fitness-3-week')!.data.prerequisiteIds = []
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })
})
