import { formatActivityTime, type Activity } from '../../../activities/model/activity';
import { signupLimit } from '../model/clientActivity';

export function ActivityDetailFacts({
  activity,
  occupied,
}: {
  activity: Activity;
  occupied: number;
}) {
  const limit = signupLimit(activity);
  return (
    <div className="c-meta c-detail-facts">
      <div>类型：{activity.type}</div>
      <div>分类：{activity.category}</div>
      <div>活动时间：{formatActivityTime(activity)}</div>
      <div>
        报名时间：{activity.signupStartAt} ~ {activity.signupEndAt}
      </div>
      <div>地点：{activity.location}</div>
      <div>发起人：{activity.organizer}</div>
      <div>
        联系电话：
        <a className="c-detail-phone" href={`tel:${activity.phone}`}>
          {activity.phone}
        </a>
      </div>
      <div>
        总名额：{limit !== undefined ? `${limit} 人` : '不限'}
        <span className="c-detail-kv-gap">已报名 {occupied} 人</span>
      </div>
    </div>
  );
}
