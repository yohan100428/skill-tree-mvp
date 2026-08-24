import type { SkillTree } from '../types/skillTree'

interface TreeSidebarProps {
  trees: SkillTree[]
  activeTreeId: string
  onSelect: (treeId: string) => void
  onAdd: () => void
  onDelete: (treeId: string) => void
}

export const TreeSidebar = ({ trees, activeTreeId, onSelect, onAdd, onDelete }: TreeSidebarProps) => (
  <aside className="sidebar">
    <div className="brand">
      <span className="brand-mark">ST</span>
      <div><strong>Skill Tree</strong><small>Personal growth map</small></div>
    </div>
    <h2>My Trees</h2>
    <nav aria-label="Skill trees">
      {trees.map((tree) => (
        <div className={`tree-row${tree.id === activeTreeId ? ' tree-row--active' : ''}`} key={tree.id}>
          <button type="button" className="tree-select" onClick={() => onSelect(tree.id)}>{tree.name || 'Untitled Tree'}</button>
          <button type="button" className="icon-button" aria-label={`Delete ${tree.name || 'tree'}`} onClick={() => onDelete(tree.id)}>×</button>
        </div>
      ))}
    </nav>
    <button type="button" className="new-tree-button" onClick={onAdd}>+ New Tree</button>
    <div className="sidebar-help">
      <strong>Connect skills</strong>
      <p>Drag from the bottom handle of a prerequisite to the top handle of a dependent skill.</p>
    </div>
  </aside>
)
