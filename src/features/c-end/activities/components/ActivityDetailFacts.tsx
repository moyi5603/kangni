import { formatActivityTime, formatActivitySignupTime, type Activity } from '../../../activities/model/activity';
import { clientQuotaLabel, needsSessionPick } from '../../../activities/model/activitySchedule';
import { formatCEndDateTimeInText, formatCEndDateTimeRange } from '../../formatDateTime';
import { signupLimit } from '../model/clientActivity';

export function ActivityQuotaLine({ activity }: { activity: Activity }) {
  const limit = signupLimit(activity);
  return (
    <div className="c-quota-line" aria-label="报名名额">
      {clientQuotaLabel(activity.scheduleType)}：{limit !== undefined ? `${limit} 人` : '不限'}
    </div>
  );
}

export function ActivityDetailFacts({
  activity,
  hideQuota = false,
}: {
  activity: Activity;
  hideQuota?: boolean;
}) {
  const activityTime =
    (activity.scheduleType ?? 'once') === 'once'
      ? formatCEndDateTimeRange(activity.startAt, activity.endAt)
      : formatCEndDateTimeInText(formatActivityTime(activity));
  const signupTime = needsSessionPick(activity.scheduleType)
    ? formatCEndDateTimeInText(formatActivitySignupTime(activity))
    : formatCEndDateTimeRange(activity.signupStartAt, activity.signupEndAt);
  return (
    <div className="c-meta c-detail-facts">
      <div>活动时间：{activityTime}</div>
      <div>报名时间：{signupTime}</div>
      <div>地点：{activity.location.trim() || '—'}</div>
      <div>发起人：{activity.organizer}</div>
      {hideQuota ? null : <ActivityQuotaLine activity={activity} />}
    </div>
  );
}
