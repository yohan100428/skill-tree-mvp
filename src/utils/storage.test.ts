import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultWorkspace } from '../data/defaultTree'
import { loadWorkspace, saveWorkspace, STORAGE_KEY } from './storage'

describe('workspace persistence', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips tree names, skill data, edges, positions, and active tree', () => {
    const workspace = createDefaultWorkspace()
    workspace.trees[0].name = 'My Engineering'
    workspace.trees[0].nodes[0].position = { x: 777, y: 333 }
    workspace.trees[0].nodes[0].data.description = 'Root skill'

    saveWorkspace(localStorage, workspace)

    const restored = loadWorkspace(localStorage)
    expect(restored.activeTreeId).toBe('engineering-tree')
    expect(restored.trees[0].name).toBe('My Engineering')
    expect(restored.trees[0].nodes[0]).toMatchObject({
      position: { x: 777, y: 333 },
      data: { description: 'Root skill' },
    })
    expect(restored.trees[0].edges).toHaveLength(5)
  })

  it('returns a fresh demo workspace for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })

  it('returns a fresh demo workspace for structurally invalid data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeTreeId: 'x', trees: [] }))

    expect(loadWorkspace(localStorage)).toEqual(createDefaultWorkspace())
  })
})
