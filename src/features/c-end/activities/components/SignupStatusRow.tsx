import type { ActivityStatus } from '../../../activities/model/activity';
import type { ClientSignupStatus } from '../model/signupStore';
import { StatusPill } from './StatusPill';

const AUDIT_CLASS: Record<ClientSignupStatus, string> = {
  待审核: 'is-audit-pending',
  已通过: 'is-audit-passed',
  已驳回: 'is-audit-rejected',
};

function AuditPill({ status }: { status: ClientSignupStatus }) {
  return <span className={`c-pill ${AUDIT_CLASS[status]}`}>{status}</span>;
}

export function SignupStatusRow({
  activityStatus,
  auditStatus,
}: {
  activityStatus?: ActivityStatus;
  auditStatus?: ClientSignupStatus;
}) {
  return (
    <div className="c-signup-status-row">
      {activityStatus ? <StatusPill status={activityStatus} /> : null}
      {auditStatus ? <AuditPill status={auditStatus} /> : null}
    </div>
  );
}
