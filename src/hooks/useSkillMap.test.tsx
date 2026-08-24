import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSkillMap } from './useSkillMap'

describe('useSkillMap', () => {
  beforeEach(() => localStorage.clear())

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
    act(() => { result.current.addQuest('Practice', 2) })
    act(() => { skillId = result.current.addSkill({ x: 10, y: 20 })! })
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

    act(() => { skillId = result.current.addSkill({ x: 10, y: 20 })! })
    act(() => { result.current.updateSkill(skillId, { requiredCoins: 1 }) })
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
})
