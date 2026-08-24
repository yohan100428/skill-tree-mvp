import type { DailyQuest, TreeCategory } from '../../types/skillTree'
import { canCompleteQuest } from '../../utils/questLogic'

interface QuestGroupProps {
  category: TreeCategory
  quests: DailyQuest[]
  today: string
  onComplete: (quest: DailyQuest, category: TreeCategory) => void
  onOpenMenu: (questId: string) => void
}

export const QuestGroup = ({ category, quests, today, onComplete, onOpenMenu }: QuestGroupProps) => (
  <section className="quest-card" data-testid={`quest-group-${category.id}`}>
    <header className="quest-card__header">
      <h3>{category.name || '이름 없는 Tree'}</h3>
      <span>{category.coinName} {category.coins}</span>
    </header>
    <div className="mobile-quest-list">
      {quests.map((quest) => {
        const available = canCompleteQuest(quest, today)
        return <article className="mobile-quest-row" key={quest.id}>
          <button
              type="button"
              className={`mobile-quest${available ? '' : ' is-complete'}`}
              aria-label={`${quest.title} ${available ? '완료' : '완료됨'}`}
              disabled={!available}
              onClick={() => onComplete(quest, category)}
            >
              <span className="quest-state" aria-hidden="true">{available ? '○' : '✓'}</span>
              <span className="quest-title">{quest.title}</span>
              <strong>+{quest.rewardCoins}</strong>
            </button>
          <button type="button" className="quest-menu" aria-label={`${quest.title} menu`} onClick={() => onOpenMenu(quest.id)}>⋮</button>
        </article>
      })}
    </div>
  </section>
)
