import { useEffect, useRef, useState } from 'react'
import { QuestForm } from './components/forms/QuestForm'
import { SkillForm } from './components/forms/SkillForm'
import { TreeForm } from './components/forms/TreeForm'
import { AddActionSheet } from './components/mobile/AddActionSheet'
import { AppHeader } from './components/mobile/AppHeader'
import { BottomNavigation } from './components/mobile/BottomNavigation'
import type { MobilePage } from './components/mobile/BottomNavigation'
import { QuestActionsSheet } from './components/mobile/QuestActionsSheet'
import { SettingsSheet } from './components/mobile/SettingsSheet'
import { SkillBottomSheet } from './components/mobile/SkillBottomSheet'
import { TodayPage } from './components/mobile/TodayPage'
import { TreePage } from './components/mobile/TreePage'
import { useSkillMap } from './hooks/useSkillMap'
import type { DailyQuest, TreeCategory } from './types/skillTree'
import { canCompleteQuest, getLocalDate } from './utils/questLogic'
import { STORAGE_KEY } from './utils/storage'

type Sheet =
  | { type: 'add' }
  | { type: 'questForm'; questId?: string }
  | { type: 'questActions'; questId: string }
  | { type: 'skillForm'; skillId?: string }
  | { type: 'treeForm' }
  | { type: 'settings' }

const App = () => {
  const actions = useSkillMap()
  const [page, setPage] = useState<MobilePage>('today')
  const [today, setToday] = useState(() => getLocalDate())
  const [feedback, setFeedback] = useState<string>()
  const [selectedSkillId, setSelectedSkillId] = useState<string>()
  const [sheet, setSheet] = useState<Sheet>()
  const feedbackTimer = useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(undefined)

  useEffect(() => {
    const now = new Date()
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeout = globalThis.setTimeout(
      () => setToday(getLocalDate()),
      nextDay.getTime() - now.getTime() + 25,
    )
    return () => globalThis.clearTimeout(timeout)
  }, [today])

  useEffect(() => () => globalThis.clearTimeout(feedbackTimer.current), [])

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
      localStorage.removeItem(STORAGE_KEY)
      actions.resetWorkspace()
      globalThis.clearTimeout(feedbackTimer.current)
      setFeedback(undefined)
      setSelectedSkillId(undefined)
      setSheet(undefined)
      setPage('today')
    }
    window.addEventListener('keydown', clearCachedWorkspace)
    return () => window.removeEventListener('keydown', clearCachedWorkspace)
  }, [actions.resetWorkspace])

  const completeQuest = (quest: DailyQuest, category: TreeCategory) => {
    if (!canCompleteQuest(quest, today)) return
    actions.completeQuest(quest.id, today)
    setFeedback(`+${quest.rewardCoins} ${category.coinName}`)
    globalThis.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = globalThis.setTimeout(() => setFeedback(undefined), 1600)
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
            skills={actions.workspace.nodes}
            today={today}
            onCompleteQuest={completeQuest}
            onUnlockSkill={actions.unlockSkill}
            onOpenQuestMenu={(questId) => setSheet({ type: 'questActions', questId })}
          />
        ) : (
          <TreePage
            categories={actions.workspace.categories}
            workspace={actions.workspace}
            selectedCategoryId={actions.workspace.selectedCategoryId}
            onSelectCategory={actions.selectCategory}
            onSelectSkill={setSelectedSkillId}
            onNodesChange={actions.changeNodes}
            onEdgesChange={actions.changeEdges}
            onConnect={(connection) => { actions.connectSkills(connection) }}
          />
        )}
      </div>
      {feedback && <div className="coin-feedback" role="status">{feedback}</div>}
      <BottomNavigation
        page={page}
        onNavigate={navigate}
        onAdd={() => { setSelectedSkillId(undefined); setSheet({ type: 'add' }) }}
      />

      {selectedSkill && (
        <SkillBottomSheet
          skill={selectedSkill}
          allSkills={actions.workspace.nodes}
          categories={actions.workspace.categories}
          onClose={() => setSelectedSkillId(undefined)}
          onUnlock={actions.unlockSkill}
          onEdit={(skillId) => { setSelectedSkillId(undefined); setSheet({ type: 'skillForm', skillId }) }}
          onDelete={(skillId) => {
            if (window.confirm(`“${selectedSkill.data.name}” Skill을 삭제할까요?`)) {
              actions.removeSkill(skillId)
              setSelectedSkillId(undefined)
            }
          }}
        />
      )}
      {sheet?.type === 'add' && (
        <AddActionSheet
          hasTrees={actions.workspace.categories.length > 0}
          onClose={() => setSheet(undefined)}
          onChoose={(kind) => setSheet({ type: `${kind}Form` } as Sheet)}
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
          onSubmit={(name, coinName) => {
            actions.addCategory(name, coinName)
            setPage('tree')
            setSheet(undefined)
          }}
        />
      )}
      {sheet?.type === 'settings' && (
        <SettingsSheet
          categories={actions.workspace.categories}
          onClose={() => setSheet(undefined)}
          onUpdateCategory={actions.updateCategory}
          onDeleteCategory={actions.deleteCategory}
          onReset={() => { actions.resetWorkspace(); setPage('today'); setSheet(undefined) }}
        />
      )}
    </main>
  )
}

export default App
