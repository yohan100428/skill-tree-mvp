import { useState } from 'react'
import type { NewQuestInput } from '../../hooks/useSkillMap'
import type { DailyQuest, TreeCategory } from '../../types/skillTree'
import { BottomSheet } from '../mobile/BottomSheet'

interface QuestFormProps {
  categories: TreeCategory[]
  selectedCategoryId: string | null
  quest?: DailyQuest
  onClose: () => void
  onSubmit: (input: NewQuestInput) => void
}

export const QuestForm = ({ categories, selectedCategoryId, quest, onClose, onSubmit }: QuestFormProps) => {
  const [title, setTitle] = useState(quest?.title ?? '')
  const [categoryId, setCategoryId] = useState(quest?.categoryId ?? selectedCategoryId ?? categories[0]?.id ?? '')
  const [rewardCoins, setRewardCoins] = useState(quest?.rewardCoins ?? 1)
  const heading = quest ? 'EDIT QUEST' : 'NEW QUEST'

  return (
    <BottomSheet titleId="quest-form-title" onClose={onClose}>
      <form className="mobile-form" onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ title: title.trim(), categoryId, rewardCoins })
      }}>
        <h2 id="quest-form-title">{heading}</h2>
        <label>퀘스트<input aria-label="퀘스트" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
        <label>Tree<select aria-label="Tree" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select></label>
        <fieldset className="stepper-field"><legend>Reward</legend><div>
          <button type="button" aria-label="Reward decrease" onClick={() => setRewardCoins((value) => Math.max(0, value - 1))}>−</button>
          <strong>{rewardCoins} Coin</strong>
          <button type="button" aria-label="Reward increase" onClick={() => setRewardCoins((value) => value + 1)}>＋</button>
        </div></fieldset>
        <button type="submit" className="primary-button full-button" disabled={!title.trim() || !categoryId}>{quest ? '저장' : '추가'}</button>
      </form>
    </BottomSheet>
  )
}
