import { decoActivityCardFields, type DecoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { formatClientActivityTime } from '../model/clientActivity';
import { IconClock, IconPin } from './Icons';

export function ActivityMeta({
  activity,
  hidePlace,
  fields,
}: {
  activity: Activity;
  compact?: boolean;
  hidePlace?: boolean;
  fields?: Partial<DecoActivityCardFields>;
}) {
  const visible = decoActivityCardFields(fields);
  const place = activity.location.trim();
  const showPlace = visible.showPlace && !hidePlace && Boolean(place);
  if (!visible.showTime && !showPlace) return null;
  return (
    <div className="c-meta">
      {visible.showTime ? (
        <div className="c-meta-row">
          <IconClock />
          <span>{formatClientActivityTime(activity)}</span>
        </div>
      ) : null}
      {showPlace ? (
        <div className="c-meta-row">
          <IconPin />
          <span>{place}</span>
        </div>
      ) : null}
    </div>
  );
}
