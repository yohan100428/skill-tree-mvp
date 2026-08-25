import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { MeNode } from '../../types/skillTree'

export const MeRoot = (_props: NodeProps<MeNode>) => (
  <article className="me-root" data-testid="me-root">
    <div className="me-avatar" aria-hidden="true">M</div>
    <strong>ME</strong>
    <span>YOUR CHARACTER</span>
    <Handle type="source" position={Position.Bottom} isConnectable={false} className="branch-handle" />
  </article>
)
