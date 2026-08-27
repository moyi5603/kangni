import { useState } from 'react';
import type { Activity } from '../../../activities/model/activity';
import { isPlayableMomentVideo, momentCoverUrl, type MomentRecord } from '../../../activities/model/moment';
import { ActivityMeta } from '../components/ActivityMeta';
import { HomeQuotaBlock, homeQuotaAriaLabel } from '../components/HomeQuotaBlock';
import { MomentMediaViewer, type MediaViewer } from '../components/MomentFeed';
import { ActivityCoverOverlay } from '../components/StatusPill';
import { formatShortActivityDate, signupCta } from '../model/clientActivity';

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
      <ActivityCoverOverlay activity={activity} variant="home" />
    </div>
  );
}

function momentLightbox(moment: MomentRecord): MediaViewer | undefined {
  if (moment.type === '视频' && moment.videoUrl) return { kind: 'video', url: moment.videoUrl };
  if (moment.imageUrls.length > 0) return { kind: 'images', urls: moment.imageUrls, index: 0 };
  return undefined;
}

export function MomentPastCard({ moment }: { moment: MomentRecord }) {
  const cover = momentCoverUrl(moment);
  const video = moment.type === '视频';
  const playable = isPlayableMomentVideo(cover);
  const [viewer, setViewer] = useState<MediaViewer>();

  return (
    <>
      <button
        className="c-past-card"
        type="button"
        aria-label={video ? '播放视频' : '查看大图'}
        onClick={() => {
          const next = momentLightbox(moment);
          if (next) setViewer(next);
        }}
      >
        <div className="c-past-media">
          {video ? (
            <span className="c-moment-media-btn c-moment-video-poster">
              {cover ? (
                playable ? (
                  <video className="c-moment-video" src={cover} muted playsInline preload="metadata" />
                ) : (
                  <img src={cover} alt="" />
                )
              ) : null}
              <span className="c-moment-play" aria-hidden />
            </span>
          ) : (
            <div className="c-moment-grid is-1">
              <span className="c-moment-media-btn">
                {cover ? <img src={cover} alt="" /> : null}
              </span>
              {moment.imageUrls.length > 1 ? (
                <span className="c-past-count" aria-label={`共${moment.imageUrls.length}张`}>
                  {moment.imageUrls.length}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <p className="c-past-copy">{moment.content}</p>
      </button>
      {viewer ? (
        <MomentMediaViewer
          viewer={viewer}
          onClose={() => setViewer(undefined)}
          onIndex={(index) => setViewer((current) => (current?.kind === 'images' ? { ...current, index } : current))}
        />
      ) : null}
    </>
  );
}

function activityCardLabel(activity: Activity, action: string): string {
  const quota = homeQuotaAriaLabel(activity);
  return [
    activity.title,
    activity.category,
    activity.activityStatus,
    `日期 ${formatShortActivityDate(activity)}`,
    activity.location.trim() ? `地点 ${activity.location}` : '',
    action,
    quota,
  ]
    .filter(Boolean)
    .join('，');
}

export function H5ActivityListCard({ activity, signedUp = false, onOpen }: ActivityCardProps) {
  const cta = signupCta(activity, Boolean(signedUp));

  return (
    <button
      className="c-list-card c-h5-card-button"
      type="button"
      aria-label={activityCardLabel(activity, cta.label)}
      onClick={onOpen}
    >
      <ActivityCover activity={activity} className="c-cover c-list-cover c-cover-16x9" />
      <div className="c-list-copy">
        <ActivityMeta activity={activity} compact />
        <HomeQuotaBlock
          activity={activity}
          ctaLabel={cta.label}
          ctaEnabled={cta.enabled}
          signedUp={signedUp}
        />
      </div>
    </button>
  );
}
