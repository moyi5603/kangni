import type { ReactNode } from 'react';
import type { Activity } from '../../../activities/model/activity';
import { useCanSubmitMoment, useClientMoments } from '../../../activities/model/momentStore';
import { commentCount } from '../model/activityComments';
import { shouldShowMomentsTab } from '../model/activitySocialTabs';

export function ActivitySocialTabs({
  activity,
  tab,
  onTabChange,
  comments,
  moments,
}: {
  activity: Activity;
  tab: 'comments' | 'moments';
  onTabChange: (tab: 'comments' | 'moments') => void;
  comments: ReactNode;
  moments: ReactNode;
}) {
  const momentItems = useClientMoments(activity.id);
  const canSubmit = useCanSubmitMoment(activity);
  const showMoments = shouldShowMomentsTab(momentItems.length, canSubmit);
  const current = showMoments && tab === 'moments' ? 'moments' : 'comments';

  return (
    <div className={showMoments ? 'c-social-panel c-social-tabs' : 'c-social-panel'} id="activity-social">
      {showMoments ? (
        <div className="c-social-tab-list" role="tablist" aria-label="评论和精彩瞬间">
          <button
            type="button"
            role="tab"
            className={current === 'comments' ? 'c-social-tab is-on' : 'c-social-tab'}
            aria-selected={current === 'comments'}
            onClick={() => onTabChange('comments')}
          >
            评论 {commentCount(activity.id)}
          </button>
          <button
            type="button"
            role="tab"
            className={current === 'moments' ? 'c-social-tab is-on' : 'c-social-tab'}
            aria-selected={current === 'moments'}
            onClick={() => onTabChange('moments')}
          >
            精彩瞬间 {momentItems.length}
          </button>
        </div>
      ) : null}
      {current === 'moments' ? moments : comments}
    </div>
  );
}
