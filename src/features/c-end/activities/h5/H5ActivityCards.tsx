import type { CSSProperties } from 'react';
import { decoActivityCardFields, type DecoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import type { Activity } from '../../../activities/model/activity';
import { ActivityMeta } from '../components/ActivityMeta';
import { HomeQuotaBlock, homeQuotaAriaLabel } from '../components/HomeQuotaBlock';
import { IconChevronRight } from '../components/Icons';
import { ActivityCoverOverlay, ActivitySideCopy } from '../components/StatusPill';
import { formatClientActivityTime, signupCta } from '../model/clientActivity';

export type ActivityCardLayout = 'two-col' | 'large-image' | 'left-image' | 'left-text';

export type ActivityCardProps = {
  activity: Activity;
  signedUp?: boolean;
  onOpen: () => void;
  layout?: ActivityCardLayout;
  fields?: Partial<DecoActivityCardFields>;
};

function ActivityCover({
  activity,
  className,
  layout,
  style,
  fields,
}: {
  activity: Activity;
  className: string;
  layout?: ActivityCardLayout;
  style?: CSSProperties;
  fields?: Partial<DecoActivityCardFields>;
}) {
  return (
    <div className={className} style={style}>
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
      <ActivityCoverOverlay activity={activity} variant="home" layout={layout} fields={fields} />
    </div>
  );
}

export function PastActivityRailCard({
  activity,
  onOpen,
  layout,
  fields,
}: {
  activity: Activity;
  onOpen: () => void;
  layout?: ActivityCardLayout;
  fields?: Partial<DecoActivityCardFields>;
}) {
  const visible = decoActivityCardFields(fields);
  const side = layout === 'left-image' || layout === 'left-text';
  const cover = activity.coverUrl ? (
    <img className="c-past-act-cover is-contain" src={activity.coverUrl} alt="" />
  ) : (
    <span className="c-cover-fallback" aria-hidden />
  );
  if (side) {
    return (
      <button
        className={`c-past-act is-${layout}`}
        type="button"
        aria-label={activity.title}
        onClick={onOpen}
      >
        <span className="c-past-act-media">{cover}</span>
        <span className="c-past-act-copy">
          {visible.showTitle ? <span className="c-past-act-title">{activity.title}</span> : null}
          {visible.showStatusTag ? <span className="c-past-act-badge">已结束</span> : null}
        </span>
      </button>
    );
  }
  return (
    <button className="c-past-act" type="button" aria-label={activity.title} onClick={onOpen}>
      {cover}
      <span className="c-past-act-shade" />
      {visible.showStatusTag ? <span className="c-past-act-badge">已结束</span> : null}
      {visible.showTitle ? <span className="c-past-act-title">{activity.title}</span> : null}
    </button>
  );
}

export function PastActivityFeedCard({ activity, onOpen }: { activity: Activity; onOpen: () => void }) {
  return (
    <button className="c-past-feed-card" type="button" aria-label={activity.title} onClick={onOpen}>
      <div className="c-cover c-list-cover is-contain">
        <span className="c-cover-fallback" aria-hidden />
        {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
        <span className="c-past-act-badge">已结束</span>
      </div>
      <div className="c-past-feed-body">
        <div className="c-past-feed-title">{activity.title}</div>
        <ActivityMeta activity={activity} compact />
      </div>
    </button>
  );
}

function activityCardLabel(activity: Activity, action: string): string {
  const quota = homeQuotaAriaLabel(activity);
  return [
    activity.title,
    activity.category,
    activity.activityStatus,
    `时间 ${formatClientActivityTime(activity)}`,
    activity.location.trim() ? `地点 ${activity.location}` : '',
    action,
    quota,
  ]
    .filter(Boolean)
    .join('，');
}

export function H5ActivitySearchRow({ activity, onOpen }: ActivityCardProps) {
  const place = activity.location.trim();
  const sub = [formatClientActivityTime(activity), place].filter(Boolean).join(' · ');
  return (
    <button className="c-act-search-row" type="button" onClick={onOpen} aria-label={activity.title}>
      <div className="c-act-search-cover">
        <span className="c-cover-fallback" aria-hidden />
        {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
      </div>
      <div className="c-act-search-body">
        <div className="c-act-search-title">{activity.title}</div>
        {sub ? <div className="c-act-search-sub">{sub}</div> : null}
        <div className="c-act-search-tags">
          <span className="c-act-search-tag">{activity.category}</span>
          <span className="c-act-search-tag">{activity.activityStatus}</span>
        </div>
      </div>
      <span className="c-act-search-chev" aria-hidden>
        <IconChevronRight />
      </span>
    </button>
  );
}

export function H5ActivityListCard({ activity, signedUp = false, onOpen, layout, fields }: ActivityCardProps) {
  const cta = signupCta(activity, Boolean(signedUp));
  const side = layout === 'left-image' || layout === 'left-text';
  const sideCardStyle: CSSProperties | undefined = side
    ? {
        display: 'flex',
        flexDirection: layout === 'left-text' ? 'row-reverse' : 'row',
        alignItems: 'stretch',
      }
    : undefined;
  const sideCoverStyle: CSSProperties | undefined = side
    ? { width: 108, flex: '0 0 108px', alignSelf: 'stretch', minHeight: 96, aspectRatio: 'auto' }
    : undefined;

  return (
    <button
      className={`c-list-card c-h5-card-button${layout ? ` is-${layout}` : ''}`}
      type="button"
      aria-label={activityCardLabel(activity, cta.label)}
      onClick={onOpen}
      style={sideCardStyle}
    >
      <ActivityCover
        activity={activity}
        className={`c-cover c-list-cover${side ? ' is-side is-contain' : ' c-cover-16x9'}`}
        layout={layout}
        style={sideCoverStyle}
        fields={fields}
      />
      <div className="c-list-copy">
        {side ? <ActivitySideCopy activity={activity} fields={fields} /> : null}
        <ActivityMeta activity={activity} compact hidePlace={side} fields={fields} />
        <HomeQuotaBlock
          activity={activity}
          ctaLabel={cta.label}
          ctaEnabled={cta.enabled}
          signedUp={signedUp}
          compact={side}
          fields={fields}
        />
      </div>
    </button>
  );
}
