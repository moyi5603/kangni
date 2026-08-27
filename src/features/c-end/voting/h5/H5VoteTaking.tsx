import { useState } from 'react';
import dayjs from 'dayjs';
import { goVoteDetail, goVoteResults, type CEndSurface } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { getVote, getVoteQuestions, getVoteResponses, submitVoteResponse, useVotes } from '../../../voting/model/voteStore';
import {
  isChoiceQuestionType,
  isSingleChoiceQuestionType,
  isVisualChoiceQuestionType,
  resolveVoteImageLayout,
  resolveVoteStatus,
  voteChoiceTitle,
  voteChoiceAvatarName,
  voteQuotaExhaustedText,
  type VoteChoice,
  type VoteQuestion,
} from '../../../voting/model/voting';
import { employeeAvatarColor, employeeAvatarLetter } from '../../../activities/model/employeeAvatar';
import {
  DEMO_VOTE_USER,
  remainingQuota,
  resolveVoteDetailGate,
  todayKey,
  validateVoteDraft,
  type VoteDraftAnswer,
} from '../model/clientVote';
import { VoteShell } from '../VoteShell';

function scoreRange(min: number, max: number): number[] {
  const rows: number[] = [];
  for (let score = min; score <= max; score += 1) rows.push(score);
  return rows;
}

function patchDraft(
  draft: Record<number, VoteDraftAnswer>,
  questionId: number,
  patch: Partial<VoteDraftAnswer>,
): Record<number, VoteDraftAnswer> {
  const current = draft[questionId] ?? { choiceIds: [], text: '', score: null };
  return { ...draft, [questionId]: { ...current, ...patch } };
}

function ChoiceButton({
  choice,
  selected,
  image,
  layout,
  onSelect,
}: {
  choice: VoteChoice;
  selected: boolean;
  image: boolean;
  layout: '上图下文' | '左图右文';
  onSelect: () => void;
}) {
  const label = voteChoiceTitle(choice);
  const avatarName = voteChoiceAvatarName(choice);
  const showLabel = Boolean(choice.label.trim()) || !image;
  const showSubtitle = Boolean(choice.subtitle?.trim());
  const avatar = image && !choice.imageUrl;
  return (
    <button
      className={`c-h5-vote-choice${selected ? ' is-on' : ''}${image ? ` is-image is-${layout === '左图右文' ? 'row' : 'stack'}` : ''}`}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      {image && choice.imageUrl ? <img src={choice.imageUrl} alt="" /> : null}
      {avatar ? (
        <span className="c-h5-vote-person-avatar" style={{ background: employeeAvatarColor(avatarName) }} aria-hidden>
          {employeeAvatarLetter(avatarName)}
        </span>
      ) : null}
      {showLabel || showSubtitle ? (
        <span className="c-h5-vote-choice-copy">
          {showLabel ? <strong>{label}</strong> : null}
          {showSubtitle ? <em>{choice.subtitle}</em> : null}
        </span>
      ) : null}
    </button>
  );
}

