import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNode as SkillNodeType } from '../types/skillTree'

export const SkillNode = ({ id, data, selected }: NodeProps<SkillNodeType>) => (
  <article
    className={`skill-node${selected ? ' skill-node--selected' : ''}`}
    data-testid={`skill-node-${id}`}
  >
    <Handle type="target" position={Position.Top} className="skill-handle" />
    <small>SKILL</small>
    <strong>{data.name || 'Untitled Skill'}</strong>
    <Handle type="source" position={Position.Bottom} className="skill-handle" />
  </article>
)
