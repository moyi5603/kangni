import type { Activity } from '../../../activities/model/activity';
import { decoActivityCardFields, type DecoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { useRelated } from '../../../activities/model/related';
import {
  approvedSignupPeople,
  signupLimit,
  signupOccupiedCount,
} from '../model/clientActivity';
import { EmployeeAvatar } from './EmployeeAvatar';

const HOME_AVATAR_LIMIT = 4;

function actionClass(enabled: boolean, signedUp: boolean): string {
  if (signedUp) return 'c-card-action is-signed';
  return `c-card-action${enabled ? '' : ' is-disabled'}`;
}

export function HomeQuotaBlock({
  activity,
  ctaLabel,
  ctaEnabled,
  signedUp = false,
  compact = false,
  fields,
}: {
  activity: Activity;
  ctaLabel: string;
  ctaEnabled: boolean;
  signedUp?: boolean;
  compact?: boolean;
  fields?: Partial<DecoActivityCardFields>;
}) {
  useRelated('signups', activity.id);
  const visible = decoActivityCardFields(fields);
  if (!visible.showSignupProgress && !visible.showSignupButton) return null;
  const limit = signupLimit(activity);
  const occupied = signupOccupiedCount(activity.id);
  const preview = compact ? [] : approvedSignupPeople(activity.id).slice(0, HOME_AVATAR_LIMIT);
  const remaining = limit === undefined ? undefined : Math.max(0, limit - occupied);
  const percent = limit ? Math.min(100, (occupied / limit) * 100) : 0;
  const countLabel = limit === undefined ? `已报名${occupied}` : `已报名${occupied}/${limit}`;
  const bar =
    limit !== undefined ? (
      <div className="c-home-quota-bar" aria-hidden>
        <span style={{ width: `${percent}%` }} />
      </div>
    ) : null;
  const action = visible.showSignupButton ? (
    <span className={actionClass(ctaEnabled, signedUp)}>{ctaLabel}</span>
  ) : null;
  const progress = visible.showSignupProgress ? (
    <>
      <div className="c-home-quota-row">
        <span>{countLabel}</span>
        {remaining !== undefined ? <span className="c-home-quota-left">余{remaining}位</span> : null}
      </div>
      {bar}
    </>
  ) : null;

  if (compact) {
    return (
      <div className="c-home-quota is-side">
        <div className="c-home-quota-inline">
          {visible.showSignupProgress ? <div className="c-home-quota-progress">{progress}</div> : null}
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className="c-home-quota">
      {progress}
      <div className="c-home-quota-foot">
        {visible.showSignupProgress ? (
          <div className="c-home-quota-people">
            {preview.length > 0 ? (
              <span className="c-home-quota-avatars" aria-hidden>
                {preview.map((person) => (
                  <EmployeeAvatar key={person.id} name={person.name} />
                ))}
              </span>
            ) : null}
            <span className="c-home-quota-count">{occupied}人</span>
          </div>
        ) : (
          <span />
        )}
        {action}
      </div>
    </div>
  );
}

export function homeQuotaAriaLabel(activity: Activity): string | undefined {
  const limit = signupLimit(activity);
  const occupied = signupOccupiedCount(activity.id);
  if (limit === undefined) return `已报名 ${occupied}`;
  return `已报名 ${occupied}/${limit}`;
}
