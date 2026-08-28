import { useState } from 'react'
import { BottomSheet } from '../mobile/BottomSheet'

interface TreeFormProps {
  onClose: () => void
  onSubmit: (name: string, finalGoal: string) => void
}

export const TreeForm = ({ onClose, onSubmit }: TreeFormProps) => {
  const [name, setName] = useState('')
  const [finalGoal, setFinalGoal] = useState('')
  return (
    <BottomSheet titleId="tree-form-title" onClose={onClose}>
      <form className="mobile-form" onSubmit={(event) => { event.preventDefault(); onSubmit(name.trim(), finalGoal.trim()) }}>
        <h2 id="tree-form-title">NEW CATEGORY</h2>
        <label>카테고리 이름<input aria-label="카테고리 이름" value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label>
        <label>최종목표<input aria-label="최종목표" value={finalGoal} onChange={(event) => setFinalGoal(event.target.value)} placeholder="이 가지에서 이루고 싶은 최종목표" /></label>
        <button type="submit" className="primary-button full-button" disabled={!name.trim() || !finalGoal.trim()}>만들기</button>
      </form>
    </BottomSheet>
  )
}
