import { BottomSheet } from './BottomSheet'

export type AddKind = 'quest' | 'skill' | 'tree'

interface AddActionSheetProps {
  hasTrees: boolean
  onClose: () => void
  onChoose: (kind: AddKind) => void
}

export const AddActionSheet = ({ hasTrees, onClose, onChoose }: AddActionSheetProps) => (
  <BottomSheet titleId="add-sheet-title" onClose={onClose}>
    <div className="action-sheet-content">
      <h2 id="add-sheet-title">무엇을 추가할까요?</h2>
      {!hasTrees && <p className="action-sheet-hint">먼저 Tree를 만들어 주세요.</p>}
      {hasTrees && (
        <>
          <button type="button" aria-label="Daily Quest" onClick={() => onChoose('quest')}><span>＋</span><strong>Daily Quest</strong></button>
          <button type="button" aria-label="Skill" onClick={() => onChoose('skill')}><span>◆</span><strong>Skill</strong></button>
        </>
      )}
      <button type="button" aria-label="Tree" onClick={() => onChoose('tree')}><span>🌿</span><strong>Tree</strong></button>
    </div>
  </BottomSheet>
)
