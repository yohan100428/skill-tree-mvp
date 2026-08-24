import type { DailyQuest, SkillNode, TreeCategory } from '../../types/skillTree'
import { QuestGroup } from './QuestGroup'

interface TodayPageProps {
  categories: TreeCategory[]
  quests: DailyQuest[]
  skills: SkillNode[]
  today: string
  onCompleteQuest: (quest: DailyQuest, category: TreeCategory) => void
  onUnlockSkill: (skillId: string) => void
  onOpenQuestMenu: (questId: string) => void
}

const displayDate = (today: string): string => {
  const [, month, day] = today.split('-').map(Number)
  return `${month}월 ${day}일`
}

export const TodayPage = ({
  categories,
  quests,
  skills,
  today,
  onCompleteQuest,
  onUnlockSkill,
  onOpenQuestMenu,
}: TodayPageProps) => {
  const completed = quests.filter((quest) => quest.completedDate === today).length
  const percent = quests.length === 0 ? 0 : Math.round((completed / quests.length) * 100)
  const availableSkills = skills.filter((skill) => skill.data.status === 'available').slice(0, 3)

  return (
    <div className="page today-page">
      <section className="page-intro">
        <span className="eyebrow">DAILY CHECK-IN</span>
        <h1>TODAY</h1>
        <p>{displayDate(today)}</p>
      </section>

      <section className="daily-progress" aria-label="오늘의 진행">
        <div><span>오늘의 진행</span><strong>{completed} / {quests.length}</strong></div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={quests.length} aria-valuenow={completed}>
          <span style={{ width: `${percent}%` }} />
        </div>
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
          <section className="empty-state"><strong>아직 Tree가 없어요</strong><p>아래 + 버튼으로 첫 Tree를 만들어 보세요.</p></section>
        )}
        {categories.length > 0 && quests.length === 0 && (
          <section className="empty-state"><strong>오늘의 Quest가 없어요</strong><p>아래 + 버튼으로 바로 추가할 수 있어요.</p></section>
        )}
      </div>

      {availableSkills.length > 0 && (
        <section className="available-section" aria-label="Unlock available">
          <span className="section-label">UNLOCK AVAILABLE</span>
          <div className="available-card">
            {availableSkills.map((skill) => {
              const category = categories.find((candidate) => candidate.id === skill.data.categoryId)
              return (
                <article className="available-row" key={skill.id}>
                  <div><strong>{skill.data.name}</strong><span>{skill.data.requiredCoins} {category?.coinName ?? 'Coin'}</span></div>
                  <button type="button" aria-label={`${skill.data.name} unlock`} onClick={() => onUnlockSkill(skill.id)}>UNLOCK</button>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
