import { describe, expect, it } from 'vitest'
import type { WorkspaceData } from '../types/skillTree'
import { canCompleteQuest, completeDailyQuest, getLocalDate } from './questLogic'

const workspace = (completedDate: string | null = null): WorkspaceData => ({
  version: 2,
  selectedCategoryId: 'fitness',
  categories: [{ id: 'fitness', name: 'Fitness', coinName: 'Fitness Coin', coins: 10 }],
  quests: [{
    id: 'workout',
    categoryId: 'fitness',
    title: 'Workout today',
    rewardCoins: 2,
    completedDate,
  }],
  nodes: [{
    id: 'skill',
    type: 'skill',
    position: { x: 0, y: 0 },
    data: {
      id: 'skill',
      name: 'Workout habit',
      description: '',
      categoryId: 'fitness',
      requiredCoins: 12,
      prerequisiteIds: [],
      status: 'locked',
    },
  }],
  edges: [],
})

describe('completeDailyQuest', () => {
  it('adds the reward to its category and recalculates skill availability', () => {
    const result = completeDailyQuest(workspace(), 'workout', '2026-08-24')

    expect(result.categories[0].coins).toBe(12)
    expect(result.quests[0].completedDate).toBe('2026-08-24')
    expect(result.nodes[0].data.status).toBe('available')
  })

  it('does not grant a second reward on the same local date', () => {
    const original = workspace('2026-08-24')
    const result = completeDailyQuest(original, 'workout', '2026-08-24')

    expect(result).toBe(original)
    expect(result.categories[0].coins).toBe(10)
  })

  it('allows a quest completed yesterday to reward again today', () => {
    const original = workspace('2026-08-23')

    expect(canCompleteQuest(original.quests[0], '2026-08-24')).toBe(true)
    expect(completeDailyQuest(original, 'workout', '2026-08-24').categories[0].coins).toBe(12)
  })

  it('clamps a reward addition before the category balance loses integer precision', () => {
    const original = workspace()
    original.categories[0].coins = Number.MAX_SAFE_INTEGER - 1
    original.quests[0].rewardCoins = 10

    expect(completeDailyQuest(original, 'workout', '2026-08-24').categories[0].coins)
      .toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('getLocalDate', () => {
  it('formats a date from local calendar fields', () => {
    expect(getLocalDate(new Date(2026, 7, 4, 23, 30))).toBe('2026-08-04')
  })
})
