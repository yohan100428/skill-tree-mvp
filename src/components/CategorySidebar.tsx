import { useState } from 'react'
import type { TreeCategory } from '../types/skillTree'

interface CategorySidebarProps {
  categories: TreeCategory[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string) => void
  onAdd: (name: string, coinName: string) => void
  onDelete: (categoryId: string) => void
  children: React.ReactNode
}

export const CategorySidebar = ({ categories, selectedCategoryId, onSelect, onAdd, onDelete, children }: CategorySidebarProps) => {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [coinName, setCoinName] = useState('')

  const create = () => {
    onAdd(name, coinName)
    setName('')
    setCoinName('')
    setAdding(false)
  }

  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">ST</span><div><strong>My Tree</strong><small>Quest-powered growth</small></div></div>
      <h2>Categories</h2>
      <nav aria-label="Tree categories">
        {categories.map((category) => (
          <div className={`category-row${category.id === selectedCategoryId ? ' category-row--active' : ''}`} key={category.id}>
            <button type="button" className="category-select" aria-label={`${category.name} category`} onClick={() => onSelect(category.id)}>
              <strong>{category.name || 'Untitled Category'}</strong>
              <small data-testid={`category-balance-${category.id}`}>{category.coinName}: {category.coins}</small>
            </button>
            <button type="button" className="icon-button" aria-label={`Delete category ${category.name}`} onClick={() => onDelete(category.id)}>×</button>
          </div>
        ))}
      </nav>
      {adding ? (
        <div className="category-create">
          <input aria-label="New Category Name" placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} />
          <input aria-label="New Coin Name" placeholder="Coin name (optional)" value={coinName} onChange={(event) => setCoinName(event.target.value)} />
          <div><button type="button" className="primary-button" onClick={create}>Create Category</button><button type="button" onClick={() => setAdding(false)}>Cancel</button></div>
        </div>
      ) : <button type="button" className="new-category-button" aria-label="Add Category" onClick={() => setAdding(true)}>+ CATEGORY</button>}
      {children}
      <div className="sidebar-help"><strong>Connect skills</strong><p>Drag from a prerequisite's bottom handle to its dependent skill.</p></div>
    </aside>
  )
}
