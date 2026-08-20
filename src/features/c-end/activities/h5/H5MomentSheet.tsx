import type { Activity } from '../../../activities/model/activity';
import type { MomentRecord } from '../../../activities/model/moment';
import { MomentComposer } from '../components/MomentComposer';

type H5MomentSheetProps = {
  activity: Activity;
  editing?: MomentRecord;
  onCancel: () => void;
  onSuccess: (message: string) => void;
};

export function H5MomentSheet({ activity, editing, onCancel, onSuccess }: H5MomentSheetProps) {
  return (
    <div className="c-sheet-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-sheet c-moment-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? '修改瞬间' : '发布瞬间'}
        onClick={(event) => event.stopPropagation()}
      >
        <MomentComposer activity={activity} editing={editing} onCancel={onCancel} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
