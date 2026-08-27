import dayjs from 'dayjs';
import { goVoteList, toVoteResultsHash, toVoteTakingHash, type CEndSurface } from '../../../../app/navigation';
import { IconBack } from '../../activities/components/Icons';
import { useCEndToast } from '../../activities/components/CEndToast';
import { ActivityCommentList } from '../../activities/components/ActivityCommentList';
import { addVoteComment, deleteVoteComment, getVote, getVoteQuestions, getVoteResponses, toggleVoteCommentLike, useVotes } from '../../../voting/model/voteStore';
import {
  resolveVoteStatus,
  voteQuotaExhaustedText,
  voteQuotaProgressText,
  voteQuotaRemainingStatLabel,
  voteQuotaRuleText,
  voteQuotaUsed,
  type VoteCampaign,
  type VoteStatus,
} from '../../../voting/model/voting';
import {
  DEMO_VOTE_USER,
  formatVoteCardTime,
  remainingQuota,
  resolveVoteDetailGate,
  todayKey,
} from '../model/clientVote';
import { listVoteCommentThreads, voteCommentCount } from '../../../voting/model/voteComments';
import { VoteShell } from '../VoteShell';

function statusPill(status: VoteStatus): string {
  if (status === '进行中') return 'is-ongoing';
  if (status === '已结束') return 'is-ended';
  return 'is-upcoming';
}

function rangeLabel(campaign: VoteCampaign): string {
  if (campaign.visibility === '全员') return '全员';
  if (campaign.visibility === '按部门') return campaign.departments.join('、') || '按部门';
  if (campaign.visibility === '导入人群') {
    return campaign.importedPeople.length ? `导入 ${campaign.importedPeople.length} 人` : '导入人群';
  }
  return campaign.people.length ? `指定 ${campaign.people.length} 人` : '自定义人员';
}

