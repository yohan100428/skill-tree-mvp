import { describe, expect, it } from 'vitest'
import type { SkillNode } from '../types/skillTree'
import { getSkillDepths, groupSkillsByDepth } from './mobileTree'

const node = (id: string, prerequisiteIds: string[] = []): SkillNode => ({
  id,
  type: 'skill',
  position: { x: 999, y: -999 },
  data: {
    id,
    name: id,
    description: '',
    categoryId: 'fitness',
    prerequisiteIds,
  },
})

describe('mobile skill tree layout', () => {
  it('groups a branching graph by prerequisite depth without using positions', () => {
    const nodes = [node('root'), node('strength', ['root']), node('run', ['root']), node('month', ['strength', 'run'])]

    expect([...getSkillDepths(nodes)]).toEqual([
      ['root', 0],
      ['strength', 1],
      ['run', 1],
      ['month', 2],
    ])
    expect(groupSkillsByDepth(nodes).map((level) => level.map((skill) => skill.id)))
      .toEqual([['root'], ['strength', 'run'], ['month']])
  })

  it('treats a prerequisite outside the selected Tree as a root in this view', () => {
    const nodes = [node('local', ['skill-from-another-tree'])]

    expect(getSkillDepths(nodes).get('local')).toBe(0)
  })
})
