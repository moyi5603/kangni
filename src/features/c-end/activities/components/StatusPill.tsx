import type { Activity, ActivityStatus } from '../../../activities/model/activity';
import { activityScheduleTypeLabels, type ActivityScheduleType } from '../../../activities/model/activitySchedule';
import { decoActivityCardFields, type DecoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { getLikedBy } from '../model/engagementStore';
import { IconLike } from './Icons';

const LABELS: Record<ActivityStatus, string> = {
  未开始: '未开始',
  进行中: '进行中',
  已结束: '已结束',
  已终止: '已终止',
};

const CLASS_MAP: Record<ActivityStatus, string> = {
  未开始: 'is-upcoming',
  进行中: 'is-ongoing',
  已结束: 'is-ended',
  已终止: 'is-ended',
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
  likes,
  variant = 'detail',
  layout,
  fields,
}: {
  activity: Pick<Activity, 'id' | 'activityStatus' | 'category' | 'scheduleType' | 'pinned' | 'title'>;
  title?: string;
  likes?: number;
  variant?: 'home' | 'detail';
  layout?: 'two-col' | 'large-image' | 'left-image' | 'left-text';
  fields?: Partial<DecoActivityCardFields>;
}) {
  const heading = title ?? activity.title;
  const visible = decoActivityCardFields(fields);
  if (variant === 'home') {
    const side = layout === 'left-image' || layout === 'left-text';
    if (side) return null;
    const statusRight = layout === 'two-col' || layout === 'large-image';
    const formatOnStart = visible.showHoldMode && statusRight;
    const formatOnEnd = visible.showHoldMode && !statusRight;
    return (
      <>
        <div className="c-cover-badges">
          {visible.showPinned && activity.pinned ? <span className="c-pill is-pin">置顶</span> : null}
          {statusRight || !visible.showStatusTag ? null : <StatusPill status={activity.activityStatus} />}
          {visible.showCategoryTag ? <CategoryPill category={activity.category} /> : null}
          {formatOnStart ? <SchedulePill scheduleType={activity.scheduleType} /> : null}
        </div>
        <div className="c-cover-badges is-end">
          {statusRight && visible.showStatusTag ? <StatusPill status={activity.activityStatus} /> : null}
          {formatOnEnd ? <SchedulePill scheduleType={activity.scheduleType} /> : null}
        </div>
        {visible.showTitle && heading ? <div className="c-cover-title">{heading}</div> : null}
        {visible.showLikes ? (
          <div className="c-cover-likes">
            <IconLike />
            <span>{likes ?? getLikedBy(activity.id).length}</span>
          </div>
        ) : null}
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

export function ActivitySideCopy({
  activity,
  fields,
}: {
  activity: Activity;
  fields?: Partial<DecoActivityCardFields>;
}) {
  const visible = decoActivityCardFields(fields);
  const tags = (
    <>
      {visible.showPinned && activity.pinned ? <span className="c-pill is-pin">置顶</span> : null}
      {visible.showStatusTag ? <StatusPill status={activity.activityStatus} /> : null}
      {visible.showCategoryTag ? <CategoryPill category={activity.category} /> : null}
      {visible.showHoldMode ? <SchedulePill scheduleType={activity.scheduleType} /> : null}
    </>
  );
  return (
    <>
      {visible.showTitle ? <div className="c-card-title">{activity.title}</div> : null}
      <div className="c-list-tags">{tags}</div>
    </>
  );
}
