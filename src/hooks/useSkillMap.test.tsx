import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { WorkspaceData } from '../types/skillTree'
import { getCategoryPosition } from '../utils/personalTree'
import { saveWorkspace } from '../utils/storage'
import { useSkillMap } from './useSkillMap'

const existingWorkspace = (): WorkspaceData => ({
  version: 3,
  userName: '민준',
  selectedCategoryId: 'fitness',
  categories: [
    { id: 'fitness', name: '운동', finalGoal: '마라톤 완주' },
    { id: 'study', name: '공부', finalGoal: '논문 완성' },
  ],
  quests: [{ id: 'fitness-daily', categoryId: 'fitness', title: '오늘 달리기', completedDate: null }],
  nodes: [
    { id: 'warmup', type: 'skill', position: { x: 100, y: 100 }, data: { id: 'warmup', name: '준비운동', description: '', categoryId: 'fitness', prerequisiteIds: [] } },
    { id: 'run', type: 'skill', position: { x: 300, y: 100 }, data: { id: 'run', name: '달리기', description: '', categoryId: 'fitness', prerequisiteIds: ['warmup'] } },
  ],
  edges: [{ id: 'warmup->run', source: 'warmup', target: 'run', type: 'smoothstep' }],
})

describe('useSkillMap', () => {
  beforeEach(() => {
    localStorage.clear()
    saveWorkspace(localStorage, existingWorkspace())
  })

  it('requires and stores a final goal when creating a category', () => {
    const { result } = renderHook(() => useSkillMap())
    let blankResult: string | undefined
    let categoryId: string | undefined

    act(() => { blankResult = result.current.addCategory('독서', '   ') })
    act(() => { categoryId = result.current.addCategory(' 독서 ', ' 100권 읽기 ') })

    expect(blankResult).toBeUndefined()
    expect(result.current.workspace.categories.at(-1)).toEqual({
      id: categoryId,
      name: '독서',
      finalGoal: '100권 읽기',
    })
    expect(result.current.workspace.selectedCategoryId).toBe(categoryId)
  })

  it('deleting a category cascades through its quests, skills, and edges', () => {
    const { result } = renderHook(() => useSkillMap())
    act(() => {
      result.current.addSkill({ name: '교차 연결 대상', categoryId: 'study' })
    })
    const studySkillId = result.current.workspace.nodes.find((node) => node.data.name === '교차 연결 대상')!.id
    const withLegacyCrossCategoryEdge: WorkspaceData = {
      ...result.current.workspace,
      nodes: result.current.workspace.nodes.map((node) => node.id === studySkillId
        ? { ...node, data: { ...node.data, prerequisiteIds: ['warmup'] } }
        : node),
      edges: [...result.current.workspace.edges, { id: 'warmup->study', source: 'warmup', target: studySkillId }],
    }
    saveWorkspace(localStorage, withLegacyCrossCategoryEdge)
    const rerendered = renderHook(() => useSkillMap())
    act(() => { rerendered.result.current.deleteCategory('fitness') })

    expect(rerendered.result.current.workspace.categories.map(({ id }) => id)).toEqual(['study'])
    expect(rerendered.result.current.workspace.quests).toEqual([])
    expect(rerendered.result.current.workspace.nodes).toEqual([
      expect.objectContaining({
        id: studySkillId,
        data: expect.objectContaining({ prerequisiteIds: [] }),
      }),
    ])
    expect(rerendered.result.current.workspace.edges).toEqual([])
  })

  it('completes a quest without changing categories or skills', () => {
    const { result } = renderHook(() => useSkillMap())
    const categoriesBefore = result.current.workspace.categories
    const nodesBefore = result.current.workspace.nodes

    act(() => { result.current.completeQuest('fitness-daily', '2026-08-28') })

    expect(result.current.workspace.quests[0].completedDate).toBe('2026-08-28')
    expect(result.current.workspace.categories).toEqual(categoriesBefore)
    expect(result.current.workspace.nodes).toEqual(nodesBefore)
  })

  it('creates a reward-free quest for the selected category', () => {
    const { result } = renderHook(() => useSkillMap())
    let questId: string | undefined

    act(() => { questId = result.current.addQuest({ title: '수학 공부', categoryId: 'study' }) })

    expect(result.current.workspace.quests.find((quest) => quest.id === questId)).toEqual({
      id: questId,
      title: '수학 공부',
      categoryId: 'study',
      completedDate: null,
    })
  })

  it('creates a skill and preserves its selected prerequisite edge', () => {
    const { result } = renderHook(() => useSkillMap())
    let skillId: string | undefined

    act(() => {
      skillId = result.current.addSkill({
        name: '10km 달리기',
        description: '매주 거리를 늘립니다.',
        categoryId: 'fitness',
        prerequisiteId: 'run',
      })
    })

    expect(result.current.workspace.nodes.find((node) => node.id === skillId)?.data).toEqual({
      id: skillId,
      name: '10km 달리기',
      description: '매주 거리를 늘립니다.',
      categoryId: 'fitness',
      prerequisiteIds: ['run'],
    })
    expect(result.current.workspace.edges).toContainEqual(expect.objectContaining({ source: 'run', target: skillId }))
  })

  it('places new skills outward along their category branch', () => {
    localStorage.clear()
    const { result } = renderHook(() => useSkillMap())
    let categoryId = ''
    let rootId = ''

    act(() => { categoryId = result.current.addCategory('운동', '마라톤 완주')! })
    act(() => { rootId = result.current.addSkill({ name: '운동 시작', categoryId })! })
    act(() => { result.current.addSkill({ name: '운동 30일', categoryId, prerequisiteId: rootId }) })
    const root = result.current.workspace.nodes.find((node) => node.id === rootId)!
    const dependent = result.current.workspace.nodes.find((node) => node.data.name === '운동 30일')!
    const categoryPosition = getCategoryPosition(result.current.workspace.categories, categoryId)

    expect(Math.round(Math.hypot(root.position.x - categoryPosition.x, root.position.y - categoryPosition.y))).toBe(220)
    expect(Math.round(Math.hypot(dependent.position.x - root.position.x, dependent.position.y - root.position.y))).toBe(220)
  })

  it('persists node moves and removes deleted dependencies', () => {
    const { result } = renderHook(() => useSkillMap())

    act(() => {
      result.current.changeNodes([{ id: 'warmup', type: 'position', position: { x: 420, y: 260 }, dragging: false }])
      result.current.changeEdges([{ id: 'warmup->run', type: 'remove' }])
    })

    expect(result.current.workspace.nodes.find((node) => node.id === 'warmup')?.position).toEqual({ x: 420, y: 260 })
    expect(result.current.workspace.edges).toEqual([])
    expect(result.current.workspace.nodes.find((node) => node.id === 'run')?.data.prerequisiteIds).toEqual([])
  })

  it('edits the category goal and resets to an empty workspace', () => {
    const { result } = renderHook(() => useSkillMap())
    act(() => { result.current.updateCategory('fitness', { finalGoal: '울트라 마라톤 완주' }) })
    expect(result.current.workspace.categories[0].finalGoal).toBe('울트라 마라톤 완주')

    act(() => { result.current.resetWorkspace() })
    expect(result.current.workspace).toEqual(expect.objectContaining({
      version: 3,
      categories: [], quests: [], nodes: [], edges: [], selectedCategoryId: null,
    }))
  })
})
