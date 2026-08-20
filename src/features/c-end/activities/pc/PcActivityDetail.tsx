import { useState } from 'react';
import { isRecreationActivity } from '../../../activities/model/activity';
import { canSubmitMoment, type MomentRecord } from '../../../activities/model/moment';
import { useActivities } from '../../../activities/model/activityStore';
import { useApprovedSignup, useClientMoments } from '../../../activities/model/momentStore';
import { useRelated } from '../../../activities/model/related';
import { goCEnd } from '../../../../app/navigation';
import { useCEndToast } from '../components/CEndToast';
import { ActivityCommentList } from '../components/ActivityCommentList';
import { ActivityMeta } from '../components/ActivityMeta';
import { ActivitySocialTabs } from '../components/ActivitySocialTabs';
import { DetailEngageBar } from '../components/DetailEngageBar';
import { MomentFeed } from '../components/MomentFeed';
import { shouldShowMomentsTab } from '../model/activitySocialTabs';
import { StatusPill } from '../components/StatusPill';
import {
  commentCount,
  deleteActivityComment,
  listActivityCommentThreads,
  submitActivityComment,
  toggleCommentLike,
} from '../model/activityComments';
import { getPublishedActivity, signupCta, signupLimit, signupTypes } from '../model/clientActivity';
import { toggleFavorite, toggleLike, useActivityEngagement } from '../model/engagementStore';
import { submitSignup, useHasSignedUp } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';
import { PcMomentModal } from './PcMomentModal';
import { PcSignupModal } from './PcSignupModal';

function withoutLeadingIntroductionHeading(html: string): string {
  const heading = /^(\s*)<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\2\s*>/i.exec(html);
  if (!heading) return html;
  const headingText = heading[3].replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
  if (headingText !== '活动介绍') return html;
  return `${heading[1]}${html.slice(heading[0].length)}`;
}

export function PcActivityDetail({ id }: { id: number }) {
  const activities = useActivities();
  const activity = getPublishedActivity(activities, id);
  const signedUp = useHasSignedUp(id);
  const toast = useCEndToast();
  const engagement = useActivityEngagement(id);
  const relatedComments = useRelated('comments', id);
  const [modalOpen, setModalOpen] = useState(false);
  const [composer, setComposer] = useState<MomentRecord | 'create'>();
  const [socialTab, setSocialTab] = useState<'comments' | 'moments'>('comments');
  const momentItems = useClientMoments(id);
  const approvedSignup = useApprovedSignup(id);
  void relatedComments;

  if (!activity) {
    return (
      <PcActivityShell>
        <div className="c-missing">
          <p className="c-empty">活动不存在</p>
          <button className="c-btn c-btn-primary" type="button" onClick={() => goCEnd('pc')}>
            返回列表
          </button>
        </div>
      </PcActivityShell>
    );
  }

  const limit = signupLimit(activity);
  const cta = signupCta(activity, signedUp);
  const types = signupTypes(activity);
  const threads = listActivityCommentThreads(id);
  const detailHtml = withoutLeadingIntroductionHeading(activity.detailHtml);
  const hideSocialTitle = shouldShowMomentsTab(
    momentItems.length,
    canSubmitMoment(activity.activityStatus, approvedSignup),
  );

  const confirm = (type: string) => {
    const result = submitSignup(activity.id, type);
    setModalOpen(false);
    toast.show(result === 'ok' ? '报名成功' : '已报名');
  };

  return (
    <PcActivityShell>
      <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
        ← 返回列表
      </button>
      <div className="c-pc-detail">
        <article>
          <div className="c-detail-cover">
            {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
          </div>
          <div className="c-detail-body c-article-body">
            <header className="c-detail-heading">
              <div className="c-detail-tags">
                <StatusPill status={activity.activityStatus} />
                <span className="c-pin">{activity.type}</span>
              </div>
              <h2 className="c-detail-name">{activity.title}</h2>
            </header>
            <section className="c-detail-info-card" aria-label="活动信息">
              <ActivityMeta activity={activity} />
              <div className="c-meta c-detail-kv">
                <div>发起人：{activity.organizer}</div>
                <div>联系电话：{activity.phone}</div>
                {limit !== undefined ? <div>活动限额：{limit} 人</div> : null}
              </div>
            </section>
            <section className="c-detail-content-section" aria-labelledby="pc-activity-intro">
              <h2 id="pc-activity-intro" className="c-detail-name c-detail-section">
                活动介绍
              </h2>
              <div className="c-html" dangerouslySetInnerHTML={{ __html: detailHtml }} />
            </section>
            {isRecreationActivity(activity.type) ? (
              <>
                <h2 className="c-detail-name c-detail-section">行程安排</h2>
                <div className="c-html" dangerouslySetInnerHTML={{ __html: activity.itinerary || '—' }} />
                <h2 className="c-detail-name c-detail-section">额外费用规则</h2>
                <div className="c-html" dangerouslySetInnerHTML={{ __html: activity.extraFeeRule || '—' }} />
              </>
            ) : null}
            <ActivitySocialTabs
              activity={activity}
              tab={socialTab}
              onTabChange={setSocialTab}
              comments={
                <ActivityCommentList
                  threads={threads}
                  totalCount={commentCount(id)}
                  onLike={(commentId) => toggleCommentLike(commentId)}
                  onSubmit={(content, parentId) => {
                    if (submitActivityComment(activity.id, content, parentId) === 'ok') toast.show('评论成功');
                  }}
                  onDelete={(commentId) => deleteActivityComment(commentId)}
                  surface="pc"
                  hideTitle={hideSocialTitle}
                />
              }
              moments={
                <MomentFeed
                  activity={activity}
                  onCompose={(record) => setComposer(record ?? 'create')}
                  hideTitle={hideSocialTitle}
                  surface="pc"
                />
              }
            />
          </div>
        </article>
        <aside className="c-pc-side">
          <h2 className="c-detail-name">{activity.title}</h2>
          <div className="c-detail-tags">
            <StatusPill status={activity.activityStatus} />
          </div>
          <DetailEngageBar
            liked={engagement.liked}
            favorited={engagement.favorited}
            likes={engagement.likes}
            stars={engagement.stars}
            comments={commentCount(id)}
            onLike={() => toggleLike(id)}
            onFavorite={() => toggleFavorite(id)}
            onComment={() => {
              setSocialTab('comments');
              requestAnimationFrame(() => {
                document.getElementById('activity-social')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.getElementById('activity-comment-box')?.focus();
              });
            }}
          />
          <button className="c-cta" type="button" disabled={!cta.enabled} onClick={() => setModalOpen(true)}>
            {cta.label}
          </button>
        </aside>
      </div>
      {modalOpen ? <PcSignupModal types={types} onCancel={() => setModalOpen(false)} onConfirm={confirm} /> : null}
      {composer ? (
        <PcMomentModal
          activity={activity}
          editing={composer === 'create' ? undefined : composer}
          onCancel={() => setComposer(undefined)}
          onSuccess={(text) => {
            setComposer(undefined);
            toast.show(text);
          }}
        />
      ) : null}
    </PcActivityShell>
  );
}
