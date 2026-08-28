import { describe, expect, it } from 'vitest'
import type { WorkspaceData } from '../types/skillTree'
import { canCompleteQuest, completeDailyQuest, getLocalDate } from './questLogic'

const workspace = (completedDate: string | null = null): WorkspaceData => ({
  version: 3,
  userName: '민준',
  selectedCategoryId: 'fitness',
  categories: [{ id: 'fitness', name: '운동', finalGoal: '마라톤 완주' }],
  quests: [{ id: 'workout', categoryId: 'fitness', title: '오늘 달리기', completedDate }],
  nodes: [{
    id: 'run',
    type: 'skill',
    position: { x: 0, y: 0 },
    data: { id: 'run', name: '달리기', description: '', categoryId: 'fitness', prerequisiteIds: [] },
  }],
  edges: [],
})

describe('completeDailyQuest', () => {
  it('updates only the matching quest completion date', () => {
    const original = workspace()
    const result = completeDailyQuest(original, 'workout', '2026-08-28')

    expect(result.quests[0].completedDate).toBe('2026-08-28')
    expect(result.categories).toEqual(original.categories)
    expect(result.nodes).toEqual(original.nodes)
    expect(result.edges).toEqual(original.edges)
  })

  it('does not complete the same quest twice on one local date', () => {
    const original = workspace('2026-08-28')
    expect(completeDailyQuest(original, 'workout', '2026-08-28')).toBe(original)
  })

  it('allows yesterday’s quest to be checked again today', () => {
    const original = workspace('2026-08-27')
    expect(canCompleteQuest(original.quests[0], '2026-08-28')).toBe(true)
    expect(completeDailyQuest(original, 'workout', '2026-08-28').quests[0].completedDate).toBe('2026-08-28')
  })
})

describe('getLocalDate', () => {
  it('formats a date from local calendar fields', () => {
    expect(getLocalDate(new Date(2026, 7, 4, 23, 30))).toBe('2026-08-04')
  })
})
