import type { ReactNode } from 'react'

interface BottomSheetProps {
  titleId: string
  onClose: () => void
  children: ReactNode
}

export const BottomSheet = ({ titleId, onClose, children }: BottomSheetProps) => (
  <div className="sheet-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="sheet-handle" aria-hidden="true" />
      <button type="button" className="sheet-close" aria-label="닫기" onClick={onClose}>×</button>
      {children}
    </section>
  </div>
)
