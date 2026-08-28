import { useEffect, useState } from 'react'
import { QuestForm } from './components/forms/QuestForm'
import { SkillForm } from './components/forms/SkillForm'
import { TreeForm } from './components/forms/TreeForm'
import { AppHeader } from './components/mobile/AppHeader'
import { BottomNavigation } from './components/mobile/BottomNavigation'
import type { MobilePage } from './components/mobile/BottomNavigation'
import { QuestActionsSheet } from './components/mobile/QuestActionsSheet'
import { SettingsSheet } from './components/mobile/SettingsSheet'
import { SkillBottomSheet } from './components/mobile/SkillBottomSheet'
import { TodayPage } from './components/mobile/TodayPage'
import { TreePage } from './components/mobile/TreePage'
import { useSkillMap } from './hooks/useSkillMap'
import type { DailyQuest } from './types/skillTree'
import { canCompleteQuest, getLocalDate } from './utils/questLogic'
import { getBrowserStorage, removeWorkspace } from './utils/storage'

type Sheet =
  | { type: 'questForm'; questId?: string }
  | { type: 'questActions'; questId: string }
  | { type: 'skillForm'; skillId?: string }
  | { type: 'treeForm' }
  | { type: 'settings' }

const App = () => {
  const actions = useSkillMap()
  const [page, setPage] = useState<MobilePage>('tree')
  const [today, setToday] = useState(() => getLocalDate())
  const [selectedSkillId, setSelectedSkillId] = useState<string>()
  const [sheet, setSheet] = useState<Sheet>()

  useEffect(() => {
    const now = new Date()
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeout = globalThis.setTimeout(
      () => setToday(getLocalDate()),
      nextDay.getTime() - now.getTime() + 25,
    )
    return () => globalThis.clearTimeout(timeout)
  }, [today])

  useEffect(() => {
    const clearCachedWorkspace = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (
        target instanceof HTMLElement
        && (target.matches('input, textarea, select') || target.isContentEditable)
      ) return
      event.preventDefault()
      removeWorkspace(getBrowserStorage())
      actions.resetWorkspace()
      setSelectedSkillId(undefined)
      setSheet(undefined)
      setPage('tree')
    }
    window.addEventListener('keydown', clearCachedWorkspace)
    return () => window.removeEventListener('keydown', clearCachedWorkspace)
  }, [actions.resetWorkspace])

  const completeQuest = (quest: DailyQuest) => {
    if (!canCompleteQuest(quest, today)) return
    actions.completeQuest(quest.id, today)
  }

  const navigate = (nextPage: MobilePage) => {
    setSelectedSkillId(undefined)
    setSheet(undefined)
    setPage(nextPage)
  }

  const selectedSkill = actions.workspace.nodes.find((skill) => skill.id === selectedSkillId)
  const sheetQuest = sheet?.type === 'questActions' || sheet?.type === 'questForm'
    ? actions.workspace.quests.find((quest) => quest.id === sheet.questId)
    : undefined
  const sheetSkill = sheet?.type === 'skillForm'
    ? actions.workspace.nodes.find((skill) => skill.id === sheet.skillId)
    : undefined

  return (
    <main className="app-shell">
      <AppHeader onOpenSettings={() => { setSelectedSkillId(undefined); setSheet({ type: 'settings' }) }} />
      <div className="page-scroll">
        {page === 'today' ? (
          <TodayPage
            categories={actions.workspace.categories}
            quests={actions.workspace.quests}
            today={today}
            onCompleteQuest={completeQuest}
            onOpenQuestMenu={(questId) => setSheet({ type: 'questActions', questId })}
            onAddMission={() => { setSelectedSkillId(undefined); setSheet({ type: 'questForm' }) }}
          />
        ) : (
          <TreePage
            categories={actions.workspace.categories}
            workspace={actions.workspace}
            onSelectSkill={setSelectedSkillId}
            onNodesChange={actions.changeNodes}
            onEdgesChange={actions.changeEdges}
            onConnect={(connection) => { actions.connectSkills(connection) }}
            onAddCategory={() => { setSelectedSkillId(undefined); setSheet({ type: 'treeForm' }) }}
            onAddSkill={() => { setSelectedSkillId(undefined); setSheet({ type: 'skillForm' }) }}
          />
        )}
      </div>
      <BottomNavigation
        page={page}
        onNavigate={navigate}
      />

      {selectedSkill && (
        <SkillBottomSheet
          skill={selectedSkill}
          allSkills={actions.workspace.nodes}
          categories={actions.workspace.categories}
          onClose={() => setSelectedSkillId(undefined)}
          onEdit={(skillId) => { setSelectedSkillId(undefined); setSheet({ type: 'skillForm', skillId }) }}
          onDelete={(skillId) => {
            if (window.confirm(`“${selectedSkill.data.name}” Skill을 삭제할까요?`)) {
              actions.removeSkill(skillId)
              setSelectedSkillId(undefined)
            }
          }}
        />
      )}
      {sheet?.type === 'questActions' && sheetQuest && (
        <QuestActionsSheet
          quest={sheetQuest}
          onClose={() => setSheet(undefined)}
          onEdit={() => setSheet({ type: 'questForm', questId: sheetQuest.id })}
          onDelete={() => {
            if (window.confirm(`“${sheetQuest.title}” Quest를 삭제할까요?`)) actions.removeQuest(sheetQuest.id)
            setSheet(undefined)
          }}
        />
      )}
      {sheet?.type === 'questForm' && (
        <QuestForm
          categories={actions.workspace.categories}
          selectedCategoryId={actions.workspace.selectedCategoryId}
          quest={sheetQuest}
          onClose={() => setSheet(undefined)}
          onSubmit={(input) => {
            if (sheetQuest) actions.updateQuest(sheetQuest.id, input)
            else actions.addQuest(input)
            setPage('today')
            setSheet(undefined)
          }}
        />
      )}
      {sheet?.type === 'skillForm' && (
        <SkillForm
          categories={actions.workspace.categories}
          skills={actions.workspace.nodes}
          selectedCategoryId={actions.workspace.selectedCategoryId}
          skill={sheetSkill}
          onClose={() => setSheet(undefined)}
          onSubmit={(input) => {
            if (sheetSkill) actions.updateSkill(sheetSkill.id, input)
            else actions.addSkill(input)
            actions.selectCategory(input.categoryId)
            setPage('tree')
            setSheet(undefined)
          }}
        />
      )}
      {sheet?.type === 'treeForm' && (
        <TreeForm
          onClose={() => setSheet(undefined)}
          onSubmit={(name, finalGoal) => {
            actions.addCategory(name, finalGoal)
            setPage('tree')
            setSheet(undefined)
          }}
        />
      )}
      {sheet?.type === 'settings' && (
        <SettingsSheet
          userName={actions.workspace.userName}
          categories={actions.workspace.categories}
          onClose={() => setSheet(undefined)}
          onUpdateUserName={actions.updateUserName}
          onUpdateCategory={actions.updateCategory}
          onDeleteCategory={actions.deleteCategory}
          onReset={() => { actions.resetWorkspace(); setPage('tree'); setSheet(undefined) }}
        />
      )}
    </main>
  )
}

export default App
