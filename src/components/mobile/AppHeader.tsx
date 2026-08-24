interface AppHeaderProps {
  onOpenSettings: () => void
}

export const AppHeader = ({ onOpenSettings }: AppHeaderProps) => (
  <header className="mobile-header">
    <strong>MY TREE</strong>
    <button type="button" className="icon-action" aria-label="Open settings" onClick={onOpenSettings}>⚙</button>
  </header>
)
