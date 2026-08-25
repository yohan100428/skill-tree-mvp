import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, NodeTypes } from '@xyflow/react'
import type { PersonalTreeMap, PersonalTreeNode, SkillNode as SkillNodeType } from '../types/skillTree'
import { CategoryNode } from './CategoryNode'
import { SkillNode } from './SkillNode'
import { MeRoot } from './mobile/MeRoot'

const nodeTypes: NodeTypes = { me: MeRoot, category: CategoryNode, skill: SkillNode }

interface SkillTreeCanvasProps {
  map: PersonalTreeMap
  ariaLabel?: string
  onNodesChange: (changes: NodeChange<SkillNodeType>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onSelectSkill: (skillId: string) => void
}

export const SkillTreeCanvas = ({ map, ariaLabel = 'Skill map canvas', onNodesChange, onEdgesChange, onConnect, onSelectSkill }: SkillTreeCanvasProps) => {
  const skillIds = new Set(map.nodes.filter((node) => node.type === 'skill').map((node) => node.id))
  const dependencyEdgeIds = new Set(map.edges
    .filter((edge) => !edge.id.startsWith('personal-edge:'))
    .map((edge) => edge.id))

  return (
  <section className="canvas tree-canvas" aria-label={ariaLabel}>
    <ReactFlow<PersonalTreeNode>
      nodes={map.nodes}
      edges={map.edges}
      nodeTypes={nodeTypes}
      onNodesChange={(changes) => onNodesChange(
        changes.filter((change) => skillIds.has(
          change.type === 'add' ? change.item.id : change.id,
        )) as NodeChange<SkillNodeType>[],
      )}
      onEdgesChange={(changes) => onEdgesChange(changes.filter((change) => dependencyEdgeIds.has(
        change.type === 'add' ? change.item.id : change.id,
      )))}
      onConnect={onConnect}
      onNodeClick={(_, node) => { if (node.type === 'skill') onSelectSkill(node.id) }}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      deleteKeyCode={['Backspace', 'Delete']}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#334155" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node) => {
          if (node.type === 'me') return '#8be0c5'
          if (node.type === 'category') return '#a78bfa'
          const status = (node as SkillNodeType).data.status
          return status === 'unlocked' ? '#5eead4' : status === 'locked' ? '#475569' : '#60a5fa'
        }}
        maskColor="rgba(2, 6, 23, 0.72)"
      />
    </ReactFlow>
    {map.nodes.length === 1 && (
      <div className="empty-canvas"><strong>ME에서 첫 가지를 시작해 보세요.</strong><span>+ 버튼으로 카테고리를 만들 수 있어요.</span></div>
    )}
  </section>
  )
}
