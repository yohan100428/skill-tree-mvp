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
}

export const TreePage = ({
  categories,
  workspace,
  onSelectSkill,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: TreePageProps) => {
  const map = buildPersonalTree(workspace)

  return (
    <div className="page tree-page">
      <section className="page-intro page-intro--compact">
        <span className="eyebrow">YOUR GROWTH MAP</span>
        <h1>TREE</h1>
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
