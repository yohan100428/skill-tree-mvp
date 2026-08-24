import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNode as SkillNodeType } from '../types/skillTree'

const STATUS_LABELS = {
  locked: 'LOCKED',
  available: 'AVAILABLE',
  'in-progress': 'IN PROGRESS',
  completed: 'COMPLETED',
} as const

export const SkillNode = ({ id, data, selected }: NodeProps<SkillNodeType>) => (
  <article
    className={`skill-node skill-node--${data.status}${selected ? ' skill-node--selected' : ''}`}
    data-testid={`skill-node-${id}`}
  >
    <Handle type="target" position={Position.Top} className="skill-handle" />
    <strong>{data.name || 'Untitled Skill'}</strong>
    <span>Lv. {data.level}/{data.maxLevel}</span>
    <small>{STATUS_LABELS[data.status]}</small>
    <Handle type="source" position={Position.Bottom} className="skill-handle" />
  </article>
)
