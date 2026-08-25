import type { Activity } from '../../../activities/model/activity';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconUser } from '../components/Icons';
import { SocialRow } from '../components/SocialRow';
import { StatusPill } from '../components/StatusPill';
import { formatShortActivityDate, signupCta, signupLimit, toClientActivity } from '../model/clientActivity';

export type ActivityCardProps = {
  activity: Activity;
  signedUp?: boolean;
  onOpen: () => void;
};

function ActivityCover({ activity, className }: { activity: Activity; className: string }) {
  return (
    <div className={className}>
      <span className="c-cover-fallback" aria-hidden />
      {activity.coverUrl ? (
        <img
          src={activity.coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
      <span className="c-cover-type">{activity.category}</span>
    </div>
  );
}

function activityCardLabel(activity: Activity, action: string, limit: number | undefined): string {
  const parts = [
    activity.title,
    activity.category,
    activity.activityStatus,
    `日期 ${formatShortActivityDate(activity)}`,
    `地点 ${activity.location}`,
    action,
  ];
  if (limit !== undefined) parts.push(`限额 ${limit} 人`);
  return parts.join('，');
}

function actionClass(enabled: boolean, signedUp: boolean): string {
  if (signedUp) return 'c-card-action is-signed';
  return `c-card-action${enabled ? '' : ' is-disabled'}`;
}

export function H5ActivityListCard({ activity, signedUp = false, onOpen }: ActivityCardProps) {
  const limit = signupLimit(activity);
  const cta = signupCta(activity, Boolean(signedUp));

  return (
    <button
      className="c-list-card c-h5-card-button"
      type="button"
      aria-label={activityCardLabel(activity, cta.label, limit)}
      onClick={onOpen}
    >
      <ActivityCover activity={activity} className="c-cover c-list-cover c-cover-16x9" />
      <div className="c-list-copy">
        <div className="c-title-row">
          <div className="c-card-title">{activity.title}</div>
          {activity.pinned ? <span className="c-pin">置顶</span> : null}
        </div>
        <ActivityMeta activity={activity} compact />
        {limit !== undefined ? (
          <div className="c-signup-limit">
            <IconUser />
            <span>限额 {limit} 人</span>
          </div>
        ) : null}
        <SocialRow activity={toClientActivity(activity)} />
        <div className="c-list-foot">
          <StatusPill status={activity.activityStatus} />
          <span className={actionClass(cta.enabled, Boolean(signedUp))}>{cta.label}</span>
        </div>
      </div>
    </button>
  );
}
