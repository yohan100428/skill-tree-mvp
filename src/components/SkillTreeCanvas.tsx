import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, NodeTypes } from '@xyflow/react'
import type { SkillNode as SkillNodeType, SkillTree } from '../types/skillTree'
import { SkillNode } from './SkillNode'

const nodeTypes: NodeTypes = { skill: SkillNode }

interface SkillTreeCanvasProps {
  tree: SkillTree
  onNodesChange: (changes: NodeChange<SkillNodeType>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onSelectSkill: (skillId: string) => void
}

export const SkillTreeCanvas = ({
  tree,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectSkill,
}: SkillTreeCanvasProps) => (
  <section className="canvas" aria-label="Skill map canvas">
    <ReactFlow<SkillNodeType>
      key={tree.id}
      nodes={tree.nodes}
      edges={tree.edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onSelectSkill(node.id)}
      fitView
      fitViewOptions={{ padding: 0.25 }}
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
          return status === 'completed' ? '#5eead4' : status === 'locked' ? '#475569' : '#60a5fa'
        }}
        maskColor="rgba(2, 6, 23, 0.72)"
      />
    </ReactFlow>
    {tree.nodes.length === 0 && (
      <div className="empty-canvas">
        <strong>This tree is empty.</strong>
        <span>Add a skill to start building.</span>
      </div>
    )}
  </section>
)
