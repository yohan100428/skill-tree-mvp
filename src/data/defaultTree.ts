import type {
  DailyQuest,
  SkillEdge,
  SkillNode,
  TreeCategory,
  WorkspaceData,
} from '../types/skillTree'
import { recalculateMap } from '../utils/skillLogic'

const categories: TreeCategory[] = [
  { id: 'fitness', name: '운동', coinName: 'Fitness Coin', coins: 0 },
  { id: 'study', name: '공부', coinName: 'Study Coin', coins: 0 },
]

const quests: DailyQuest[] = [
  { id: 'fitness-daily', categoryId: 'fitness', title: '오늘 운동하기', rewardCoins: 1, completedDate: null },
  { id: 'fitness-30-minutes', categoryId: 'fitness', title: '30분 이상 운동', rewardCoins: 2, completedDate: null },
  { id: 'study-30-minutes', categoryId: 'study', title: '30분 공부', rewardCoins: 1, completedDate: null },
  { id: 'study-review', categoryId: 'study', title: '오늘 복습하기', rewardCoins: 1, completedDate: null },
]

const demoNode = (
  id: string,
  name: string,
  categoryId: string,
  requiredCoins: number,
  x: number,
  y: number,
  prerequisiteIds: string[] = [],
): SkillNode => ({
  id,
  type: 'skill',
  position: { x, y },
  data: {
    id,
    name,
    description: '',
    categoryId,
    requiredCoins,
    status: 'locked',
    prerequisiteIds,
  },
})

const demoEdge = (source: string, target: string): SkillEdge => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smoothstep',
  animated: true,
})

export const createLegacyDemoWorkspace = (): WorkspaceData => {
  const nodes = [
    demoNode('fitness-start', '운동 시작', 'fitness', 0, 150, 30),
    demoNode('fitness-3-week', '주 3회 운동', 'fitness', 5, 150, 190, ['fitness-start']),
    demoNode('fitness-30-days', '운동 30일', 'fitness', 30, 150, 350, ['fitness-3-week']),
    demoNode('fitness-100-days', '운동 100일', 'fitness', 100, 150, 510, ['fitness-30-days']),
    demoNode('study-start', '공부 시작', 'study', 0, 550, 80),
    demoNode('study-7-days', '7일 공부', 'study', 7, 550, 250, ['study-start']),
    demoNode('study-30-days', '30일 공부', 'study', 30, 550, 420, ['study-7-days']),
  ]
  const edges = [
    demoEdge('fitness-start', 'fitness-3-week'),
    demoEdge('fitness-3-week', 'fitness-30-days'),
    demoEdge('fitness-30-days', 'fitness-100-days'),
    demoEdge('study-start', 'study-7-days'),
    demoEdge('study-7-days', 'study-30-days'),
  ]
  const map = recalculateMap({ nodes, edges }, categories)

  return {
    version: 2,
    selectedCategoryId: 'fitness',
    categories: categories.map((category) => ({ ...category })),
    quests: quests.map((quest) => ({ ...quest })),
    ...map,
  }
}

export const createDefaultWorkspace = (): WorkspaceData => ({
  version: 2,
  selectedCategoryId: null,
  categories: [],
  quests: [],
  nodes: [],
  edges: [],
})
