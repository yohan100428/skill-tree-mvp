import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange } from '@xyflow/react'
import type { DailyQuest, SkillData, SkillNode, TreeCategory, WorkspaceData } from '../types/skillTree'
import { addDependency, deleteSkill, normalizeMap, removeDependency } from '../utils/skillLogic'
import { completeDailyQuest } from '../utils/questLogic'
import { loadWorkspace, saveWorkspace } from '../utils/storage'
import { createDefaultWorkspace } from '../data/defaultTree'
import { getSuggestedSkillPosition } from '../utils/personalTree'

const makeId = (prefix: string): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`

type CategoryPatch = Partial<Pick<TreeCategory, 'name' | 'finalGoal'>>
type QuestPatch = Partial<Pick<DailyQuest, 'title' | 'categoryId'>>
type SkillPatch = Partial<Pick<SkillData, 'name' | 'description' | 'categoryId'>>

export interface NewQuestInput { title: string; categoryId: string }
export interface NewSkillInput {
  name: string
  description?: string
  categoryId: string
  prerequisiteId?: string
}

export interface SkillMapActions {
  workspace: WorkspaceData
  updateUserName: (userName: string) => void
  selectedCategory?: TreeCategory
  selectCategory: (categoryId: string) => void
  addCategory: (name: string, finalGoal: string) => string | undefined
  updateCategory: (categoryId: string, patch: CategoryPatch) => void
  deleteCategory: (categoryId: string) => void
  addQuest: (input: NewQuestInput) => string | undefined
  updateQuest: (questId: string, patch: QuestPatch) => void
  removeQuest: (questId: string) => void
  completeQuest: (questId: string, today?: string) => void
  addSkill: (input: NewSkillInput) => string | undefined
  updateSkill: (skillId: string, patch: SkillPatch) => void
  removeSkill: (skillId: string) => void
  connectSkills: (connection: Connection) => string | undefined
  changeNodes: (changes: NodeChange<SkillNode>[]) => void
  changeEdges: (changes: EdgeChange[]) => void
  resetWorkspace: () => void
}

export const useSkillMap = (): SkillMapActions => {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspace(localStorage))

  useEffect(() => saveWorkspace(localStorage, workspace), [workspace])

  const selectedCategory = useMemo(
    () => workspace.categories.find((category) => category.id === workspace.selectedCategoryId),
    [workspace.categories, workspace.selectedCategoryId],
  )

  const updateUserName = useCallback((userName: string) => {
    setWorkspace((current) => ({ ...current, userName: userName.trim() || 'ME' }))
  }, [])

  const selectCategory = useCallback((categoryId: string) => {
    setWorkspace((current) => current.categories.some((category) => category.id === categoryId)
      ? { ...current, selectedCategoryId: categoryId }
      : current)
  }, [])

  const addCategory = useCallback((name: string, finalGoal: string) => {
    const safeName = name.trim()
    const safeGoal = finalGoal.trim()
    if (!safeName || !safeGoal) return undefined
    const id = makeId('category')
    setWorkspace((current) => ({
      ...current,
      selectedCategoryId: id,
      categories: [...current.categories, { id, name: safeName, finalGoal: safeGoal }],
    }))
    return id
  }, [])

  const updateCategory = useCallback((categoryId: string, patch: CategoryPatch) => {
    setWorkspace((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) return category
        const name = patch.name === undefined ? category.name : patch.name.trim()
        const finalGoal = patch.finalGoal === undefined ? category.finalGoal : patch.finalGoal.trim()
        return !name || !finalGoal ? category : { ...category, name, finalGoal }
      }),
    }))
  }, [])

  const deleteCategory = useCallback((categoryId: string) => {
    setWorkspace((current) => {
      if (!current.categories.some((category) => category.id === categoryId)) return current
      const categories = current.categories.filter((category) => category.id !== categoryId)
      const removedIds = new Set(current.nodes
        .filter((node) => node.data.categoryId === categoryId)
        .map((node) => node.id))
      const map = normalizeMap({
        nodes: current.nodes
          .filter((node) => !removedIds.has(node.id))
          .map((node) => ({
            ...node,
            data: {
              ...node.data,
              prerequisiteIds: node.data.prerequisiteIds.filter((id) => !removedIds.has(id)),
            },
          })),
        edges: current.edges.filter((edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)),
      })
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

  const addQuest = useCallback((input: NewQuestInput) => {
    const title = input.title.trim()
    if (!title || !workspace.categories.some((category) => category.id === input.categoryId)) return undefined
    const id = makeId('quest')
    setWorkspace((current) => ({
      ...current,
      quests: [...current.quests, { id, categoryId: input.categoryId, title, completedDate: null }],
    }))
    return id
  }, [workspace.categories])

  const updateQuest = useCallback((questId: string, patch: QuestPatch) => {
    setWorkspace((current) => {
      if (patch.categoryId && !current.categories.some((category) => category.id === patch.categoryId)) return current
      return {
        ...current,
        quests: current.quests.map((quest) => quest.id === questId
          ? { ...quest, ...patch, title: patch.title?.trim() || quest.title }
          : quest),
      }
    })
  }, [])

  const removeQuest = useCallback((questId: string) => {
    setWorkspace((current) => ({ ...current, quests: current.quests.filter((quest) => quest.id !== questId) }))
  }, [])

  const completeQuest = useCallback((questId: string, today?: string) => {
    setWorkspace((current) => completeDailyQuest(current, questId, today))
  }, [])

  const addSkill = useCallback((input: NewSkillInput) => {
    const name = input.name.trim()
    if (!name || !workspace.categories.some((category) => category.id === input.categoryId)) return undefined
    if (input.prerequisiteId) {
      const prerequisite = workspace.nodes.find((node) => node.id === input.prerequisiteId)
      if (!prerequisite || prerequisite.data.categoryId !== input.categoryId) return undefined
    }
    const id = makeId('skill')
    setWorkspace((current) => {
      const node: SkillNode = {
        id,
        type: 'skill',
        position: getSuggestedSkillPosition(current, input.categoryId, input.prerequisiteId),
        data: {
          id,
          name,
          description: input.description?.trim() ?? '',
          categoryId: input.categoryId,
          prerequisiteIds: [],
        },
      }
      const map = normalizeMap({ nodes: [...current.nodes, node], edges: current.edges })
      if (!input.prerequisiteId) return { ...current, ...map }
      return { ...current, ...addDependency(map, input.prerequisiteId, id).map }
    })
    return id
  }, [workspace.categories, workspace.nodes])

  const updateSkill = useCallback((skillId: string, patch: SkillPatch) => {
    setWorkspace((current) => {
      if (patch.categoryId && !current.categories.some((category) => category.id === patch.categoryId)) return current
      const currentNode = current.nodes.find((node) => node.id === skillId)
      if (!currentNode) return current
      const categoryChanged = patch.categoryId !== undefined && patch.categoryId !== currentNode.data.categoryId
      const nodes = current.nodes.map((node) => node.id === skillId
        ? {
            ...node,
            data: {
              ...node.data,
              ...patch,
              name: patch.name?.trim() || node.data.name,
              description: patch.description?.trim() ?? node.data.description,
              prerequisiteIds: categoryChanged ? [] : node.data.prerequisiteIds,
            },
          }
        : categoryChanged
          ? { ...node, data: { ...node.data, prerequisiteIds: node.data.prerequisiteIds.filter((id) => id !== skillId) } }
          : node)
      const edges = categoryChanged
        ? current.edges.filter((edge) => edge.source !== skillId && edge.target !== skillId)
        : current.edges
      return { ...current, ...normalizeMap({ nodes, edges }) }
    })
  }, [])

  const removeSkill = useCallback((skillId: string) => {
    setWorkspace((current) => ({ ...current, ...deleteSkill(current, skillId) }))
  }, [])

  const connectSkills = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return 'Choose two skills to connect.'
    const result = addDependency(workspace, connection.source, connection.target)
    if (result.changed) setWorkspace((current) => ({ ...current, ...result.map }))
    return result.reason
  }, [workspace])

  const changeNodes = useCallback((changes: NodeChange<SkillNode>[]) => {
    setWorkspace((current) => {
      const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
      const withoutRemoved = removedIds.reduce(
        (map, id) => deleteSkill(map, id),
        { nodes: current.nodes, edges: current.edges },
      )
      const safeChanges = changes.filter((change) => change.type !== 'remove')
      return { ...current, ...withoutRemoved, nodes: applyNodeChanges(safeChanges, withoutRemoved.nodes) }
    })
  }, [])

  const changeEdges = useCallback((changes: EdgeChange[]) => {
    setWorkspace((current) => {
      const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
      const withoutRemoved = removedIds.reduce(
        (map, id) => removeDependency(map, id),
        { nodes: current.nodes, edges: current.edges },
      )
      const safeChanges = changes.filter((change) => change.type !== 'remove')
      return { ...current, ...withoutRemoved, edges: applyEdgeChanges(safeChanges, withoutRemoved.edges) }
    })
  }, [])

  const resetWorkspace = useCallback(() => setWorkspace(createDefaultWorkspace()), [])

  return {
    workspace,
    updateUserName,
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
    removeSkill,
    connectSkills,
    changeNodes,
    changeEdges,
    resetWorkspace,
  }
}
