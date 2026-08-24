import type { SkillNode } from '../types/skillTree'

interface SkillEditorProps {
  node?: SkillNode
  allNodes: SkillNode[]
  onUpdate: (patch: Partial<Pick<SkillNode['data'], 'name' | 'description' | 'level' | 'maxLevel'>>) => void
  onComplete: () => void
  onDelete: () => void
}

const statusLabel = (status: SkillNode['data']['status']) => status.replace('-', ' ').toUpperCase()

export const SkillEditor = ({ node, allNodes, onUpdate, onComplete, onDelete }: SkillEditorProps) => {
  if (!node) {
    return (
      <aside className="editor editor--empty">
        <strong>No skill selected</strong>
        <p>Select a node to edit its details and progress.</p>
      </aside>
    )
  }

  const prerequisites = node.data.prerequisiteIds
    .map((id) => allNodes.find((candidate) => candidate.id === id)?.data.name)
    .filter(Boolean)
  const unlocks = allNodes
    .filter((candidate) => candidate.data.prerequisiteIds.includes(node.id))
    .map((candidate) => candidate.data.name)

  return (
    <aside className="editor" aria-label="Skill editor">
      <div className="editor-heading">
        <span className="eyebrow">Selected skill</span>
        <span className={`status-pill status-pill--${node.data.status}`}>{statusLabel(node.data.status)}</span>
      </div>

      <label>
        Skill Name
        <input
          aria-label="Skill Name"
          value={node.data.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
        />
      </label>

      <label>
        Description
        <textarea
          aria-label="Description"
          value={node.data.description}
          rows={4}
          placeholder="What does this skill represent?"
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </label>

      <div className="level-section">
        <span>Level</span>
        <div className="level-control">
          <button
            type="button"
            aria-label="Decrease level"
            disabled={node.data.level <= 0}
            onClick={() => onUpdate({ level: node.data.level - 1 })}
          >−</button>
          <strong>{node.data.level} / {node.data.maxLevel}</strong>
          <button
            type="button"
            aria-label="Increase level"
            disabled={node.data.level >= node.data.maxLevel || node.data.status === 'locked'}
            onClick={() => onUpdate({ level: node.data.level + 1 })}
          >+</button>
        </div>
      </div>

      <label>
        Max Level
        <input
          aria-label="Max Level"
          type="number"
          min={1}
          value={node.data.maxLevel}
          onChange={(event) => onUpdate({ maxLevel: Number(event.target.value) || 1 })}
        />
      </label>

      <div className="relations">
        <RelationList title="Prerequisites" items={prerequisites as string[]} />
        <RelationList title="Unlocks" items={unlocks} />
      </div>

      <div className="editor-actions">
        <button
          type="button"
          className="primary-button"
          disabled={node.data.status === 'locked' || node.data.status === 'completed'}
          onClick={onComplete}
        >Complete Skill</button>
        <button type="button" className="danger-button" onClick={onDelete}>Delete Skill</button>
      </div>
    </aside>
  )
}

const RelationList = ({ title, items }: { title: string; items: string[] }) => (
  <section>
    <h3>{title}</h3>
    {items.length > 0 ? (
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    ) : <p>None</p>}
  </section>
)
