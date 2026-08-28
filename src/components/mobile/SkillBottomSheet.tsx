import type { SkillNode, TreeCategory } from '../../types/skillTree'
import { BottomSheet } from './BottomSheet'

interface SkillBottomSheetProps {
  skill: SkillNode
  allSkills: SkillNode[]
  categories: TreeCategory[]
  onClose: () => void
  onEdit: (skillId: string) => void
  onDelete: (skillId: string) => void
}

export const SkillBottomSheet = ({
  skill,
  allSkills,
  categories,
  onClose,
  onEdit,
  onDelete,
}: SkillBottomSheetProps) => {
  const category = categories.find((candidate) => candidate.id === skill.data.categoryId)
  const prerequisites = skill.data.prerequisiteIds
    .map((id) => allSkills.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is SkillNode => Boolean(candidate))

  return (
    <BottomSheet titleId="skill-sheet-title" onClose={onClose}>
      <div className="skill-sheet-content">
        <span className="status-badge">MIDDLE SKILL</span>
        <h2 id="skill-sheet-title">{skill.data.name}</h2>
        <p className="skill-description">{skill.data.description || '아직 설명이 없습니다.'}</p>
        <section className="skill-context">
          <span>카테고리</span>
          <strong>{category?.name ?? '알 수 없음'}</strong>
          <span>최종목표</span>
          <strong>{category?.finalGoal ?? '알 수 없음'}</strong>
        </section>
        <section className="prerequisite-list">
          <h3>선행 스킬</h3>
          {prerequisites.length > 0
            ? prerequisites.map((item) => <p key={item.id}>○ {item.data.name}</p>)
            : <p>없음</p>}
        </section>
        <button type="button" className="secondary-button full-button" onClick={() => onEdit(skill.id)}>수정</button>
        <button type="button" className="secondary-button danger-action full-button" onClick={() => onDelete(skill.id)}>삭제</button>
      </div>
    </BottomSheet>
  )
}
