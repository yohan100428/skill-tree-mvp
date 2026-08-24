interface TopBarProps {
  treeName: string
  completed: number
  total: number
  level: number
  maxLevel: number
  message?: string
  onRename: (name: string) => void
  onAddSkill: () => void
}

export const TopBar = ({ treeName, completed, total, level, maxLevel, message, onRename, onAddSkill }: TopBarProps) => (
  <header className="topbar">
    <label className="tree-name-field">
      <span>Tree Name</span>
      <input aria-label="Tree Name" value={treeName} onChange={(event) => onRename(event.target.value)} />
    </label>
    {message && <p className="notice" role="status">{message}</p>}
    <div className="overall">
      <span>Overall</span>
      <strong>{completed}/{total} complete</strong>
      <small>Lv. {level}/{maxLevel}</small>
    </div>
    <button type="button" className="primary-button" onClick={onAddSkill}>+ Add Skill</button>
  </header>
)
