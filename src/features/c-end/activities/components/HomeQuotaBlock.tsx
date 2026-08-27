import type { Activity } from '../../../activities/model/activity';
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
}: {
  activity: Activity;
  ctaLabel: string;
  ctaEnabled: boolean;
  signedUp?: boolean;
}) {
  useRelated('signups', activity.id);
  const limit = signupLimit(activity);
  const occupied = signupOccupiedCount(activity.id);
  const preview = approvedSignupPeople(activity.id).slice(0, HOME_AVATAR_LIMIT);
  const remaining = limit === undefined ? undefined : Math.max(0, limit - occupied);
  const percent = limit ? Math.min(100, (occupied / limit) * 100) : 0;

  return (
    <div className="c-home-quota">
      <div className="c-home-quota-row">
        <span>{limit === undefined ? `已报名${occupied}` : `已报名${occupied}/${limit}`}</span>
        {remaining !== undefined ? <span className="c-home-quota-left">余{remaining}位</span> : null}
      </div>
      {limit !== undefined ? (
        <div className="c-home-quota-bar" aria-hidden>
          <span style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      <div className="c-home-quota-foot">
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
        <span className={actionClass(ctaEnabled, signedUp)}>{ctaLabel}</span>
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
