import type { Activity, ActivityStatus } from '../../../activities/model/activity';
import { activityScheduleTypeLabels, type ActivityScheduleType } from '../../../activities/model/activitySchedule';
import { getLikedBy } from '../model/engagementStore';
import { IconLike } from './Icons';

const LABELS: Record<ActivityStatus, string> = {
  未开始: '未开始',
  进行中: '进行中',
  已结束: '已结束',
};

const CLASS_MAP: Record<ActivityStatus, string> = {
  未开始: 'is-upcoming',
  进行中: 'is-ongoing',
  已结束: 'is-ended',
};

export function StatusPill({ status }: { status: ActivityStatus }) {
  return <span className={`c-pill ${CLASS_MAP[status]}`}>{LABELS[status]}</span>;
}

export function CategoryPill({ category }: { category: string }) {
  const label = category.trim();
  if (!label) return null;
  return <span className="c-pill is-category">{label}</span>;
}

export function SchedulePill({ scheduleType }: { scheduleType?: ActivityScheduleType }) {
  return <span className="c-pill is-format">{activityScheduleTypeLabels[scheduleType ?? 'once']}</span>;
}

export function ActivityCoverOverlay({
  activity,
  title,
  variant = 'detail',
}: {
  activity: Pick<Activity, 'id' | 'activityStatus' | 'category' | 'scheduleType' | 'pinned' | 'title'>;
  title?: string;
  variant?: 'home' | 'detail';
}) {
  const heading = title ?? activity.title;
  if (variant === 'home') {
    return (
      <>
        <div className="c-cover-badges">
          {activity.pinned ? <span className="c-pill is-pin">置顶</span> : null}
          <StatusPill status={activity.activityStatus} />
          <CategoryPill category={activity.category} />
        </div>
        <div className="c-cover-badges is-end">
          <SchedulePill scheduleType={activity.scheduleType} />
        </div>
        {heading ? <div className="c-cover-title">{heading}</div> : null}
        <div className="c-cover-likes">
          <IconLike />
          <span>{getLikedBy(activity.id).length}</span>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="c-cover-badges">
        <StatusPill status={activity.activityStatus} />
        {activity.pinned ? <span className="c-pill is-pin">置顶</span> : null}
        <SchedulePill scheduleType={activity.scheduleType} />
        <CategoryPill category={activity.category} />
      </div>
      {heading ? <div className="c-cover-title">{heading}</div> : null}
    </>
  );
}
