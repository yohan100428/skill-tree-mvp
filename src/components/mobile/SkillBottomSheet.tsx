import type { SkillNode, TreeCategory } from '../../types/skillTree'
import { BottomSheet } from './BottomSheet'

interface SkillBottomSheetProps {
  skill: SkillNode
  allSkills: SkillNode[]
  categories: TreeCategory[]
  onClose: () => void
  onUnlock: (skillId: string) => void
  onEdit: (skillId: string) => void
}

export const SkillBottomSheet = ({
  skill,
  allSkills,
  categories,
  onClose,
  onUnlock,
  onEdit,
}: SkillBottomSheetProps) => {
  const category = categories.find((candidate) => candidate.id === skill.data.categoryId)
  const coins = category?.coins ?? 0
  const percent = skill.data.requiredCoins === 0
    ? 100
    : Math.min(100, Math.round((coins / skill.data.requiredCoins) * 100))
  const prerequisites = skill.data.prerequisiteIds
    .map((id) => allSkills.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is SkillNode => Boolean(candidate))
  const missingCoins = Math.max(0, skill.data.requiredCoins - coins)

  return (
    <BottomSheet titleId="skill-sheet-title" onClose={onClose}>
      <div className="skill-sheet-content">
        <span className={`status-badge status-badge--${skill.data.status}`}>{skill.data.status.toUpperCase()}</span>
        <h2 id="skill-sheet-title">{skill.data.name}</h2>
        <p className="skill-description">{skill.data.description || '아직 설명이 없습니다.'}</p>

        <section className="skill-requirement">
          <span>{category?.coinName ?? 'Coin'}</span>
          <strong>{coins} / {skill.data.requiredCoins}</strong>
          <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
        </section>

        <section className="prerequisite-list">
          <h3>PREREQUISITE</h3>
          {prerequisites.length > 0
            ? prerequisites.map((item) => <p key={item.id}>{item.data.status === 'unlocked' ? '✓' : '○'} {item.data.name}</p>)
            : <p>없음</p>}
        </section>

        <p className="requirement-message">
          {skill.data.status === 'available'
            ? '조건 달성'
            : skill.data.status === 'unlocked'
              ? '해금 완료'
              : missingCoins > 0 ? `${missingCoins} Coin 부족` : '선행 Skill이 필요합니다'}
        </p>
        {skill.data.status === 'available' && (
          <button type="button" className="primary-button full-button" onClick={() => onUnlock(skill.id)}>UNLOCK</button>
        )}
        <button type="button" className="secondary-button full-button" onClick={() => onEdit(skill.id)}>수정</button>
      </div>
    </BottomSheet>
  )
}
