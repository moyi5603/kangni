import type { Activity } from '../../../activities/model/activity';
import type { MomentRecord } from '../../../activities/model/moment';
import { MomentComposer } from '../components/MomentComposer';

type PcMomentModalProps = {
  activity: Activity;
  editing?: MomentRecord;
  onCancel: () => void;
  onSuccess: (message: string) => void;
};

export function PcMomentModal({ activity, editing, onCancel, onSuccess }: PcMomentModalProps) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal c-moment-modal"
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
