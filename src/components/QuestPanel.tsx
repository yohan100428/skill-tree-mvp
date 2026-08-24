import { useEffect, useState } from 'react'
import type { DailyQuest, TreeCategory } from '../types/skillTree'
import { canCompleteQuest, getLocalDate } from '../utils/questLogic'

interface QuestPanelProps {
  category?: TreeCategory
  quests: DailyQuest[]
  onUpdateCategory: (patch: Partial<Pick<TreeCategory, 'name' | 'coinName'>>) => void
  onAddQuest: () => void
  onUpdateQuest: (questId: string, patch: Partial<Pick<DailyQuest, 'title' | 'rewardCoins'>>) => void
  onCompleteQuest: (questId: string) => void
  onDeleteQuest: (questId: string) => void
}

export const QuestPanel = ({
  category,
  quests,
  onUpdateCategory,
  onAddQuest,
  onUpdateQuest,
  onCompleteQuest,
  onDeleteQuest,
}: QuestPanelProps) => {
  const [today, setToday] = useState(() => getLocalDate())

  useEffect(() => {
    const now = new Date()
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeout = globalThis.setTimeout(
      () => setToday(getLocalDate()),
      nextDay.getTime() - now.getTime() + 25,
    )
    return () => globalThis.clearTimeout(timeout)
  }, [today])

  if (!category) return <section className="quest-panel quest-panel--empty">Select or create a category.</section>

  return (
    <section className="quest-panel" aria-label="Daily quests">
      <label>
        Category Name
        <input aria-label="Category Name" value={category.name} onChange={(event) => onUpdateCategory({ name: event.target.value })} />
      </label>
      <label>
        Coin Name
        <input aria-label="Coin Name" value={category.coinName} onChange={(event) => onUpdateCategory({ coinName: event.target.value })} />
      </label>
      <div className="coin-total"><span>{category.coinName}</span><strong>{category.coins}</strong></div>
      <div className="section-heading"><h3>DAILY QUESTS</h3><button type="button" onClick={onAddQuest}>+ ADD QUEST</button></div>
      <div className="quest-list">
        {quests.map((quest) => {
          const available = canCompleteQuest(quest, today)
          return (
            <article className="quest-row" key={quest.id}>
              <button
                type="button"
                className="quest-check"
                aria-label={`Complete ${quest.title}`}
                disabled={!available}
                onClick={() => onCompleteQuest(quest.id)}
              >{available ? '□' : '✓'}</button>
              <div>
                <input
                  aria-label={`Quest title ${quest.title}`}
                  value={quest.title}
                  onChange={(event) => onUpdateQuest(quest.id, { title: event.target.value })}
                />
                <label className="reward-field">
                  +
                  <input
                    aria-label={`Reward for ${quest.title}`}
                    type="number"
                    min={0}
                    value={quest.rewardCoins}
                    onChange={(event) => onUpdateQuest(quest.id, { rewardCoins: Number(event.target.value) })}
                  /> Coin
                </label>
              </div>
              <button type="button" className="icon-button" aria-label={`Delete quest ${quest.title}`} onClick={() => onDeleteQuest(quest.id)}>×</button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
