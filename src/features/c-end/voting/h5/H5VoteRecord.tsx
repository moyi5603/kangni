import { goH5VoteRecords } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { employeeAvatarColor, employeeAvatarLetter } from '../../../activities/model/employeeAvatar';
import {
  getVote,
  getVoteQuestions,
  getVoteResponse,
  getVoteResponseAnswers,
  useVotes,
} from '../../../voting/model/voteStore';
import {
  isChoiceQuestionType,
  isVisualChoiceQuestionType,
  resolveVoteImageLayout,
  voteChoiceAvatarName,
  voteChoiceTitle,
  type VoteChoice,
  type VoteQuestion,
} from '../../../voting/model/voting';
import { DEMO_VOTE_USER, formatVoteCardTime } from '../model/clientVote';

function scoreRange(min: number, max: number): number[] {
  const rows: number[] = [];
  for (let score = min; score <= max; score += 1) rows.push(score);
  return rows;
}

function SnapshotChoice({
  choice,
  selected,
  image,
  layout,
}: {
  choice: VoteChoice;
  selected: boolean;
  image: boolean;
  layout: '上图下文' | '左图右文';
}) {
  const label = voteChoiceTitle(choice);
  const avatarName = voteChoiceAvatarName(choice);
  const showLabel = Boolean(choice.label.trim()) || !image;
  const showSubtitle = Boolean(choice.subtitle?.trim());
  const avatar = image && !choice.imageUrl;
  return (
    <div
      className={`c-h5-vote-choice${selected ? ' is-on' : ''}${image ? ` is-image is-${layout === '左图右文' ? 'row' : 'stack'}` : ''}`}
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
    </div>
  );
}

function SnapshotQuestion({
  index,
  question,
  choiceIds,
  text,
  score,
}: {
  index: number;
  question: VoteQuestion;
  choiceIds: number[];
  text: string;
  score: number | null;
}) {
  const visual = isVisualChoiceQuestionType(question.type);
  const layout = resolveVoteImageLayout(question.imageLayout);
  return (
    <section className="c-h5-vote-q">
      <h2>
        {index}. {question.stem}
        <small>{question.type}</small>
      </h2>
      {isChoiceQuestionType(question.type) ? (
        <div className={`c-h5-vote-choices${visual ? ` is-image is-${layout === '左图右文' ? 'row' : 'stack'}` : ''}`}>
          {question.choices.map((choice) => (
            <SnapshotChoice
              key={choice.id}
              choice={choice}
              selected={choiceIds.includes(choice.id)}
              image={visual}
              layout={layout}
            />
          ))}
        </div>
      ) : null}
      {question.type === '问答题' ? <p className="c-h5-vote-text">{text}</p> : null}
      {question.type === '打分题' ? (
        <div className="c-h5-vote-scores" role="group" aria-label="打分">
          {scoreRange(question.minScore, question.maxScore).map((value) => (
            <span key={value} className={`c-h5-vote-score${score === value ? ' is-on' : ''}`}>
              {value}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function H5VoteRecord({ id }: { id: number }) {
  useVotes();
  const response = getVoteResponse(id);
  const campaign = response ? getVote(response.campaignId) : undefined;
  const own = response?.voterId === DEMO_VOTE_USER.id;

  if (!response || !campaign || !own) {
    return (
      <H5ActivityShell className="is-vote is-detail is-snapshot" title="投票记录" onBack={goH5VoteRecords}>
        <p className="c-empty">记录不存在</p>
      </H5ActivityShell>
    );
  }

  const questions = getVoteQuestions(campaign.id);
  const answers = getVoteResponseAnswers(response.id);

  return (
    <H5ActivityShell className="is-vote is-detail is-snapshot" title={campaign.name} onBack={goH5VoteRecords} detail>
      <div className="c-h5-vote-detail">
        <p className="c-h5-vote-time">{formatVoteCardTime(response.submittedAt)}</p>
        {questions.map((question, index) => {
          const answer = answers.find((item) => item.questionId === question.id);
          return (
            <SnapshotQuestion
              key={question.id}
              index={index + 1}
              question={question}
              choiceIds={answer?.choiceIds ?? []}
              text={answer?.text ?? ''}
              score={answer?.score ?? null}
            />
          );
        })}
      </div>
    </H5ActivityShell>
  );
}