export function H5VoteDetail({ id, surface = 'h5' }: { id: number; surface?: CEndSurface }) {
  useVotes();
  const toast = useCEndToast();
  const campaign = getVote(id);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const dayKey = todayKey(now);
  const responses = campaign ? getVoteResponses(campaign.id) : [];
  const questions = campaign ? getVoteQuestions(campaign.id) : [];
  const used = campaign ? voteQuotaUsed(campaign, responses, DEMO_VOTE_USER.id, dayKey) : 0;
  const remaining = campaign ? remainingQuota(campaign, DEMO_VOTE_USER.id, dayKey, responses) : 0;
  const gate = resolveVoteDetailGate(campaign, DEMO_VOTE_USER, now, used);
  const status = campaign ? resolveVoteStatus(campaign, now) : '未开始';
  const back = () => goVoteList(surface);

  if (gate === 'missing' || gate === 'forbidden') {
    return (
      <VoteShell surface={surface} className="is-detail" title="投票详情" onBack={back}>
        <p className="c-empty">{gate === 'forbidden' ? '无权参与该投票' : '投票不存在'}</p>
      </VoteShell>
    );
  }

  if (!campaign) return null;

  const canTake = status === '进行中' && remaining > 0;
  const takeHref = toVoteTakingHash(surface, campaign.id);
  const resultsHref = toVoteResultsHash(surface, campaign.id);
  const canSeeCounts = status !== '未开始';
  const cta = canTake ? (
    <a className="c-cta" href={takeHref}>
      {used > 0 ? '再投一票' : '开始投票'}
    </a>
  ) : status === '未开始' ? (
    <button className="c-cta" type="button" disabled>
      未开始
    </button>
  ) : (
    <a className="c-cta" href={resultsHref}>
      查看票数
    </a>
  );

  const timePanel = (
    <section className="c-h5-vote-panel">
      <h2>投票时间</h2>
      <dl className="c-h5-vote-kv">
        <div>
          <dt>开始</dt>
          <dd>{formatVoteCardTime(campaign.startAt)}</dd>
        </div>
        <div>
          <dt>结束</dt>
          <dd>{formatVoteCardTime(campaign.endAt)}</dd>
        </div>
      </dl>
      {surface === 'pc' ? null : (
        <>
          <p className="c-h5-vote-quota">{voteQuotaProgressText(campaign, used)}</p>
          {status === '进行中' && remaining === 0 ? <p className="c-h5-vote-hint">{voteQuotaExhaustedText(campaign.quotaMode)}</p> : null}
        </>
      )}
    </section>
  );
  const rulesPanel = (
    <section className="c-h5-vote-panel">
      <h2>投票规则</h2>
      <ul className="c-h5-vote-rules">
        <li>参与范围：{rangeLabel(campaign)}</li>
        <li>{voteQuotaRuleText(campaign)}</li>
      </ul>
    </section>
  );

  const body = (
    <div className="c-h5-vote-detail">
      <header className="c-h5-vote-hero">
        <span className={`c-pill ${statusPill(status)}`}>{status}</span>
        {campaign.intro ? <p className="c-h5-vote-intro">{campaign.intro}</p> : null}
      </header>
      <ul className="c-h5-vote-stats">
        <li>
          <small>题目</small>
          <strong>{questions.length}题</strong>
        </li>
        <li>
          <small>{voteQuotaRemainingStatLabel(campaign.quotaMode)}</small>
          <strong>{remaining}次</strong>
        </li>
        <li>
          <small>已回收</small>
          <strong>{responses.length}份</strong>
        </li>
        <li>
          <small>匿名</small>
          <strong>{campaign.anonymous ? '是' : '否'}</strong>
        </li>
      </ul>
      {surface === 'pc' ? (
        <div className="c-pc-vote-board">
          {timePanel}
          {rulesPanel}
        </div>
      ) : (
        <>
          {timePanel}
          {rulesPanel}
        </>
      )}
      {campaign.allowComment ? (
        <section className="c-h5-vote-panel">
          <ActivityCommentList
            threads={listVoteCommentThreads(campaign.id)}
            totalCount={voteCommentCount(campaign.id)}
            viewerName={DEMO_VOTE_USER.name}
            onLike={(commentId) => toggleVoteCommentLike(commentId, DEMO_VOTE_USER.id)}
            onSubmit={(content, parentId) => {
              const result = addVoteComment({
                campaignId: campaign.id,
                authorId: DEMO_VOTE_USER.id,
                authorName: DEMO_VOTE_USER.name,
                text: content,
                parentId,
              });
              if (result.ok) toast.show('评论成功');
              else toast.show(result.reason === 'empty' ? '请输入评论' : '评论失败');
            }}
            onDelete={(commentId) => deleteVoteComment(commentId, DEMO_VOTE_USER.id)}
            surface={surface === 'pc' ? 'pc' : 'h5'}
          />
        </section>
      ) : null}
    </div>
  );

  if (surface === 'pc') {
    return (
      <VoteShell
        surface="pc"
        title={campaign.name}
        onBack={back}
        actions={
          canSeeCounts ? (
            <a className="c-pc-vote-mine" href={resultsHref}>
              查看票数
            </a>
          ) : null
        }
        detail
      >
        <div className="c-pc-detail">
          {body}
          <aside className="c-pc-side">
            <h2 className="c-detail-name">{campaign.name}</h2>
            <p className="c-quota-line">{voteQuotaProgressText(campaign, used)}</p>
            {status === '进行中' && remaining === 0 ? <p className="c-h5-vote-hint">{voteQuotaExhaustedText(campaign.quotaMode)}</p> : null}
            {cta}
          </aside>
        </div>
      </VoteShell>
    );
  }

  return (
    <VoteShell
      className="is-vote is-detail"
      header={
        <header className="c-h5-top">
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={back}>
            <IconBack />
          </button>
          <h1 className="c-h5-title">{campaign.name}</h1>
          {canSeeCounts ? (
            <a className="c-h5-vote-mine" href={resultsHref}>
              查看票数
            </a>
          ) : (
            <span className="c-icon-btn" aria-hidden />
          )}
        </header>
      }
      detail
      footer={<div className="c-h5-cta-bar">{cta}</div>}
    >
      {body}
    </VoteShell>
  );
}
