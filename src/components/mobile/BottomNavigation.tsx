export type MobilePage = 'today' | 'tree'

interface BottomNavigationProps {
  page: MobilePage
  onNavigate: (page: MobilePage) => void
  onAdd: () => void
}

export const BottomNavigation = ({ page, onNavigate, onAdd }: BottomNavigationProps) => (
  <nav className="bottom-navigation" aria-label="Main navigation">
    <button type="button" className={page === 'today' ? 'is-active' : ''} onClick={() => onNavigate('today')}>Today</button>
    <button type="button" className={page === 'tree' ? 'is-active' : ''} onClick={() => onNavigate('tree')}>Tree</button>
    <button type="button" className="add-navigation" aria-label="Add" onClick={onAdd}>+</button>
  </nav>
)
