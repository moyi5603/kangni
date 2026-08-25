import { formatActivityTime, type Activity } from '../../../activities/model/activity';
import { formatPcDateTimeRange, signupLimit } from '../model/clientActivity';

export function ActivityDetailFacts({
  activity,
  occupied,
  omitCurrentYear = false,
  hideQuota = false,
}: {
  activity: Activity;
  occupied: number;
  omitCurrentYear?: boolean;
  hideQuota?: boolean;
}) {
  const limit = signupLimit(activity);
  const activityTime = omitCurrentYear
    ? formatPcDateTimeRange(activity.startAt, activity.endAt)
    : formatActivityTime(activity);
  const signupTime = omitCurrentYear
    ? formatPcDateTimeRange(activity.signupStartAt, activity.signupEndAt)
    : `${activity.signupStartAt} ~ ${activity.signupEndAt}`;
  return (
    <div className="c-meta c-detail-facts">
      <div>分类：{activity.category}</div>
      <div>活动时间：{activityTime}</div>
      <div>报名时间：{signupTime}</div>
      <div>地点：{activity.location}</div>
      <div>发起人：{activity.organizer}</div>
      <div>
        联系电话：
        <a className="c-detail-phone" href={`tel:${activity.phone}`}>
          {activity.phone}
        </a>
      </div>
      {hideQuota ? null : (
        <div>
          总名额：{limit !== undefined ? `${limit} 人` : '不限'}
          <span className="c-detail-kv-gap">已报名 {occupied} 人</span>
        </div>
      )}
    </div>
  );
}
