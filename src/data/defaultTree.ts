import type { SkillEdge, SkillNode, WorkspaceData } from '../types/skillTree'
import { recalculateTree } from '../utils/skillLogic'

const demoNode = (
  id: string,
  name: string,
  x: number,
  y: number,
  prerequisiteIds: string[] = [],
): SkillNode => ({
  id,
  type: 'skill',
  position: { x, y },
  data: {
    id,
    name,
    description: '',
    level: 0,
    maxLevel: 1,
    status: prerequisiteIds.length ? 'locked' : 'available',
    prerequisiteIds,
  },
})

const demoEdge = (source: string, target: string): SkillEdge => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smoothstep',
  animated: true,
})

export const createDefaultWorkspace = (): WorkspaceData => {
  const nodes = [
    demoNode('engineering', 'Engineering', 360, 20),
    demoNode('cad', 'CAD', 190, 170, ['engineering']),
    demoNode('electronics', 'Electronics', 530, 170, ['engineering']),
    demoNode('autocad', 'AutoCAD', 80, 320, ['cad']),
    demoNode('inventor', 'Inventor', 300, 320, ['cad']),
    demoNode('arduino', 'Arduino', 530, 320, ['electronics']),
  ]
  const edges = [
    demoEdge('engineering', 'cad'),
    demoEdge('engineering', 'electronics'),
    demoEdge('cad', 'autocad'),
    demoEdge('cad', 'inventor'),
    demoEdge('electronics', 'arduino'),
  ]

  return {
    version: 1,
    activeTreeId: 'engineering-tree',
    trees: [
      recalculateTree({ id: 'engineering-tree', name: 'Engineering', nodes, edges }),
    ],
  }
}
