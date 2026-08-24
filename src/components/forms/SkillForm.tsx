import { useState } from 'react'
import type { NewSkillInput } from '../../hooks/useSkillMap'
import type { SkillNode, TreeCategory } from '../../types/skillTree'
import { BottomSheet } from '../mobile/BottomSheet'

interface SkillFormProps {
  categories: TreeCategory[]
  skills: SkillNode[]
  selectedCategoryId: string | null
  skill?: SkillNode
  onClose: () => void
  onSubmit: (input: NewSkillInput) => void
}

export const SkillForm = ({ categories, skills, selectedCategoryId, skill, onClose, onSubmit }: SkillFormProps) => {
  const [name, setName] = useState(skill?.data.name ?? '')
  const [description, setDescription] = useState(skill?.data.description ?? '')
  const [categoryId, setCategoryId] = useState(skill?.data.categoryId ?? selectedCategoryId ?? categories[0]?.id ?? '')
  const [requiredCoins, setRequiredCoins] = useState(skill?.data.requiredCoins ?? 0)
  const [prerequisiteId, setPrerequisiteId] = useState(skill?.data.prerequisiteIds[0] ?? '')
  const choices = skills.filter((candidate) => candidate.data.categoryId === categoryId && candidate.id !== skill?.id)

  return (
    <BottomSheet titleId="skill-form-title" onClose={onClose}>
      <form className="mobile-form" onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ name: name.trim(), description: description.trim(), categoryId, requiredCoins, prerequisiteId: prerequisiteId || undefined })
      }}>
        <h2 id="skill-form-title">{skill ? 'EDIT SKILL' : 'NEW SKILL'}</h2>
        <label>이름<input aria-label="이름" value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label>
        <label>설명<textarea aria-label="설명" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Tree<select aria-label="Tree" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPrerequisiteId('') }}>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select></label>
        <label>필요 Coin<input aria-label="필요 Coin" type="number" min={0} value={requiredCoins} onChange={(event) => setRequiredCoins(Number(event.target.value))} /></label>
        {!skill && <label>선행 Skill<select aria-label="선행 Skill" value={prerequisiteId} onChange={(event) => setPrerequisiteId(event.target.value)}>
          <option value="">없음</option>
          {choices.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.data.name}</option>)}
        </select></label>}
        <button type="submit" className="primary-button full-button" disabled={!name.trim() || !categoryId}>{skill ? '저장' : '만들기'}</button>
      </form>
    </BottomSheet>
  )
}
