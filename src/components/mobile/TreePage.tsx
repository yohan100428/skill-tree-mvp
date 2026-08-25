import type { Connection, EdgeChange, NodeChange } from '@xyflow/react'
import { SkillTreeCanvas } from '../SkillTreeCanvas'
import type { SkillNode, TreeCategory, WorkspaceData } from '../../types/skillTree'
import { MeRoot } from './MeRoot'

interface TreePageProps {
  categories: TreeCategory[]
  workspace: WorkspaceData
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
  onSelectSkill: (skillId: string) => void
  onNodesChange: (changes: NodeChange<SkillNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
}

export const TreePage = ({
  categories,
  workspace,
  selectedCategoryId,
  onSelectCategory,
  onSelectSkill,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: TreePageProps) => {
  const category = categories.find((candidate) => candidate.id === selectedCategoryId) ?? categories[0]
  const nodes = category
    ? workspace.nodes.filter((skill) => skill.data.categoryId === category.id)
    : []
  const nodeIds = new Set(nodes.map((node) => node.id))
  const map = {
    nodes,
    edges: workspace.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
  }

  return (
    <div className="page tree-page">
      <section className="page-intro page-intro--compact">
        <span className="eyebrow">YOUR GROWTH MAP</span>
        <h1>TREE</h1>
      </section>
      {categories.length > 0 ? (
        <>
          <div className="tree-tabs" role="tablist" aria-label="Tree selection">
            {categories.map((candidate) => (
              <button
                type="button"
                role="tab"
                aria-selected={candidate.id === category.id}
                onClick={() => onSelectCategory(candidate.id)}
                key={candidate.id}
              >{candidate.name}</button>
            ))}
          </div>
          <div className="tree-balance"><span>{category.coinName}</span><strong>{category.coins}</strong></div>
          <SkillTreeCanvas
            key={category.id}
            map={map}
            ariaLabel={`${category.name} skill tree canvas`}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectSkill={onSelectSkill}
          />
        </>
      ) : (
        <MeRoot />
      )}
    </div>
  )
}
