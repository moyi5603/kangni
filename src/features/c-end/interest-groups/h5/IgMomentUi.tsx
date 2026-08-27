import { MomentCard, type MomentCardActions } from '../../activities/components/MomentFeed';
import { MomentPastCard } from '../../activities/h5/H5ActivityCards';
import type { InterestGroupMoment } from '../../../interest-groups/model/interestGroupMoment';
import {
  addInterestGroupMomentComment,
  addInterestGroupMomentReply,
  deleteInterestGroupMomentComment,
  deleteInterestGroupMomentReply,
  toggleInterestGroupMomentLike,
} from '../../../interest-groups/model/interestGroupStore';
import { listIgHomeHighlightMoments, toMomentRecord } from '../model/clientInterestGroup';
import { ME } from './igShared';
import { useIg } from './IgContext';

export const igMomentActions: MomentCardActions = {
  viewer: ME,
  toggleLike: (id) => {
    toggleInterestGroupMomentLike(id, ME);
  },
  addComment: (id, content, user) => addInterestGroupMomentComment(id, content, user),
  addReply: (id, commentId, content, user, replyTo) =>
    addInterestGroupMomentReply(id, commentId, content, user, replyTo),
  deleteComment: (id, commentId) => {
    deleteInterestGroupMomentComment(id, commentId);
  },
  deleteReply: (id, commentId, replyId) => {
    deleteInterestGroupMomentReply(id, commentId, replyId);
  },
};

export function IgMomentCard({
  moment,
  activityTitle,
  onActivityClick,
}: {
  moment: InterestGroupMoment;
  activityTitle?: string;
  onActivityClick?: () => void;
}) {
  return (
    <MomentCard
      moment={toMomentRecord(moment)}
      surface="h5"
      activityTitle={activityTitle}
      onActivityClick={onActivityClick}
      actions={igMomentActions}
    />
  );
}

export function IgHomePastRail({ moments, limit = 3 }: { moments: InterestGroupMoment[]; limit?: number }) {
  const { nav } = useIg();
  const past = listIgHomeHighlightMoments(moments, limit);
  if (!past.length) return null;
  return (
    <section className="c-past-sec" aria-labelledby="ig-past-title">
      <div className="c-past-head">
        <h2 id="ig-past-title" className="c-past-title">
          往期精彩回顾
        </h2>
        <div className="c-catalog-more">
          <button type="button" onClick={() => nav.go('moments')}>
            查看全部
          </button>
        </div>
      </div>
      <ul className="c-past-rail" aria-label="往期精彩回顾">
        {past.map((moment) => (
          <li key={moment.id}>
            <MomentPastCard moment={toMomentRecord(moment)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
