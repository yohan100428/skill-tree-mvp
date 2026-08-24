import { useEffect, useMemo, useState } from 'react'
import type { Connection } from '@xyflow/react'
import { CategorySidebar } from './components/CategorySidebar'
import { QuestPanel } from './components/QuestPanel'
import { SkillEditor } from './components/SkillEditor'
import { SkillTreeCanvas } from './components/SkillTreeCanvas'
import { TopBar } from './components/TopBar'
import { useSkillMap } from './hooks/useSkillMap'

const App = () => {
  const actions = useSkillMap()
  const [selectedSkillId, setSelectedSkillId] = useState<string>()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (selectedSkillId && !actions.workspace.nodes.some((node) => node.id === selectedSkillId)) {
      setSelectedSkillId(undefined)
    }
  }, [actions.workspace.nodes, selectedSkillId])

  const selectedNode = actions.workspace.nodes.find((node) => node.id === selectedSkillId)
  const selectedQuests = useMemo(
    () => actions.workspace.quests.filter((quest) => quest.categoryId === actions.workspace.selectedCategoryId),
    [actions.workspace.quests, actions.workspace.selectedCategoryId],
  )
  const unlocked = actions.workspace.nodes.filter((node) => node.data.status === 'unlocked').length

  const handleAddSkill = () => {
    const offset = actions.workspace.nodes.length % 6
    const id = actions.addSkill({ x: 100 + offset * 38, y: 80 + offset * 34 })
    if (id) setSelectedSkillId(id)
  }

  const handleConnect = (connection: Connection) => {
    const error = actions.connectSkills(connection)
    setMessage(error ?? 'Dependency connected.')
  }

  const handleDeleteCategory = (categoryId: string) => {
    const category = actions.workspace.categories.find((candidate) => candidate.id === categoryId)
    if (category && window.confirm(`Delete “${category.name}”, its quests, and its skills?`)) {
      actions.deleteCategory(categoryId)
    }
  }

  return (
    <main className="app-shell">
      <CategorySidebar
        categories={actions.workspace.categories}
        selectedCategoryId={actions.workspace.selectedCategoryId}
        onSelect={actions.selectCategory}
        onAdd={actions.addCategory}
        onDelete={handleDeleteCategory}
      >
        <QuestPanel
          category={actions.selectedCategory}
          quests={selectedQuests}
          onUpdateCategory={(patch) => actions.selectedCategory && actions.updateCategory(actions.selectedCategory.id, patch)}
          onAddQuest={() => { actions.addQuest() }}
          onUpdateQuest={actions.updateQuest}
          onCompleteQuest={actions.completeQuest}
          onDeleteQuest={actions.removeQuest}
        />
      </CategorySidebar>
      <section className="workspace">
        <TopBar
          unlocked={unlocked}
          total={actions.workspace.nodes.length}
          message={message}
          canAddSkill={Boolean(actions.workspace.selectedCategoryId)}
          onAddSkill={handleAddSkill}
        />
        <div className="work-area">
          <SkillTreeCanvas
            map={actions.workspace}
            onNodesChange={actions.changeNodes}
            onEdgesChange={actions.changeEdges}
            onConnect={handleConnect}
            onSelectSkill={setSelectedSkillId}
          />
          <SkillEditor
            node={selectedNode}
            allNodes={actions.workspace.nodes}
            categories={actions.workspace.categories}
            onUpdate={(patch) => selectedNode && actions.updateSkill(selectedNode.id, patch)}
            onUnlock={() => selectedNode && actions.unlockSkill(selectedNode.id)}
            onDelete={() => selectedNode && actions.removeSkill(selectedNode.id)}
          />
        </div>
      </section>
    </main>
  )
}

export default App
