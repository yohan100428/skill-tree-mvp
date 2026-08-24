import { useState } from 'react'
import { BottomSheet } from '../mobile/BottomSheet'

interface TreeFormProps {
  onClose: () => void
  onSubmit: (name: string, coinName: string) => void
}

export const TreeForm = ({ onClose, onSubmit }: TreeFormProps) => {
  const [name, setName] = useState('')
  const [coinName, setCoinName] = useState('')
  return (
    <BottomSheet titleId="tree-form-title" onClose={onClose}>
      <form className="mobile-form" onSubmit={(event) => { event.preventDefault(); onSubmit(name.trim(), coinName.trim()) }}>
        <h2 id="tree-form-title">NEW TREE</h2>
        <label>트리 이름<input aria-label="트리 이름" value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label>
        <label>Coin 이름<input aria-label="Coin 이름" value={coinName} onChange={(event) => setCoinName(event.target.value)} placeholder={name ? `${name} Coin` : 'Tree Coin'} /></label>
        <button type="submit" className="primary-button full-button" disabled={!name}>만들기</button>
      </form>
    </BottomSheet>
  )
}
