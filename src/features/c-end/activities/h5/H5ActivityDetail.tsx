import { useEffect, useState } from 'react';
import { canSubmitMoment, type MomentRecord } from '../../../activities/model/moment';
import { useActivities } from '../../../activities/model/activityStore';
import { useApprovedSignup, useClientMoments } from '../../../activities/model/momentStore';
import { useRelated } from '../../../activities/model/related';
import { goCEnd, goCEndSignup } from '../../../../app/navigation';
import { ActivityCommentList } from '../components/ActivityCommentList';
import { ActivityDetailFacts } from '../components/ActivityDetailFacts';
import { ActivitySocialTabs } from '../components/ActivitySocialTabs';
import { ActivityRatingBlock } from '../components/ActivityRatingBlock';
import { ApprovedSignupPeople } from '../components/ApprovedSignupPeople';
import { DetailEngageBar } from '../components/DetailEngageBar';
import { RecentSessionsStrip } from '../components/RecentSessionsStrip';
import { ShareContactsPanel } from '../components/ShareContactsPanel';
import { MomentFeed } from '../components/MomentFeed';
import { shouldShowMomentsTab } from '../model/activitySocialTabs';
import { ActivityCoverOverlay } from '../components/StatusPill';
import {
  commentCount,
  deleteActivityComment,
  listActivityCommentThreads,
  submitActivityComment,
  toggleCommentLike,
} from '../model/activityComments';
import { needsSessionPick } from '../../../activities/model/activitySchedule';
import { needsSignupForm, prefillSignupAnswers } from '../../../activities/model/signupFields';
import { getPublishedActivity, signupCta, signupTypes } from '../model/clientActivity';
import { shareConfirmMessage } from '../model/activityShare';
import { toggleFavorite, toggleLike, useActivityEngagement } from '../model/engagementStore';
import { cancelSignup, DEMO_SIGNUP_USER, saveClientSignup, useHasSignedUp } from '../model/signupStore';
import { useCEndToast } from '../components/CEndToast';
import { CancelSignupDialog } from '../components/CancelSignupDialog';
import { H5ActivityShell } from './H5ActivityShell';
import { H5MomentSheet } from './H5MomentSheet';

function withoutLeadingIntroductionHeading(html: string): string {
  const heading = /^(\s*)<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\2\s*>/i.exec(html);
  if (!heading) return html;

  const headingText = heading[3].replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
  if (headingText !== '活动介绍') return html;

  return `${heading[1]}${html.slice(heading[0].length)}`;
}

function H5DetailNavFab() {
  return (
    <nav className="c-h5-detail-fab" aria-label="页面导航">
      <button type="button" onClick={() => window.history.back()}>
        返回上一页
      </button>
      <button type="button" onClick={() => goCEnd('h5')}>
        回主页
      </button>
    </nav>
  );
}

export function H5ActivityDetail({
  id,
}: {
  id: number;
}) {
  const activities = useActivities();
  const activity = getPublishedActivity(activities, id);
  const signedUp = useHasSignedUp(id);
  const toast = useCEndToast();
  const engagement = useActivityEngagement(id);
  const relatedComments = useRelated('comments', id);
  const relatedSignups = useRelated('signups', id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [composer, setComposer] = useState<MomentRecord | 'create'>();
  const [now, setNow] = useState(() => Date.now());
  const [socialTab, setSocialTab] = useState<'comments' | 'moments'>('comments');
  const [shareOpen, setShareOpen] = useState(false);
  const momentItems = useClientMoments(id);
  const approvedSignup = useApprovedSignup(id);
  void relatedComments;
  void relatedSignups;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!activity) {
    return (
      <H5ActivityShell
        title="活动不存在"
        onBack={() => goCEnd('h5')}
        overlay={<H5DetailNavFab />}
      >
        <div className="c-missing">
          <p className="c-empty">活动不存在</p>
          <button className="c-btn c-btn-primary" type="button" onClick={() => goCEnd('h5')}>
            返回列表
          </button>
        </div>
      </H5ActivityShell>
    );
  }

  const cta = signupCta(activity, signedUp, now, { allowCancel: true });
  const types = signupTypes(activity);
  const threads = listActivityCommentThreads(id);
  const detailHtml = withoutLeadingIntroductionHeading(activity.detailHtml);
  const hideSocialTitle = shouldShowMomentsTab(
    momentItems.length,
    canSubmitMoment(activity.activityStatus, approvedSignup),
  );

  const confirm = (type: string, answers: Record<string, string>) => {
    const freshCta = signupCta(activity, signedUp, Date.now(), { allowCancel: true });
    if (!freshCta.enabled) {
      toast.show(freshCta.label);
      return;
    }

    const result = saveClientSignup(activity.id, type, answers);
    toast.show(
      result === 'ok' ? (signedUp ? '已更新报名' : '报名成功') : result === 'cancelled' ? '已取消报名' : '已报名',
    );
  };

  const openSignup = () => {
    if (needsSignupForm(activity.signupFields) || types.length !== 1 || needsSessionPick(activity.scheduleType)) {
      goCEndSignup('h5', activity.id);
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
    <H5ActivityShell
      title={activity.title}
      onBack={() => goCEnd('h5')}
      detail
      overlay={<H5DetailNavFab />}
      footer={
        <div className="c-h5-cta-bar">
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
              if (cta.action === 'cancel') setCancelOpen(true);
              else openSignup();
            }}
          >
            {cta.label}
          </button>
        </div>
      }
    >
      <div className="c-detail-cover">
        <span className="c-cover-fallback" aria-hidden />
        {activity.coverUrl ? (
          <img
            key={activity.coverUrl}
            src={activity.coverUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
        <ActivityCoverOverlay activity={activity} />
      </div>
      <article className="c-h5-detail c-detail-body">
        <section className="c-detail-info-card" aria-label="活动信息">
          <ActivityDetailFacts activity={activity} />
          <RecentSessionsStrip activity={activity} now={now} />
          <ApprovedSignupPeople activity={activity} activityId={id} surface="h5" now={now} />
        </section>

        <section className="c-detail-content-section" aria-labelledby="h5-activity-intro">
          <h2 id="h5-activity-intro" className="c-detail-name c-detail-section">
            活动介绍
          </h2>
          <div className="c-html" dangerouslySetInnerHTML={{ __html: detailHtml }} />
        </section>

        <ActivityRatingBlock activityId={id} status={activity.activityStatus} />

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
              surface="h5"
              hideTitle={hideSocialTitle}
            />
          }
          moments={
            <MomentFeed
              activity={activity}
              onCompose={(record) => setComposer(record ?? 'create')}
              hideTitle={hideSocialTitle}
              surface="h5"
            />
          }
        />
      </article>
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
        <H5MomentSheet
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
        surface="h5"
        onClose={() => setShareOpen(false)}
        onConfirm={(count) => {
          setShareOpen(false);
          toast.show(shareConfirmMessage(count));
        }}
      />
    </H5ActivityShell>
  );
}
