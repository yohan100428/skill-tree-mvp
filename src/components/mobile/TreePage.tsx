import type { SkillNode, TreeCategory } from '../../types/skillTree'
import { MobileSkillTree } from './MobileSkillTree'

interface TreePageProps {
  categories: TreeCategory[]
  skills: SkillNode[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
  onSelectSkill: (skillId: string) => void
}

export const TreePage = ({
  categories,
  skills,
  selectedCategoryId,
  onSelectCategory,
  onSelectSkill,
}: TreePageProps) => {
  const category = categories.find((candidate) => candidate.id === selectedCategoryId) ?? categories[0]

  return (
    <div className="page tree-page">
      <section className="page-intro page-intro--compact">
        <span className="eyebrow">YOUR GROWTH MAP</span>
        <h1>TREE</h1>
      </section>
      {categories.length > 0 ? (
        <>
          <div className="tree-tabs" role="tablist" aria-label="Tree selection">
            {categories.map((candidate) => (
              <button
                type="button"
                role="tab"
                aria-selected={candidate.id === category.id}
                onClick={() => onSelectCategory(candidate.id)}
                key={candidate.id}
              >{candidate.name}</button>
            ))}
          </div>
          <div className="tree-balance"><span>{category.coinName}</span><strong>{category.coins}</strong></div>
          <MobileSkillTree
            category={category}
            skills={skills.filter((skill) => skill.data.categoryId === category.id)}
            onSelectSkill={onSelectSkill}
          />
        </>
      ) : (
        <section className="empty-state"><strong>아직 Tree가 없어요</strong><p>+ 버튼으로 첫 Tree를 만들어 보세요.</p></section>
      )}
    </div>
  )
}
