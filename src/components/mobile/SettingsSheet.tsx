import { useState } from 'react'
import type { TreeCategory } from '../../types/skillTree'
import { BottomSheet } from './BottomSheet'

interface CategorySettingsRowProps {
  category: TreeCategory
  onUpdate: (patch: Partial<Pick<TreeCategory, 'name' | 'finalGoal'>>) => void
  onDelete: () => void
}

const CategorySettingsRow = ({ category, onUpdate, onDelete }: CategorySettingsRowProps) => {
  const [name, setName] = useState(category.name)
  const [finalGoal, setFinalGoal] = useState(category.finalGoal)
  return (
    <article className="settings-tree-row">
      <label>카테고리 이름<input aria-label={`Category name ${category.name}`} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>최종목표<input aria-label={`Final goal ${category.name}`} value={finalGoal} onChange={(event) => setFinalGoal(event.target.value)} /></label>
      <div>
        <button type="button" aria-label={`Save category ${category.name}`} disabled={!name.trim() || !finalGoal.trim()} onClick={() => onUpdate({ name: name.trim(), finalGoal: finalGoal.trim() })}>저장</button>
        <button type="button" className="danger-action" aria-label={`Delete category ${category.name}`} onClick={onDelete}>삭제</button>
      </div>
    </article>
  )
}

interface SettingsSheetProps {
  userName: string
  categories: TreeCategory[]
  onClose: () => void
  onUpdateUserName: (userName: string) => void
  onUpdateCategory: (categoryId: string, patch: Partial<Pick<TreeCategory, 'name' | 'finalGoal'>>) => void
  onDeleteCategory: (categoryId: string) => void
  onReset: () => void
}

export const SettingsSheet = ({ userName, categories, onClose, onUpdateUserName, onUpdateCategory, onDeleteCategory, onReset }: SettingsSheetProps) => {
  const [name, setName] = useState(userName)
  return (
    <BottomSheet titleId="settings-title" onClose={onClose}>
      <div className="settings-content">
        <h2 id="settings-title">SETTINGS</h2>
        <h3>Profile</h3>
        <div className="settings-profile-row">
          <label>사용자 이름<input aria-label="사용자 이름" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <button type="button" aria-label="사용자 이름 저장" onClick={() => onUpdateUserName(name)}>저장</button>
        </div>
        <h3>카테고리 관리</h3>
        <div className="settings-tree-list">
          {categories.map((category) => (
            <CategorySettingsRow
              category={category}
              onUpdate={(patch) => onUpdateCategory(category.id, patch)}
              onDelete={() => {
                if (window.confirm(`“${category.name}” 카테고리와 관련 데이터를 삭제할까요?`)) onDeleteCategory(category.id)
              }}
              key={category.id}
            />
          ))}
        </div>
        <button type="button" className="reset-button" onClick={() => {
          if (window.confirm('모든 카테고리, Quest, Skill을 삭제하고 사용자만 남길까요?')) onReset()
        }}>Reset All Data</button>
      </div>
    </BottomSheet>
  )
}
