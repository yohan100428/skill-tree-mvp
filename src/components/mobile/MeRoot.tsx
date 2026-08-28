import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { MeNode } from '../../types/skillTree'

export const MeRoot = ({ data }: NodeProps<MeNode>) => (
  <article className="me-root" data-testid="me-root">
    <div className="me-avatar" aria-hidden="true">{Array.from(data.label.trim())[0] ?? 'M'}</div>
    <strong>{data.label}</strong>
    <span>YOUR CHARACTER</span>
    <Handle type="source" position={Position.Bottom} isConnectable={false} className="branch-handle" />
  </article>
)
