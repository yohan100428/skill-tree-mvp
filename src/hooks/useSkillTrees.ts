import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, XYPosition } from '@xyflow/react'
import type { SkillData, SkillNode, SkillTree, WorkspaceData } from '../types/skillTree'
import { addDependency, deleteSkill, recalculateTree, removeDependency } from '../utils/skillLogic'
import { loadWorkspace, saveWorkspace } from '../utils/storage'

const makeId = (prefix: string): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`

export interface SkillTreeActions {
  workspace: WorkspaceData
  activeTree: SkillTree
  selectTree: (treeId: string) => void
  addTree: () => string
  renameTree: (treeId: string, name: string) => void
  deleteTree: (treeId: string) => void
  addSkill: (position?: XYPosition) => string
  updateSkill: (skillId: string, patch: Partial<Pick<SkillData, 'name' | 'description' | 'level' | 'maxLevel'>>) => void
  completeSkill: (skillId: string) => void
  removeSkill: (skillId: string) => void
  connectSkills: (connection: Connection) => string | undefined
  changeNodes: (changes: NodeChange<SkillNode>[]) => void
  changeEdges: (changes: EdgeChange[]) => void
}

export const useSkillTrees = (): SkillTreeActions => {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspace(localStorage))

  useEffect(() => saveWorkspace(localStorage, workspace), [workspace])

  const activeTree = useMemo(
    () => workspace.trees.find((tree) => tree.id === workspace.activeTreeId) ?? workspace.trees[0],
    [workspace],
  )

  const updateTree = useCallback((treeId: string, transform: (tree: SkillTree) => SkillTree) => {
    setWorkspace((current) => ({
      ...current,
      trees: current.trees.map((tree) => (tree.id === treeId ? transform(tree) : tree)),
    }))
  }, [])

  const selectTree = useCallback((treeId: string) => {
    setWorkspace((current) => current.trees.some((tree) => tree.id === treeId)
      ? { ...current, activeTreeId: treeId }
      : current)
  }, [])

  const addTree = useCallback(() => {
    const id = makeId('tree')
    setWorkspace((current) => ({
      ...current,
      activeTreeId: id,
      trees: [...current.trees, { id, name: 'New Tree', nodes: [], edges: [] }],
    }))
    return id
  }, [])

  const renameTree = useCallback((treeId: string, name: string) => {
    updateTree(treeId, (tree) => ({ ...tree, name }))
  }, [updateTree])

  const deleteTree = useCallback((treeId: string) => {
    setWorkspace((current) => {
      const remaining = current.trees.filter((tree) => tree.id !== treeId)
      if (remaining.length === 0) {
        const id = makeId('tree')
        return { version: 1, activeTreeId: id, trees: [{ id, name: 'New Tree', nodes: [], edges: [] }] }
      }
      return {
        ...current,
        trees: remaining,
        activeTreeId: current.activeTreeId === treeId ? remaining[0].id : current.activeTreeId,
      }
    })
  }, [])

  const addSkill = useCallback((position: XYPosition = { x: 160, y: 100 }) => {
    const id = makeId('skill')
    const newNode: SkillNode = {
      id,
      type: 'skill',
      position,
      data: {
        id,
        name: 'New Skill',
        description: '',
        level: 0,
        maxLevel: 1,
        status: 'available',
        prerequisiteIds: [],
      },
    }
    updateTree(activeTree.id, (tree) => ({ ...tree, nodes: [...tree.nodes, newNode] }))
    return id
  }, [activeTree.id, updateTree])

  const updateSkill = useCallback((skillId: string, patch: Partial<Pick<SkillData, 'name' | 'description' | 'level' | 'maxLevel'>>) => {
    updateTree(activeTree.id, (tree) => recalculateTree({
      ...tree,
      nodes: tree.nodes.map((node) => {
        if (node.id !== skillId) return node
        const maxLevel = Math.max(1, Math.round(patch.maxLevel ?? node.data.maxLevel))
        const level = Math.min(maxLevel, Math.max(0, Math.round(patch.level ?? node.data.level)))
        const changesLevel = patch.level !== undefined || patch.maxLevel !== undefined
        const status = changesLevel && level < maxLevel && node.data.status === 'completed'
          ? level > 0 ? 'in-progress' : 'available'
          : node.data.status
        return { ...node, data: { ...node.data, ...patch, maxLevel, level, status } }
      }),
    }))
  }, [activeTree.id, updateTree])

  const completeSkill = useCallback((skillId: string) => {
    updateTree(activeTree.id, (tree) => recalculateTree({
      ...tree,
      nodes: tree.nodes.map((node) => node.id === skillId
        ? { ...node, data: { ...node.data, level: node.data.maxLevel, status: 'completed' } }
        : node),
    }))
  }, [activeTree.id, updateTree])

  const removeSkill = useCallback((skillId: string) => {
    updateTree(activeTree.id, (tree) => deleteSkill(tree, skillId))
  }, [activeTree.id, updateTree])

  const connectSkills = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return 'Choose two skills to connect.'
    const result = addDependency(activeTree, connection.source, connection.target)
    if (result.changed) updateTree(activeTree.id, () => result.tree)
    return result.reason
  }, [activeTree, updateTree])

  const changeNodes = useCallback((changes: NodeChange<SkillNode>[]) => {
    updateTree(activeTree.id, (tree) => {
      const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
      const withoutRemoved = removedIds.reduce(deleteSkill, tree)
      const safeChanges = changes.filter((change) => change.type !== 'remove')
      return { ...withoutRemoved, nodes: applyNodeChanges(safeChanges, withoutRemoved.nodes) }
    })
  }, [activeTree.id, updateTree])

  const changeEdges = useCallback((changes: EdgeChange[]) => {
    updateTree(activeTree.id, (tree) => {
      const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
      const withoutRemoved = removedIds.reduce(removeDependency, tree)
      const safeChanges = changes.filter((change) => change.type !== 'remove')
      return { ...withoutRemoved, edges: applyEdgeChanges(safeChanges, withoutRemoved.edges) }
    })
  }, [activeTree.id, updateTree])

  return {
    workspace,
    activeTree,
    selectTree,
    addTree,
    renameTree,
    deleteTree,
    addSkill,
    updateSkill,
    completeSkill,
    removeSkill,
    connectSkills,
    changeNodes,
    changeEdges,
  }
}
