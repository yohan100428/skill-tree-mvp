import { useEffect, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, NodeTypes } from '@xyflow/react'
import type { PersonalTreeMap, PersonalTreeNode, SkillNode as SkillNodeType } from '../types/skillTree'
import { CategoryNode } from './CategoryNode'
import { FinalGoalNode } from './FinalGoalNode'
import { SkillNode } from './SkillNode'
import { MeRoot } from './mobile/MeRoot'

const nodeTypes: NodeTypes = { me: MeRoot, category: CategoryNode, finalGoal: FinalGoalNode, skill: SkillNode }

interface SkillTreeCanvasProps {
  map: PersonalTreeMap
  ariaLabel?: string
  onNodesChange: (changes: NodeChange<SkillNodeType>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onSelectSkill: (skillId: string) => void
}

const SkillTreeCanvasInner = ({ map, ariaLabel = 'Skill map canvas', onNodesChange, onEdgesChange, onConnect, onSelectSkill }: SkillTreeCanvasProps) => {
  const { fitBounds } = useReactFlow()
  const nodeSignature = useMemo(() => map.nodes.map((node) => node.id).join('\u0000'), [map.nodes])
  const treeBounds = useMemo(() => {
    const left = Math.min(...map.nodes.map((node) => node.position.x))
    const top = Math.min(...map.nodes.map((node) => node.position.y))
    const right = Math.max(...map.nodes.map((node) => node.position.x + (node.initialWidth ?? 1)))
    const bottom = Math.max(...map.nodes.map((node) => node.position.y + (node.initialHeight ?? 1)))
    const root = map.nodes.find((node) => node.type === 'me') ?? map.nodes[0]
    const rootCenterX = root.position.x + (root.initialWidth ?? 1) / 2
    const rootCenterY = root.position.y + (root.initialHeight ?? 1) / 2
    const radiusX = Math.max(rootCenterX - left, right - rootCenterX)
    const radiusY = Math.max(rootCenterY - top, bottom - rootCenterY)
    return {
      x: rootCenterX - radiusX,
      y: rootCenterY - radiusY,
      width: radiusX * 2,
      height: radiusY * 2,
    }
  }, [nodeSignature])
  const skillIds = new Set(map.nodes.filter((node) => node.type === 'skill').map((node) => node.id))
  const dependencyEdgeIds = new Set(map.edges
    .filter((edge) => !edge.id.startsWith('personal-edge:'))
    .map((edge) => edge.id))

  useEffect(() => {
    let fitFrame = 0
    const renderFrame = requestAnimationFrame(() => {
      fitFrame = requestAnimationFrame(() => {
        void fitBounds(treeBounds, { padding: 0.2, duration: 180 })
      })
    })
    return () => {
      cancelAnimationFrame(renderFrame)
      cancelAnimationFrame(fitFrame)
    }
  }, [fitBounds, nodeSignature, treeBounds])

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
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={1}
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
          if (node.type === 'finalGoal') return '#fbbf24'
          return '#60a5fa'
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

export const SkillTreeCanvas = (props: SkillTreeCanvasProps) => (
  <ReactFlowProvider>
    <SkillTreeCanvasInner {...props} />
  </ReactFlowProvider>
)
