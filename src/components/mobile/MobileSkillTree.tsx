import type { SkillNode, TreeCategory } from '../../types/skillTree'
import { groupSkillsByDepth } from '../../utils/mobileTree'

interface MobileSkillTreeProps {
  category: TreeCategory
  skills: SkillNode[]
  onSelectSkill: (skillId: string) => void
}

export const MobileSkillTree = ({ category, skills, onSelectSkill }: MobileSkillTreeProps) => {
  if (skills.length === 0) {
    return <section className="empty-state"><strong>이 Tree에는 아직 Skill이 없어요</strong><p>+ 버튼으로 첫 Skill을 만들어 보세요.</p></section>
  }

  const levels = groupSkillsByDepth(skills)
  return (
    <section className="mobile-skill-tree" aria-label={`${category.name} skill tree`}>
      {levels.map((level, depth) => (
        <div className="skill-level" data-depth={depth} key={depth}>
          {depth > 0 && <span className="level-connector" aria-hidden="true" />}
          <div className="skill-level__nodes">
            {level.map((skill) => (
              <button
                type="button"
                className={`mobile-skill-node mobile-skill-node--${skill.data.status}`}
                aria-label={`${skill.data.name} ${skill.data.status}`}
                onClick={() => onSelectSkill(skill.id)}
                key={skill.id}
              >
                <span className="skill-orb" aria-hidden="true">
                  {skill.data.status === 'available' ? '◉' : skill.data.status === 'unlocked' ? '●' : '○'}
                </span>
                <strong>{skill.data.name || '이름 없는 Skill'}</strong>
                <small>
                  {skill.data.status === 'locked'
                    ? `${category.coins} / ${skill.data.requiredCoins}`
                    : skill.data.status.toUpperCase()}
                </small>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
