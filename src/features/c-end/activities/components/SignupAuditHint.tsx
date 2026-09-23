import type { Activity } from '../../../activities/model/activity';
import { currentSignupAudit, signupAuditText, type SignupAuditView } from '../model/signupAudit';
import { useRelated } from '../../../activities/model/related';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

export function useSignupAuditView(activity: Activity): SignupAuditView | undefined {
  const signups = useRelated('signups', activity.id);
  const mine = signups.find(
    (item) => (item.accountPhone ?? item.phone) === DEMO_SIGNUP_USER.phone && item.status === '待审核',
  );
  return currentSignupAudit(activity, mine);
}

export function SignupAuditHint({ activity }: { activity: Activity }) {
  const view = useSignupAuditView(activity);
  if (!view) return null;
  return (
    <div className="c-signup-audit-bar" role="status">
      {signupAuditText(view)}
    </div>
  );
}
