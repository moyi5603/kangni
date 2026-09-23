import { MomentCard, type MomentCardActions } from '../../activities/components/MomentFeed';
import type { InterestGroupMoment } from '../../../interest-groups/model/interestGroupMoment';
import {
  addInterestGroupMomentComment,
  addInterestGroupMomentReply,
  deleteInterestGroupMomentComment,
  deleteInterestGroupMomentReply,
  toggleInterestGroupMomentLike,
} from '../../../interest-groups/model/interestGroupStore';
import { toMomentRecord } from '../model/clientInterestGroup';
import { goCEndIgPastMoments } from '../../../../app/navigation';
import { EndedActCard, Empty, ME, pickEndedActs, SectionHead, type Act } from './igShared';
import { useIg } from './IgContext';
import { decoPcColsClass, normalizeDecoColumnCount, type DecoListStyle } from '../../../../shared/decoration/decoTypes';

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
  const { surface } = useIg();
  return (
    <MomentCard
      moment={toMomentRecord(moment)}
      surface={surface === 'pc' ? 'pc' : 'h5'}
      activityTitle={activityTitle}
      onActivityClick={onActivityClick}
      actions={igMomentActions}
    />
  );
}

export function IgHomePastRail({
  acts,
  limit = 3,
  title = '往期精彩回顾',
  showMore = true,
  heading = true,
  listStyle = 'scroll',
  columnCount,
  surface = 'h5',
  fields,
}: {
  acts: Act[];
  limit?: number;
  title?: string;
  showMore?: boolean;
  heading?: boolean;
  listStyle?: DecoListStyle;
  columnCount?: number;
  surface?: 'h5' | 'pc';
  fields?: Parameters<typeof EndedActCard>[0]['fields'];
}) {
  const { nav } = useIg();
  const past = pickEndedActs(acts, limit);
  const pc = surface === 'pc';
  const scroll = listStyle === 'scroll' && !pc;
  const cols = pc
    ? decoPcColsClass(normalizeDecoColumnCount(listStyle, 'pc', columnCount, 'moments'))
    : '';
  return (
    <section className="c-ig-block is-ended">
      {heading ? (
        <SectionHead
          title={title}
          action={showMore ? '查看全部' : undefined}
          accent="var(--sun)"
          onAction={
            showMore ? () => (pc ? goCEndIgPastMoments('pc') : nav.go('moments')) : undefined
          }
        />
      ) : null}
      {past.length ? (
        <ul
          className={
            scroll
              ? 'c-past-rail'
              : `${pc ? 'c-pc-grid' : 'c-h5-list'} is-${listStyle}${cols ? ` ${cols}` : ''}`
          }
          aria-label="往期精彩回顾"
        >
          {past.map((act) => (
            <li key={act.id}>
              <EndedActCard
                act={act}
                layout={listStyle}
                fields={fields}
                onOpen={() => nav.go('activity', { aid: act.id })}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="暂无往期精彩回顾" />
      )}
    </section>
  );
}
