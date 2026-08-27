import type { Activity } from '../../../activities/model/activity';
import { formatActivityTime } from '../../../activities/model/activity';
import { formatCEndDateTimeInText } from '../../formatDateTime';
import { formatShortActivityDate } from '../model/clientActivity';
import { IconClock, IconPin } from './Icons';

export function ActivityMeta({ activity, compact }: { activity: Activity; compact?: boolean }) {
  return (
    <div className="c-meta">
      <div className="c-meta-row">
        <IconClock />
        <span>{compact ? formatShortActivityDate(activity) : formatCEndDateTimeInText(formatActivityTime(activity))}</span>
      </div>
      {activity.location.trim() ? (
        <div className="c-meta-row">
          <IconPin />
          <span>{activity.location}</span>
        </div>
      ) : null}
    </div>
  );
}
