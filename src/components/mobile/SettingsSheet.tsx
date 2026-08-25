import { useState } from 'react'
import type { TreeCategory } from '../../types/skillTree'
import { BottomSheet } from './BottomSheet'

interface TreeSettingsRowProps {
  category: TreeCategory
  onUpdate: (patch: Partial<Pick<TreeCategory, 'name' | 'coinName'>>) => void
  onDelete: () => void
}

const TreeSettingsRow = ({ category, onUpdate, onDelete }: TreeSettingsRowProps) => {
  const [name, setName] = useState(category.name)
  const [coinName, setCoinName] = useState(category.coinName)
  return (
    <article className="settings-tree-row">
      <label>Tree 이름<input aria-label={`Tree name ${category.name}`} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Coin 이름<input aria-label={`Coin name ${category.name}`} value={coinName} onChange={(event) => setCoinName(event.target.value)} /></label>
      <div>
        <button type="button" onClick={() => onUpdate({ name: name.trim() || category.name, coinName })}>저장</button>
        <button type="button" className="danger-action" aria-label={`Delete Tree ${category.name}`} onClick={onDelete}>삭제</button>
      </div>
    </article>
  )
}

interface SettingsSheetProps {
  categories: TreeCategory[]
  onClose: () => void
  onUpdateCategory: (categoryId: string, patch: Partial<Pick<TreeCategory, 'name' | 'coinName'>>) => void
  onDeleteCategory: (categoryId: string) => void
  onReset: () => void
}

export const SettingsSheet = ({ categories, onClose, onUpdateCategory, onDeleteCategory, onReset }: SettingsSheetProps) => (
  <BottomSheet titleId="settings-title" onClose={onClose}>
    <div className="settings-content">
      <h2 id="settings-title">SETTINGS</h2>
      <h3>Manage Trees</h3>
      <div className="settings-tree-list">
        {categories.map((category) => (
          <TreeSettingsRow
            category={category}
            onUpdate={(patch) => onUpdateCategory(category.id, patch)}
            onDelete={() => {
              if (window.confirm(`“${category.name}” Tree와 관련 데이터를 삭제할까요?`)) onDeleteCategory(category.id)
            }}
            key={category.id}
          />
        ))}
      </div>
      <button type="button" className="reset-button" onClick={() => {
        if (window.confirm('모든 Tree, Quest, Skill을 삭제하고 ME만 남길까요?')) onReset()
      }}>Reset All Data</button>
    </div>
  </BottomSheet>
)
