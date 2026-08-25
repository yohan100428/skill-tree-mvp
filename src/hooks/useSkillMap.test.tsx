import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createLegacyDemoWorkspace } from '../data/defaultTree'
import { saveWorkspace } from '../utils/storage'
import { useSkillMap } from './useSkillMap'

describe('useSkillMap', () => {
  beforeEach(() => {
    localStorage.clear()
    const existingWorkspace = createLegacyDemoWorkspace()
    existingWorkspace.nodes[0].data.description = 'Existing user workspace'
    saveWorkspace(localStorage, existingWorkspace)
  })

  it('creates and selects a category with a default coin name', () => {
    const { result } = renderHook(() => useSkillMap())

    act(() => { result.current.addCategory('독서', '') })

    const category = result.current.workspace.categories.at(-1)
    expect(category).toMatchObject({ name: '독서', coinName: '독서 Coin', coins: 0 })
    expect(result.current.workspace.selectedCategoryId).toBe(category?.id)
  })

  it('deleting a category cascades through its quests, skills, and edges', () => {
    const { result } = renderHook(() => useSkillMap())
    let categoryId = ''
    let skillId = ''

    act(() => { categoryId = result.current.addCategory('Music', 'Music Coin') })
    act(() => { result.current.addQuest({ title: 'Practice', categoryId, rewardCoins: 2 }) })
    act(() => {
      skillId = result.current.addSkill({
        name: 'Play scales',
        categoryId,
        requiredCoins: 3,
      })!
    })
    act(() => { result.current.connectSkills({ source: 'fitness-start', target: skillId, sourceHandle: null, targetHandle: null }) })
    act(() => { result.current.deleteCategory(categoryId) })

    expect(result.current.workspace.categories.some((category) => category.id === categoryId)).toBe(false)
    expect(result.current.workspace.quests.some((quest) => quest.categoryId === categoryId)).toBe(false)
    expect(result.current.workspace.nodes.some((node) => node.id === skillId)).toBe(false)
    expect(result.current.workspace.edges.some((edge) => edge.target === skillId)).toBe(false)
  })

  it('completing a quest updates coins and recalculates skill status', () => {
    const { result } = renderHook(() => useSkillMap())
    let skillId = ''

    act(() => {
      skillId = result.current.addSkill({
        name: 'One coin skill',
        categoryId: 'fitness',
        requiredCoins: 1,
      })!
    })
    expect(result.current.workspace.nodes.find((node) => node.id === skillId)?.data.status).toBe('locked')

    act(() => { result.current.completeQuest('fitness-daily', '2026-08-24') })

    expect(result.current.workspace.categories.find((category) => category.id === 'fitness')?.coins).toBe(1)
    expect(result.current.workspace.nodes.find((node) => node.id === skillId)?.data.status).toBe('available')
  })

  it('rejects an empty or unknown category when editing a skill', () => {
    const { result } = renderHook(() => useSkillMap())

    act(() => { result.current.updateSkill('fitness-start', { categoryId: '' }) })
    expect(result.current.workspace.nodes.find((node) => node.id === 'fitness-start')?.data.categoryId)
      .toBe('fitness')

    act(() => { result.current.updateSkill('fitness-start', { categoryId: 'missing' }) })
    expect(result.current.workspace.nodes.find((node) => node.id === 'fitness-start')?.data.categoryId)
      .toBe('fitness')
  })

  it('creates a complete quest for an explicitly selected Tree', () => {
    const { result } = renderHook(() => useSkillMap())
    let questId = ''

    act(() => {
      questId = result.current.addQuest({
        title: '수학 공부',
        categoryId: 'study',
        rewardCoins: 2,
      })!
    })

    expect(result.current.workspace.quests.find((quest) => quest.id === questId)).toMatchObject({
      title: '수학 공부',
      categoryId: 'study',
      rewardCoins: 2,
      completedDate: null,
    })
  })

  it('creates a complete skill and preserves its prerequisite as an edge', () => {
    const { result } = renderHook(() => useSkillMap())
    let skillId = ''

    act(() => {
      skillId = result.current.addSkill({
        name: '운동 30일',
        description: '매일 운동합니다.',
        categoryId: 'fitness',
        requiredCoins: 30,
        prerequisiteId: 'fitness-3-week',
      })!
    })

    expect(result.current.workspace.nodes.find((node) => node.id === skillId)?.data).toMatchObject({
      name: '운동 30일',
      description: '매일 운동합니다.',
      categoryId: 'fitness',
      requiredCoins: 30,
      prerequisiteIds: ['fitness-3-week'],
    })
    expect(result.current.workspace.edges).toContainEqual(expect.objectContaining({
      source: 'fitness-3-week',
      target: skillId,
    }))
  })

  it('persists node positions changed on the Tree canvas', () => {
    const { result } = renderHook(() => useSkillMap())

    act(() => {
      result.current.changeNodes([
        { id: 'fitness-start', type: 'position', position: { x: 420, y: 260 }, dragging: false },
      ])
    })

    expect(result.current.workspace.nodes.find((node) => node.id === 'fitness-start')?.position)
      .toEqual({ x: 420, y: 260 })
  })

  it('removes a dependency when its canvas edge is deleted', () => {
    const { result } = renderHook(() => useSkillMap())

    act(() => {
      result.current.changeEdges([{ id: 'fitness-start->fitness-3-week', type: 'remove' }])
    })

    expect(result.current.workspace.edges.some((edge) => edge.id === 'fitness-start->fitness-3-week')).toBe(false)
    expect(result.current.workspace.nodes.find((node) => node.id === 'fitness-3-week')?.data.prerequisiteIds)
      .toEqual([])
  })

  it('resets all in-memory changes to an empty goal workspace', () => {
    const { result } = renderHook(() => useSkillMap())
    act(() => { result.current.addCategory('음악', 'Music Coin') })

    act(() => { result.current.resetWorkspace() })

    expect(result.current.workspace.categories).toEqual([])
    expect(result.current.workspace.quests).toEqual([])
    expect(result.current.workspace.nodes).toEqual([])
    expect(result.current.workspace.edges).toEqual([])
    expect(result.current.workspace.selectedCategoryId).toBeNull()
  })
})
