import type { Activity } from '../../../activities/model/activity';
import { formatActivityTime } from '../../../activities/model/activity';
import { formatShortActivityDate } from '../model/clientActivity';
import { IconClock, IconPin } from './Icons';

export function ActivityMeta({ activity, compact }: { activity: Activity; compact?: boolean }) {
  return (
    <div className="c-meta">
      <div className="c-meta-row">
        <IconClock />
        <span>{compact ? formatShortActivityDate(activity) : formatActivityTime(activity)}</span>
      </div>
      <div className="c-meta-row">
        <IconPin />
        <span>{activity.location}</span>
      </div>
    </div>
  );
}
