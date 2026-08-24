import { useEffect, useMemo, useState } from 'react'
import type { Connection } from '@xyflow/react'
import { SkillEditor } from './components/SkillEditor'
import { SkillTreeCanvas } from './components/SkillTreeCanvas'
import { TopBar } from './components/TopBar'
import { TreeSidebar } from './components/TreeSidebar'
import { useSkillTrees } from './hooks/useSkillTrees'

const App = () => {
  const actions = useSkillTrees()
  const [selectedSkillId, setSelectedSkillId] = useState<string>()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    setSelectedSkillId(undefined)
    setMessage(undefined)
  }, [actions.activeTree.id])

  useEffect(() => {
    if (selectedSkillId && !actions.activeTree.nodes.some((node) => node.id === selectedSkillId)) {
      setSelectedSkillId(undefined)
    }
  }, [actions.activeTree.nodes, selectedSkillId])

  const selectedNode = actions.activeTree.nodes.find((node) => node.id === selectedSkillId)
  const progress = useMemo(() => actions.activeTree.nodes.reduce(
    (summary, node) => ({
      completed: summary.completed + (node.data.status === 'completed' ? 1 : 0),
      level: summary.level + node.data.level,
      maxLevel: summary.maxLevel + node.data.maxLevel,
    }),
    { completed: 0, level: 0, maxLevel: 0 },
  ), [actions.activeTree.nodes])

  const handleAddSkill = () => {
    const offset = actions.activeTree.nodes.length % 6
    const id = actions.addSkill({ x: 100 + offset * 38, y: 80 + offset * 34 })
    setSelectedSkillId(id)
    setMessage(undefined)
  }

  const handleConnect = (connection: Connection) => {
    const error = actions.connectSkills(connection)
    setMessage(error ?? 'Dependency connected.')
  }

  const handleDeleteTree = (treeId: string) => {
    const tree = actions.workspace.trees.find((candidate) => candidate.id === treeId)
    if (tree && window.confirm(`Delete “${tree.name || 'Untitled Tree'}” and all of its skills?`)) {
      actions.deleteTree(treeId)
    }
  }

  return (
    <main className="app-shell">
      <TreeSidebar
        trees={actions.workspace.trees}
        activeTreeId={actions.activeTree.id}
        onSelect={actions.selectTree}
        onAdd={actions.addTree}
        onDelete={handleDeleteTree}
      />
      <section className="workspace">
        <TopBar
          treeName={actions.activeTree.name}
          completed={progress.completed}
          total={actions.activeTree.nodes.length}
          level={progress.level}
          maxLevel={progress.maxLevel}
          message={message}
          onRename={(name) => actions.renameTree(actions.activeTree.id, name)}
          onAddSkill={handleAddSkill}
        />
        <div className="work-area">
          <SkillTreeCanvas
            tree={actions.activeTree}
            onNodesChange={actions.changeNodes}
            onEdgesChange={actions.changeEdges}
            onConnect={handleConnect}
            onSelectSkill={setSelectedSkillId}
          />
          <SkillEditor
            node={selectedNode}
            allNodes={actions.activeTree.nodes}
            onUpdate={(patch) => selectedNode && actions.updateSkill(selectedNode.id, patch)}
            onComplete={() => selectedNode && actions.completeSkill(selectedNode.id)}
            onDelete={() => selectedNode && actions.removeSkill(selectedNode.id)}
          />
        </div>
      </section>
    </main>
  )
}

export default App