function QuestionBlock({
  index,
  question,
  answer,
  onChange,
}: {
  index: number;
  question: VoteQuestion;
  answer: VoteDraftAnswer;
  onChange: (patch: Partial<VoteDraftAnswer>) => void;
}) {
  const visual = isVisualChoiceQuestionType(question.type);
  const layout = resolveVoteImageLayout(question.imageLayout);
  const multi = !isSingleChoiceQuestionType(question.type) && isChoiceQuestionType(question.type);
  return (
    <section className="c-h5-vote-q">
      <h2>
        {index}. {question.stem}
        <small>{question.type}</small>
      </h2>
      {isChoiceQuestionType(question.type) ? (
        <div className={`c-h5-vote-choices${visual ? ` is-image is-${layout === '左图右文' ? 'row' : 'stack'}` : ''}`}>
          {question.choices.map((choice) => {
            const selected = answer.choiceIds.includes(choice.id);
            return (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                selected={selected}
                image={visual}
                layout={layout}
                onSelect={() => {
                  if (multi) {
                    const next = selected ? answer.choiceIds.filter((id) => id !== choice.id) : [...answer.choiceIds, choice.id];
                    onChange({ choiceIds: next });
                    return;
                  }
                  onChange({ choiceIds: [choice.id] });
                }}
              />
            );
          })}
        </div>
      ) : null}
      {question.type === '问答题' ? (
        <textarea
          className="c-h5-vote-text"
          placeholder="请输入"
          maxLength={500}
          value={answer.text}
          onChange={(event) => onChange({ text: event.target.value })}
        />
      ) : null}
      {question.type === '打分题' ? (
        <div className="c-h5-vote-scores" role="group" aria-label="打分">
          {scoreRange(question.minScore, question.maxScore).map((score) => (
            <button
              key={score}
              className={`c-h5-vote-score${answer.score === score ? ' is-on' : ''}`}
              type="button"
              aria-pressed={answer.score === score}
              onClick={() => onChange({ score })}
            >
              {score}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function H5VoteTaking({ id, surface = 'h5' }: { id: number; surface?: CEndSurface }) {
  useVotes();
  const toast = useCEndToast();
  const campaign = getVote(id);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const dayKey = todayKey(now);
  const responses = campaign ? getVoteResponses(campaign.id) : [];
  const questions = campaign ? getVoteQuestions(campaign.id) : [];
  const remaining = campaign ? remainingQuota(campaign, DEMO_VOTE_USER.id, dayKey, responses) : 0;
  const gate = resolveVoteDetailGate(campaign, DEMO_VOTE_USER, now, 0);
  const status = campaign ? resolveVoteStatus(campaign, now) : '未开始';
  const [draft, setDraft] = useState<Record<number, VoteDraftAnswer>>({});
  const [busy, setBusy] = useState(false);
  const back = () => goVoteDetail(surface, id);

  let block: string | null = null;
  if (gate === 'forbidden') block = '无权参与该投票';
  else if (gate === 'missing') block = '投票不存在';
  else if (status === '未开始') block = '投票未开始';
  else if (status === '已结束') block = '投票已结束';
  else if (remaining <= 0) block = '今日次数已用完';

  if (block) {
    return (
      <VoteShell surface={surface} className="is-vote is-detail" title="投票" onBack={back}>
        <p className="c-empty">{block}</p>
      </VoteShell>
    );
  }

  if (!campaign) return null;

  const submitButton = (
    <button
      className="c-cta"
      type="button"
      disabled={busy}
      onClick={() => {
        if (busy) return;
        const message = validateVoteDraft(questions, draft);
        if (message) {
          toast.show(message);
          return;
        }
        setBusy(true);
        const result = submitVoteResponse({
          campaignId: campaign.id,
          voterId: DEMO_VOTE_USER.id,
          voterName: DEMO_VOTE_USER.name,
          answers: questions.map((question) => ({
            questionId: question.id,
            ...(draft[question.id] ?? { choiceIds: [], text: '', score: null }),
          })),
        });
        setBusy(false);
        if (!result.ok) {
          toast.show(result.reason === 'quota' ? voteQuotaExhaustedText(campaign.quotaMode) : '提交失败');
          return;
        }
        goVoteResults(surface, campaign.id);
      }}
    >
      提交
    </button>
  );

  const form = (
    <div className="c-h5-vote-detail">
      {questions.map((question, index) => (
        <QuestionBlock
          key={question.id}
          index={index + 1}
          question={question}
          answer={draft[question.id] ?? { choiceIds: [], text: '', score: null }}
          onChange={(patch) => setDraft((current) => patchDraft(current, question.id, patch))}
        />
      ))}
    </div>
  );

  return (
    <VoteShell
      surface={surface}
      className="is-vote is-detail"
      title="投票"
      onBack={back}
      detail
      footer={surface === 'h5' ? <div className="c-h5-cta-bar">{submitButton}</div> : undefined}
    >
      {surface === 'pc' ? (
        <div className="c-pc-detail">
          {form}
          <aside className="c-pc-side">
            <h2 className="c-detail-name">{campaign.name}</h2>
            {submitButton}
          </aside>
        </div>
      ) : (
        form
      )}
    </VoteShell>
  );
}
