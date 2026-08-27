import type { SignupField } from '../../../activities/model/signupFields';
import type { ActivityScheduleType, ActivitySession } from '../../../activities/model/activitySchedule';
import { SignupForm } from '../components/SignupForm';

export function PcSignupModal({
  title,
  types,
  fields,
  scheduleType,
  sessions,
  signupStartAt,
  signupEndAt,
  signupHoursBefore,
  initialAnswers,
  mode = 'create',
  onCancel,
  onConfirm,
}: {
  title: string;
  types: string[];
  fields: SignupField[];
  scheduleType?: ActivityScheduleType;
  sessions?: ActivitySession[];
  signupStartAt?: string;
  signupEndAt?: string;
  signupHoursBefore?: number;
  initialAnswers?: Record<string, string>;
  mode?: 'create' | 'adjust';
  onCancel: () => void;
  onConfirm: (type: string, answers: Record<string, string>) => void;
}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal c-signup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-signup-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="pc-signup-heading" className="c-signup-page-heading">
          {mode === 'adjust' ? '调整报名' : '填写报名信息'}
        </h2>
        <p className="c-signup-page-title">{title}</p>
        <SignupForm
          types={types}
          fields={fields}
          scheduleType={scheduleType}
          sessions={sessions}
          signupStartAt={signupStartAt}
          signupEndAt={signupEndAt}
          signupHoursBefore={signupHoursBefore}
          initialAnswers={initialAnswers}
          mode={mode}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
}
