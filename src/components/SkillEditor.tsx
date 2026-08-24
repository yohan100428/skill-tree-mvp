import type { SkillNode, TreeCategory } from '../types/skillTree'

interface SkillEditorProps {
  node?: SkillNode
  allNodes: SkillNode[]
  categories: TreeCategory[]
  onUpdate: (patch: Partial<Pick<SkillNode['data'], 'name' | 'description' | 'categoryId' | 'requiredCoins'>>) => void
  onUnlock: () => void
  onDelete: () => void
}

export const SkillEditor = ({ node, allNodes, categories, onUpdate, onUnlock, onDelete }: SkillEditorProps) => {
  if (!node) return <aside className="editor editor--empty"><strong>No skill selected</strong><p>Select a node to edit or unlock it.</p></aside>

  const category = categories.find((candidate) => candidate.id === node.data.categoryId)
  const prerequisites = node.data.prerequisiteIds
    .map((id) => allNodes.find((candidate) => candidate.id === id)?.data.name)
    .filter((name): name is string => Boolean(name))

  return (
    <aside className="editor" aria-label="Skill editor">
      <div className="editor-heading"><span className="eyebrow">Selected skill</span><span className={`status-pill status-pill--${node.data.status}`}>{node.data.status.toUpperCase()}</span></div>
      <label>Skill Name<input aria-label="Skill Name" value={node.data.name} onChange={(event) => onUpdate({ name: event.target.value })} /></label>
      <label>Description<textarea aria-label="Description" rows={4} value={node.data.description} onChange={(event) => onUpdate({ description: event.target.value })} /></label>
      <label>
        Category
        <select aria-label="Category" value={node.data.categoryId} onChange={(event) => onUpdate({ categoryId: event.target.value })}>
          {categories.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select>
      </label>
      <label>Required Coins<input aria-label="Required Coins" type="number" min={0} value={node.data.requiredCoins} onChange={(event) => onUpdate({ requiredCoins: Number(event.target.value) })} /></label>
      <section className="progress-card"><span>Progress</span><strong>{category?.coins ?? 0} / {node.data.requiredCoins} {category?.coinName ?? 'Coin'}</strong></section>
      <section className="relations"><div><h3>Prerequisites</h3>{prerequisites.length ? <ul>{prerequisites.map((name) => <li key={name}>{name}</li>)}</ul> : <p>None</p>}</div></section>
      <div className="editor-actions">
        <button type="button" className="primary-button" disabled={node.data.status !== 'available'} onClick={onUnlock}>Unlock</button>
        <button type="button" className="danger-button" onClick={onDelete}>Delete Skill</button>
      </div>
    </aside>
  )
}
