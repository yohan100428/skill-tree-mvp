import type { WorkspaceData } from '../types/skillTree'

export const createDefaultWorkspace = (): WorkspaceData => ({
  version: 3,
  userName: 'ME',
  selectedCategoryId: null,
  categories: [],
  quests: [],
  nodes: [],
  edges: [],
})

export interface LegacyWorkspaceData {
  version: 2
  userName: string
  selectedCategoryId: string | null
  categories: Array<{ id: string; name: string; coinName: string; coins: number }>
  quests: Array<{ id: string; categoryId: string; title: string; rewardCoins: number; completedDate: string | null }>
  nodes: Array<{
    id: string
    type: 'skill'
    position: { x: number; y: number }
    data: {
      id: string
      name: string
      description: string
      categoryId: string
      requiredCoins: number
      status: 'locked' | 'available' | 'unlocked'
      prerequisiteIds: string[]
    }
  }>
  edges: Array<{ id: string; source: string; target: string; type?: string; animated?: boolean }>
}

export const createLegacyDemoWorkspace = (): LegacyWorkspaceData => ({
  version: 2,
  userName: 'ME',
  selectedCategoryId: 'fitness',
  categories: [
    { id: 'fitness', name: '운동', coinName: 'Fitness Coin', coins: 0 },
    { id: 'study', name: '공부', coinName: 'Study Coin', coins: 0 },
  ],
  quests: [
    { id: 'fitness-daily', categoryId: 'fitness', title: '오늘 운동하기', rewardCoins: 1, completedDate: null },
    { id: 'fitness-30-minutes', categoryId: 'fitness', title: '30분 이상 운동', rewardCoins: 2, completedDate: null },
    { id: 'study-30-minutes', categoryId: 'study', title: '30분 공부', rewardCoins: 1, completedDate: null },
    { id: 'study-review', categoryId: 'study', title: '오늘 복습하기', rewardCoins: 1, completedDate: null },
  ],
  nodes: [
    legacyNode('fitness-start', '운동 시작', 'fitness', 0, 150, 30),
    legacyNode('fitness-3-week', '주 3회 운동', 'fitness', 5, 150, 190, ['fitness-start']),
    legacyNode('fitness-30-days', '운동 30일', 'fitness', 30, 150, 350, ['fitness-3-week']),
    legacyNode('fitness-100-days', '운동 100일', 'fitness', 100, 150, 510, ['fitness-30-days']),
    legacyNode('study-start', '공부 시작', 'study', 0, 550, 80),
    legacyNode('study-7-days', '7일 공부', 'study', 7, 550, 250, ['study-start']),
    legacyNode('study-30-days', '30일 공부', 'study', 30, 550, 420, ['study-7-days']),
  ],
  edges: [
    legacyEdge('fitness-start', 'fitness-3-week'),
    legacyEdge('fitness-3-week', 'fitness-30-days'),
    legacyEdge('fitness-30-days', 'fitness-100-days'),
    legacyEdge('study-start', 'study-7-days'),
    legacyEdge('study-7-days', 'study-30-days'),
  ],
})

const legacyNode = (
  id: string,
  name: string,
  categoryId: string,
  requiredCoins: number,
  x: number,
  y: number,
  prerequisiteIds: string[] = [],
): LegacyWorkspaceData['nodes'][number] => ({
  id,
  type: 'skill',
  position: { x, y },
  data: {
    id,
    name,
    description: '',
    categoryId,
    requiredCoins,
    status: prerequisiteIds.length === 0 ? 'available' : 'locked',
    prerequisiteIds,
  },
})

const legacyEdge = (source: string, target: string): LegacyWorkspaceData['edges'][number] => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smoothstep',
  animated: true,
})
