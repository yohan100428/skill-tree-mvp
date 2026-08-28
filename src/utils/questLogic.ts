import type { DailyQuest, WorkspaceData } from '../types/skillTree'

export const getLocalDate = (date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const canCompleteQuest = (quest: DailyQuest, today = getLocalDate()): boolean =>
  quest.completedDate !== today

export const completeDailyQuest = (
  workspace: WorkspaceData,
  questId: string,
  today = getLocalDate(),
): WorkspaceData => {
  const quest = workspace.quests.find((candidate) => candidate.id === questId)
  if (!quest || !canCompleteQuest(quest, today)) return workspace
  if (!workspace.categories.some((category) => category.id === quest.categoryId)) return workspace

  return {
    ...workspace,
    quests: workspace.quests.map((candidate) => candidate.id === questId
      ? { ...candidate, completedDate: today }
      : candidate),
  }
}
