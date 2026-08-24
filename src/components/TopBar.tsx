interface TopBarProps {
  unlocked: number
  total: number
  message?: string
  canAddSkill: boolean
  onAddSkill: () => void
}

export const TopBar = ({ unlocked, total, message, canAddSkill, onAddSkill }: TopBarProps) => (
  <header className="topbar">
    <div>
      <span className="eyebrow">One map · many branches</span>
      <h1>MY SKILL TREE</h1>
    </div>
    {message && <p className="notice" role="status">{message}</p>}
    <div className="overall"><span>Progress</span><strong>{unlocked}/{total} unlocked</strong></div>
    <button type="button" className="primary-button" disabled={!canAddSkill} onClick={onAddSkill}>+ Add Skill</button>
  </header>
)
