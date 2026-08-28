import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { CategoryNode as CategoryNodeType } from '../types/skillTree'

export const CategoryNode = ({ data }: NodeProps<CategoryNodeType>) => (
  <article className="category-node" data-testid={`category-node-${data.categoryId}`}>
    <Handle type="target" position={Position.Top} isConnectable={false} className="branch-handle" />
    <small>CATEGORY</small>
    <strong>{data.name}</strong>
    <Handle type="source" position={Position.Bottom} isConnectable={false} className="branch-handle" />
  </article>
)
