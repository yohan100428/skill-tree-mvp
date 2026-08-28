import type { DailyQuest, TreeCategory } from '../../types/skillTree'
import { QuestGroup } from './QuestGroup'

interface TodayPageProps {
  categories: TreeCategory[]
  quests: DailyQuest[]
  today: string
  onCompleteQuest: (quest: DailyQuest) => void
  onOpenQuestMenu: (questId: string) => void
  onAddMission: () => void
}

const displayDate = (today: string): string => {
  const [, month, day] = today.split('-').map(Number)
  return `${month}월 ${day}일`
}

export const TodayPage = ({
  categories,
  quests,
  today,
  onCompleteQuest,
  onOpenQuestMenu,
  onAddMission,
}: TodayPageProps) => {
  return (
    <div className="page today-page">
      <section className="page-intro page-intro--actions">
        <div>
          <span className="eyebrow">DAILY CHECK-IN</span>
          <h1>TODAY</h1>
          <p>{displayDate(today)}</p>
        </div>
        <button type="button" className="context-add-button" aria-label="미션 추가" disabled={categories.length === 0} onClick={onAddMission}>＋ 미션</button>
      </section>

      <div className="quest-groups">
        {categories.map((category) => {
          const categoryQuests = quests.filter((quest) => quest.categoryId === category.id)
          return categoryQuests.length > 0 ? (
            <QuestGroup
              category={category}
              quests={categoryQuests}
              today={today}
              onComplete={onCompleteQuest}
              onOpenMenu={onOpenQuestMenu}
              key={category.id}
            />
          ) : null
        })}
        {categories.length === 0 && (
          <section className="empty-state"><strong>아직 카테고리가 없어요</strong><p>Tree 화면에서 첫 카테고리를 만들어 보세요.</p></section>
        )}
        {categories.length > 0 && quests.length === 0 && (
          <section className="empty-state"><strong>오늘의 미션이 없어요</strong><p>위의 + 미션 버튼으로 바로 추가할 수 있어요.</p></section>
        )}
      </div>
    </div>
  )
}
