import { useState } from 'react';
import { canSubmitMoment, type MomentRecord } from '../../../activities/model/moment';
import { useActivities } from '../../../activities/model/activityStore';
import { useApprovedSignup, useClientMoments } from '../../../activities/model/momentStore';
import { useRelated } from '../../../activities/model/related';
import { goCEnd } from '../../../../app/navigation';
import type { Activity } from '../../../activities/model/activity';
import { useCEndToast } from '../components/CEndToast';
import { ActivityCommentList } from '../components/ActivityCommentList';
import { ActivityDetailFacts } from '../components/ActivityDetailFacts';
import { ActivitySocialTabs } from '../components/ActivitySocialTabs';
import { ActivityRatingBlock } from '../components/ActivityRatingBlock';
import { ApprovedSignupPeople } from '../components/ApprovedSignupPeople';
import { DetailEngageBar } from '../components/DetailEngageBar';
import { ShareContactsPanel } from '../components/ShareContactsPanel';
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
import { needsSignupForm, prefillSignupAnswers } from '../../../activities/model/signupFields';
import { getPublishedActivity, signupCta, signupLimit, signupOccupiedCount, signupTypes } from '../model/clientActivity';
import { shareConfirmMessage } from '../model/activityShare';
import { toggleFavorite, toggleLike, useActivityEngagement } from '../model/engagementStore';
import { cancelSignup, DEMO_SIGNUP_USER, submitSignup, useHasSignedUp } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';
import { CancelSignupDialog } from '../components/CancelSignupDialog';
import { PcMomentModal } from './PcMomentModal';
import { PcSignupModal } from './PcSignupModal';

function withoutLeadingIntroductionHeading(html: string): string {
  const heading = /^(\s*)<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\2\s*>/i.exec(html);
  if (!heading) return html;
  const headingText = heading[3].replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
  if (headingText !== '活动介绍') return html;
  return `${heading[1]}${html.slice(heading[0].length)}`;
}

export function PcActivityDetail({
  id,
  activity: activityOverride,
  preview = false,
  signupOpen: initialSignupOpen = false,
}: {
  id: number;
  activity?: Activity;
  preview?: boolean;
  signupOpen?: boolean;
}) {
  const activities = useActivities();
  const stored = getPublishedActivity(activities, id);
  const activity = activityOverride ?? stored;
  const signedUp = useHasSignedUp(id);
  const toast = useCEndToast();
  const engagement = useActivityEngagement(id);
  const relatedComments = useRelated('comments', id);
  const relatedSignups = useRelated('signups', id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(initialSignupOpen);
  const [composer, setComposer] = useState<MomentRecord | 'create'>();
  const [socialTab, setSocialTab] = useState<'comments' | 'moments'>('comments');
  const [shareOpen, setShareOpen] = useState(false);
  const momentItems = useClientMoments(id);
  const approvedSignup = useApprovedSignup(id);
  void relatedComments;
  void relatedSignups;

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

  const occupied = signupOccupiedCount(id);
  const limit = signupLimit(activity);
  const cta = signupCta(activity, signedUp, Date.now(), { allowCancel: true });
  const types = signupTypes(activity);
  const threads = listActivityCommentThreads(id);
  const detailHtml = withoutLeadingIntroductionHeading(activity.detailHtml);
  const hideSocialTitle = shouldShowMomentsTab(
    momentItems.length,
    canSubmitMoment(activity.activityStatus, approvedSignup),
  );

  const confirm = (type: string, answers: Record<string, string>) => {
    if (preview) {
      toast.show('预览中，无法报名');
      return;
    }
    const result = submitSignup(activity.id, type, answers);
    toast.show(result === 'ok' ? '报名成功' : '已报名');
  };

  const closeSignup = () => {
    setSignupOpen(false);
    if (!preview) goCEnd('pc', activity.id);
  };

  const submitSignupForm = (type: string, answers: Record<string, string>) => {
    const freshCta = signupCta(activity, signedUp, Date.now(), { allowCancel: true });
    if (!freshCta.enabled || freshCta.action === 'cancel') {
      toast.show(freshCta.label);
      closeSignup();
      return;
    }
    confirm(type, answers);
    closeSignup();
  };

  const openSignup = () => {
    if (needsSignupForm(activity.signupFields) || types.length !== 1) {
      setSignupOpen(true);
      return;
    }
    confirm(
      types[0],
      prefillSignupAnswers(activity.signupFields, {
        姓名: DEMO_SIGNUP_USER.name,
        手机号: DEMO_SIGNUP_USER.phone,
        部门: DEMO_SIGNUP_USER.department,
        岗位: DEMO_SIGNUP_USER.position,
      }),
    );
  };

  return (
    <PcActivityShell>
      {preview ? null : (
        <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
          ← 返回列表
        </button>
      )}
      <div className="c-pc-detail">
        <article>
          <div className="c-detail-cover">
            {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
          </div>
          <div className="c-detail-body c-article-body">
            <header className="c-detail-heading">
              <div className="c-detail-tags">
                <StatusPill status={activity.activityStatus} />
              </div>
              <h2 className="c-detail-name">{activity.title}</h2>
            </header>
            <section className="c-detail-info-card" aria-label="活动信息">
              <ActivityDetailFacts activity={activity} occupied={occupied} omitCurrentYear hideQuota />
            </section>
            <section className="c-detail-content-section" aria-labelledby="pc-activity-intro">
              <h2 id="pc-activity-intro" className="c-detail-name c-detail-section">
                活动介绍
              </h2>
              <div className="c-html" dangerouslySetInnerHTML={{ __html: detailHtml }} />
            </section>
            <ApprovedSignupPeople activityId={id} surface="pc" />
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
          <div className="c-pc-side-quota" aria-label="报名名额">
            <span>总名额：{limit !== undefined ? `${limit} 人` : '不限'}</span>
            <span>已报名 {occupied} 人</span>
          </div>
          <ActivityRatingBlock activityId={id} status={activity.activityStatus} preview={preview} />
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
            onShare={() => setShareOpen(true)}
          />
          <button
            className="c-cta"
            type="button"
            disabled={!cta.enabled}
            onClick={() => {
              if (!cta.enabled) return;
              if (preview) {
                toast.show('预览中，无法报名');
                return;
              }
              if (cta.action === 'cancel') setCancelOpen(true);
              else openSignup();
            }}
          >
            {cta.label}
          </button>
        </aside>
      </div>
      {signupOpen ? (
        <PcSignupModal
          title={activity.title}
          types={types}
          fields={activity.signupFields}
          onCancel={closeSignup}
          onConfirm={submitSignupForm}
        />
      ) : null}
      {cancelOpen ? (
        <CancelSignupDialog
          onCancel={() => setCancelOpen(false)}
          onConfirm={() => {
            const result = cancelSignup(activity.id);
            setCancelOpen(false);
            toast.show(result === 'ok' ? '已取消报名' : result === 'closed' ? '报名已截止，无法取消' : '取消失败');
          }}
        />
      ) : null}
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
      <ShareContactsPanel
        open={shareOpen}
        surface="pc"
        onClose={() => setShareOpen(false)}
        onConfirm={(count) => {
          setShareOpen(false);
          toast.show(shareConfirmMessage(count));
        }}
      />
    </PcActivityShell>
  );
}
