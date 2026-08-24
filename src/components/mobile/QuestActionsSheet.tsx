import type { DailyQuest } from '../../types/skillTree'
import { BottomSheet } from './BottomSheet'

interface QuestActionsSheetProps {
  quest: DailyQuest
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export const QuestActionsSheet = ({ quest, onClose, onEdit, onDelete }: QuestActionsSheetProps) => (
  <BottomSheet titleId="quest-actions-title" onClose={onClose}>
    <div className="action-sheet-content">
      <span className="section-label">{quest.title}</span>
      <h2 id="quest-actions-title">Quest 관리</h2>
      <button type="button" onClick={onEdit}><strong>수정</strong></button>
      <button type="button" className="danger-action" onClick={onDelete}><strong>삭제</strong></button>
    </div>
  </BottomSheet>
)
