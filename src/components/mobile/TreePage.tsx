import type { Connection, EdgeChange, NodeChange } from '@xyflow/react'
import { SkillTreeCanvas } from '../SkillTreeCanvas'
import type { SkillNode, TreeCategory, WorkspaceData } from '../../types/skillTree'
import { buildPersonalTree } from '../../utils/personalTree'

interface TreePageProps {
  categories: TreeCategory[]
  workspace: WorkspaceData
  onSelectSkill: (skillId: string) => void
  onNodesChange: (changes: NodeChange<SkillNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onAddCategory: () => void
  onAddSkill: () => void
}

export const TreePage = ({
  categories,
  workspace,
  onSelectSkill,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddCategory,
  onAddSkill,
}: TreePageProps) => {
  const map = buildPersonalTree(workspace)

  return (
    <div className="page tree-page">
      <section className="page-intro page-intro--compact page-intro--actions">
        <div>
          <span className="eyebrow">YOUR GROWTH MAP</span>
          <h1>TREE</h1>
        </div>
        <div className="context-actions">
          <button type="button" className="context-add-button context-add-button--secondary" aria-label="카테고리 추가" onClick={onAddCategory}>＋ 카테고리</button>
          <button type="button" className="context-add-button" aria-label="스킬 추가" disabled={categories.length === 0} onClick={onAddSkill}>＋ 스킬</button>
        </div>
      </section>
      {categories.length > 0 && (
        <div className="tree-balance tree-balance--summary">
          <span>{categories.length} categories</span>
          <strong>{categories.reduce((total, category) => total + category.coins, 0)} Coin</strong>
        </div>
      )}
      <SkillTreeCanvas
        map={map}
        ariaLabel="ME personal skill map canvas"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectSkill={onSelectSkill}
      />
    </div>
  )
}
