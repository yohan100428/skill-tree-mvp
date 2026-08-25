import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, NodeTypes } from '@xyflow/react'
import type { SkillMap, SkillNode as SkillNodeType } from '../types/skillTree'
import { SkillNode } from './SkillNode'

const nodeTypes: NodeTypes = { skill: SkillNode }

interface SkillTreeCanvasProps {
  map: SkillMap
  ariaLabel?: string
  onNodesChange: (changes: NodeChange<SkillNodeType>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onSelectSkill: (skillId: string) => void
}

export const SkillTreeCanvas = ({ map, ariaLabel = 'Skill map canvas', onNodesChange, onEdgesChange, onConnect, onSelectSkill }: SkillTreeCanvasProps) => (
  <section className="canvas tree-canvas" aria-label={ariaLabel}>
    <ReactFlow<SkillNodeType>
      nodes={map.nodes}
      edges={map.edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onSelectSkill(node.id)}
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
          const status = (node as SkillNodeType).data.status
          return status === 'unlocked' ? '#5eead4' : status === 'locked' ? '#475569' : '#60a5fa'
        }}
        maskColor="rgba(2, 6, 23, 0.72)"
      />
    </ReactFlow>
    {map.nodes.length === 0 && (
      <div className="empty-canvas"><strong>이 Tree는 아직 비어 있어요.</strong><span>+ 버튼으로 첫 Skill을 만들어 보세요.</span></div>
    )}
  </section>
)
