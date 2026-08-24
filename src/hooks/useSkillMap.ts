import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, XYPosition } from '@xyflow/react'
import type {
  DailyQuest,
  SkillData,
  SkillNode,
  TreeCategory,
  WorkspaceData,
} from '../types/skillTree'
import {
  addDependency,
  deleteSkill,
  recalculateMap,
  removeDependency,
  toNonNegativeInteger,
  unlockSkill as unlockSkillInMap,
} from '../utils/skillLogic'
import { completeDailyQuest } from '../utils/questLogic'
import { loadWorkspace, saveWorkspace } from '../utils/storage'

const makeId = (prefix: string): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`

type CategoryPatch = Partial<Pick<TreeCategory, 'name' | 'coinName'>>
type QuestPatch = Partial<Pick<DailyQuest, 'title' | 'rewardCoins'>>
type SkillPatch = Partial<Pick<SkillData, 'name' | 'description' | 'categoryId' | 'requiredCoins'>>

export interface SkillMapActions {
  workspace: WorkspaceData
  selectedCategory?: TreeCategory
  selectCategory: (categoryId: string) => void
  addCategory: (name?: string, coinName?: string) => string
  updateCategory: (categoryId: string, patch: CategoryPatch) => void
  deleteCategory: (categoryId: string) => void
  addQuest: (title?: string, rewardCoins?: number) => string | undefined
  updateQuest: (questId: string, patch: QuestPatch) => void
  removeQuest: (questId: string) => void
  completeQuest: (questId: string, today?: string) => void
  addSkill: (position?: XYPosition) => string | undefined
  updateSkill: (skillId: string, patch: SkillPatch) => void
  unlockSkill: (skillId: string) => void
  removeSkill: (skillId: string) => void
  connectSkills: (connection: Connection) => string | undefined
  changeNodes: (changes: NodeChange<SkillNode>[]) => void
  changeEdges: (changes: EdgeChange[]) => void
}

export const useSkillMap = (): SkillMapActions => {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspace(localStorage))

  useEffect(() => saveWorkspace(localStorage, workspace), [workspace])

  const selectedCategory = useMemo(
    () => workspace.categories.find((category) => category.id === workspace.selectedCategoryId),
    [workspace.categories, workspace.selectedCategoryId],
  )

  const selectCategory = useCallback((categoryId: string) => {
    setWorkspace((current) => current.categories.some((category) => category.id === categoryId)
      ? { ...current, selectedCategoryId: categoryId }
      : current)
  }, [])

  const addCategory = useCallback((name = 'New Category', coinName = '') => {
    const id = makeId('category')
    const safeName = name.trim() || 'New Category'
    const category: TreeCategory = {
      id,
      name: safeName,
      coinName: coinName.trim() || `${safeName} Coin`,
      coins: 0,
    }
    setWorkspace((current) => ({
      ...current,
      selectedCategoryId: id,
      categories: [...current.categories, category],
    }))
    return id
  }, [])

  const updateCategory = useCallback((categoryId: string, patch: CategoryPatch) => {
    setWorkspace((current) => {
      const categories = current.categories.map((category) => {
        if (category.id !== categoryId) return category
        const name = patch.name ?? category.name
        const coinName = patch.coinName === undefined
          ? category.coinName
          : patch.coinName.trim() || `${name.trim() || 'Category'} Coin`
        return { ...category, ...patch, name, coinName }
      })
      return { ...current, ...recalculateMap(current, categories), categories }
    })
  }, [])

  const deleteCategory = useCallback((categoryId: string) => {
    setWorkspace((current) => {
      if (!current.categories.some((category) => category.id === categoryId)) return current
      const categories = current.categories.filter((category) => category.id !== categoryId)
      const removedSkillIds = new Set(
        current.nodes.filter((node) => node.data.categoryId === categoryId).map((node) => node.id),
      )
      const map = recalculateMap({
        nodes: current.nodes.filter((node) => !removedSkillIds.has(node.id)),
        edges: current.edges.filter(
          (edge) => !removedSkillIds.has(edge.source) && !removedSkillIds.has(edge.target),
        ),
      }, categories)
      return {
        ...current,
        ...map,
        categories,
        quests: current.quests.filter((quest) => quest.categoryId !== categoryId),
        selectedCategoryId: current.selectedCategoryId === categoryId
          ? categories[0]?.id ?? null
          : current.selectedCategoryId,
      }
    })
  }, [])

  const addQuest = useCallback((title = 'New Quest', rewardCoins = 1) => {
    const id = makeId('quest')
    setWorkspace((current) => {
      if (!current.selectedCategoryId) return current
      const quest: DailyQuest = {
        id,
        categoryId: current.selectedCategoryId,
        title,
        rewardCoins: toNonNegativeInteger(rewardCoins),
        completedDate: null,
      }
      return { ...current, quests: [...current.quests, quest] }
    })
    return workspace.selectedCategoryId ? id : undefined
  }, [workspace.selectedCategoryId])

  const updateQuest = useCallback((questId: string, patch: QuestPatch) => {
    setWorkspace((current) => ({
      ...current,
      quests: current.quests.map((quest) => quest.id === questId
        ? {
            ...quest,
            ...patch,
            rewardCoins: patch.rewardCoins === undefined
              ? quest.rewardCoins
              : toNonNegativeInteger(patch.rewardCoins),
          }
        : quest),
    }))
  }, [])

  const removeQuest = useCallback((questId: string) => {
    setWorkspace((current) => ({
      ...current,
      quests: current.quests.filter((quest) => quest.id !== questId),
    }))
  }, [])

  const completeQuest = useCallback((questId: string, today?: string) => {
    setWorkspace((current) => completeDailyQuest(current, questId, today))
  }, [])

  const addSkill = useCallback((position: XYPosition = { x: 160, y: 100 }) => {
    const id = makeId('skill')
    setWorkspace((current) => {
      if (!current.selectedCategoryId) return current
      const node: SkillNode = {
        id,
        type: 'skill',
        position,
        data: {
          id,
          name: 'New Skill',
          description: '',
          categoryId: current.selectedCategoryId,
          requiredCoins: 0,
          status: 'available',
          prerequisiteIds: [],
        },
      }
      return { ...current, nodes: [...current.nodes, node] }
    })
    return workspace.selectedCategoryId ? id : undefined
  }, [workspace.selectedCategoryId])

  const updateSkill = useCallback((skillId: string, patch: SkillPatch) => {
    setWorkspace((current) => {
      if (
        patch.categoryId !== undefined &&
        !current.categories.some((category) => category.id === patch.categoryId)
      ) {
        return current
      }
      const nodes = current.nodes.map((node) => node.id === skillId
        ? {
            ...node,
            data: {
              ...node.data,
              ...patch,
              requiredCoins: patch.requiredCoins === undefined
                ? node.data.requiredCoins
                : toNonNegativeInteger(patch.requiredCoins),
            },
          }
        : node)
      return { ...current, ...recalculateMap({ nodes, edges: current.edges }, current.categories) }
    })
  }, [])

  const unlockSkill = useCallback((skillId: string) => {
    setWorkspace((current) => ({
      ...current,
      ...unlockSkillInMap(current, current.categories, skillId).map,
    }))
  }, [])

  const removeSkill = useCallback((skillId: string) => {
    setWorkspace((current) => ({
      ...current,
      ...deleteSkill(current, current.categories, skillId),
    }))
  }, [])

  const connectSkills = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return 'Choose two skills to connect.'
    const result = addDependency(workspace, workspace.categories, connection.source, connection.target)
    if (result.changed) setWorkspace((current) => ({ ...current, ...result.map }))
    return result.reason
  }, [workspace])

  const changeNodes = useCallback((changes: NodeChange<SkillNode>[]) => {
    setWorkspace((current) => {
      const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
      const withoutRemoved = removedIds.reduce(
        (map, id) => deleteSkill(map, current.categories, id),
        { nodes: current.nodes, edges: current.edges },
      )
      const safeChanges = changes.filter((change) => change.type !== 'remove')
      return {
        ...current,
        ...withoutRemoved,
        nodes: applyNodeChanges(safeChanges, withoutRemoved.nodes),
      }
    })
  }, [])

  const changeEdges = useCallback((changes: EdgeChange[]) => {
    setWorkspace((current) => {
      const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
      const withoutRemoved = removedIds.reduce(
        (map, id) => removeDependency(map, current.categories, id),
        { nodes: current.nodes, edges: current.edges },
      )
      const safeChanges = changes.filter((change) => change.type !== 'remove')
      return {
        ...current,
        ...withoutRemoved,
        edges: applyEdgeChanges(safeChanges, withoutRemoved.edges),
      }
    })
  }, [])

  return {
    workspace,
    selectedCategory,
    selectCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    addQuest,
    updateQuest,
    removeQuest,
    completeQuest,
    addSkill,
    updateSkill,
    unlockSkill,
    removeSkill,
    connectSkills,
    changeNodes,
    changeEdges,
  }
}
