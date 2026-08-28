import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { FinalGoalNode as FinalGoalNodeType } from '../types/skillTree'

export const FinalGoalNode = ({ data }: NodeProps<FinalGoalNodeType>) => (
  <article className="final-goal-node" data-testid={`final-goal-node-${data.categoryId}`}>
    <Handle type="target" position={Position.Top} isConnectable={false} className="branch-handle" />
    <small>FINAL GOAL</small>
    <strong>{data.label}</strong>
  </article>
)
