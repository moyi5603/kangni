import { formatVoteCardTime } from '../../voting/model/clientVote';
import { StatusPill } from '../../activities/components/StatusPill';
import type { VoteV2Status } from '../../../voting-v2/model/voteV2';

export type VoteV2ListLayout = 'large-image' | 'two-col' | 'left-image' | 'left-text' | 'scroll';

export function VoteV2ListCard({
  href,
  coverUrl,
  title,
  time,
  startAt,
  endAt,
  status,
  cta,
  layout = 'left-image',
  showTitle = true,
  showTime = true,
  showStatus = false,
}: {
  href: string;
  coverUrl: string;
  title: string;
  time?: string;
  startAt?: string;
  endAt?: string;
  status?: VoteV2Status;
  cta?: string;
  layout?: VoteV2ListLayout;
  showTitle?: boolean;
  showTime?: boolean;
  showStatus?: boolean;
}) {
  const side = layout === 'left-image' || layout === 'left-text';
  const range = startAt && endAt;
  const timeText = range ? `${formatVoteCardTime(startAt)} ~ ${formatVoteCardTime(endAt)}` : time;
  return (
    <a className={`c-h5-vote-card is-${layout}`} href={href}>
      <div className={`c-h5-vote-cover${side ? ' is-side' : ''}`}>
        {coverUrl ? <img src={coverUrl} alt="" /> : <span className="c-h5-vote-cover-fallback" aria-hidden />}
      </div>
      <div className="c-h5-vote-copy">
        {showTitle ? <h2 className="c-h5-vote-title">{title}</h2> : null}
        {showStatus && status ? (
          <div className="c-h5-vote-status">
            <StatusPill status={status} />
          </div>
        ) : null}
        {showTime && timeText ? <p className="c-h5-vote-time">{timeText}</p> : null}
        {cta ? <span className="c-h5-vote-cta">{cta}</span> : null}
      </div>
    </a>
  );
}
