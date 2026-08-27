import { useMemo } from 'react';
import dayjs from 'dayjs';
import { goVoteDetail, toVoteTakingHash, type CEndSurface } from '../../../../app/navigation';
import { getVote, getVoteAnswers, getVoteQuestions, getVoteResponses, useVotes } from '../../../voting/model/voteStore';
import {
  averageQuestionScore,
  isChoiceQuestionType,
  resolveVoteStatus,
  scoreDistribution,
  tallyQuestionChoices,
  voteChoiceTitle,
} from '../../../voting/model/voting';
import {
  DEMO_VOTE_USER,
  remainingQuota,
  resolveVoteDetailGate,
  todayKey,
  todayVoteCount,
} from '../model/clientVote';
import { VoteShell } from '../VoteShell';

export function H5VoteResults({ id, surface = 'h5' }: { id: number; surface?: CEndSurface }) {
  useVotes();
  const campaign = getVote(id);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const dayKey = todayKey(now);
  const responses = campaign ? getVoteResponses(campaign.id) : [];
  const answers = campaign ? getVoteAnswers(campaign.id) : [];
  const questions = campaign ? getVoteQuestions(campaign.id) : [];
  const used = campaign ? todayVoteCount(campaign.id, DEMO_VOTE_USER.id, dayKey, responses) : 0;
  const remaining = campaign ? remainingQuota(campaign, DEMO_VOTE_USER.id, dayKey, responses) : 0;
  const gate = resolveVoteDetailGate(campaign, DEMO_VOTE_USER, now, used);
  const status = campaign ? resolveVoteStatus(campaign, now) : '未开始';
  const latestMine = useMemo(() => {
    const mine = responses.filter((item) => item.voterId === DEMO_VOTE_USER.id).sort((left, right) => left.submittedAt.localeCompare(right.submittedAt));
    return mine.at(-1);
  }, [responses]);
  const latestChoiceIds = useMemo(() => {
    if (!latestMine) return new Set<number>();
    const ids = new Set<number>();
    answers.filter((item) => item.responseId === latestMine.id).forEach((item) => item.choiceIds.forEach((choiceId) => ids.add(choiceId)));
    return ids;
  }, [answers, latestMine]);
  const back = () => goVoteDetail(surface, id);

  if (gate === 'missing' || gate === 'forbidden') {
    return (
      <VoteShell surface={surface} className="is-vote is-detail" title="票数" onBack={back}>
        <p className="c-empty">{gate === 'forbidden' ? '无权参与该投票' : '投票不存在'}</p>
      </VoteShell>
    );
  }

  if (!campaign) return null;

  if (status === '未开始') {
    return (
      <VoteShell surface={surface} className="is-vote is-detail" title="票数" onBack={back}>
        <p className="c-empty">投票未开始</p>
      </VoteShell>
    );
  }

  const canTake = status === '进行中' && remaining > 0;
  const takeCta = (
    <a className="c-cta" href={toVoteTakingHash(surface, campaign.id)}>
      再投一票
    </a>
  );
  const results = (
    <div className="c-h5-vote-detail">
      <section className="c-h5-vote-results">
        <h2 className="c-h5-vote-section">实时结果</h2>
        {questions.map((question, index) => {
          const related = answers.filter((item) => item.questionId === question.id);
          const average = averageQuestionScore(question, related);
          const tallies = isChoiceQuestionType(question.type) ? tallyQuestionChoices(question, related) : [];
          return (
            <section key={question.id} className="c-h5-vote-q">
              <h2>
                {index + 1}. {question.stem}
                <small>{question.type}</small>
              </h2>
              {isChoiceQuestionType(question.type)
                ? tallies.map((row) => (
                    <div key={row.choice.id} className="c-h5-vote-bar">
                      <div className="c-h5-vote-bar-meta">
                        <span>
                          {voteChoiceTitle(row.choice)}
                          {latestChoiceIds.has(row.choice.id) ? <b>本次</b> : null}
                        </span>
                        <span>
                          {row.voteCount}票{row.percent == null ? '' : ` · ${row.percent}%`}
                        </span>
                      </div>
                      <div className="c-h5-vote-bar-track">
                        <span style={{ width: `${row.percent ?? 0}%` }} />
                      </div>
                    </div>
                  ))
                : null}
              {question.type === '打分题' ? (
                <div className="c-h5-vote-avg">
                  <p>均分 {average == null ? '暂无' : average}</p>
                  {scoreDistribution(question, related).map((row) => (
                    <p key={row.score}>
                      {row.score}分 {row.count}票
                    </p>
                  ))}
                </div>
              ) : null}
              {question.type === '问答题' ? <p className="c-h5-vote-collect">已收集 {related.length} 条</p> : null}
            </section>
          );
        })}
      </section>
    </div>
  );

  return (
    <VoteShell
      surface={surface}
      className="is-vote is-detail"
      title="票数"
      onBack={back}
      detail
      footer={surface === 'h5' && canTake ? <div className="c-h5-cta-bar">{takeCta}</div> : undefined}
    >
      {surface === 'pc' && canTake ? (
        <div className="c-pc-detail">
          {results}
          <aside className="c-pc-side">
            <h2 className="c-detail-name">{campaign.name}</h2>
            {takeCta}
          </aside>
        </div>
      ) : (
        results
      )}
    </VoteShell>
  );
}
