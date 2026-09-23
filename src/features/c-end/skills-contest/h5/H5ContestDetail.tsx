import {
  goH5Back,
  toH5ContestChallengeHash,
  toH5ContestRankHash,
  toH5ContestSignupHash,
} from '../../../../app/navigation';
import { contestStatusOf, stageOrdinalLabel } from '../../../skills-contest/model/contest';
import { getContest, useContestSignups, useContests } from '../../../skills-contest/model/contestStore';
import { canEnterChallenge, formatContestRange, mySignup } from '../model/clientContest';
import { H5ContestShell } from './H5ContestShell';

export function H5ContestDetail({ id }: { id: number }) {
  useContests();
  const contest = getContest(id);
  const signups = useContestSignups(id);

  if (!contest) {
    return (
      <H5ContestShell title="赛事不存在" onBack={goH5Back}>
        <p className="c-empty">赛事不存在</p>
      </H5ContestShell>
    );
  }

  const signup = mySignup(id, signups);
  const status = contestStatusOf(contest);
  const canChallenge = canEnterChallenge(contest, signup);

  return (
    <H5ContestShell title="赛事详情" onBack={goH5Back}>
      <article className="c-contest-detail">
        <header className="c-contest-detail-head">
          <img src={contest.logoUrl} alt="" />
          <div>
            <h2>{contest.name}</h2>
            <em className={`is-${status}`}>{status}</em>
          </div>
        </header>
        <p className="c-contest-detail-time">{formatContestRange(contest.startAt, contest.endAt)}</p>
        <p className="c-contest-detail-desc">{contest.description || '暂无介绍'}</p>
        <h3>赛程阶段</h3>
        <ol className="c-contest-stages">
          {contest.stages.map((stage, index) => (
            <li key={stage.id}>
              <b>
                {stageOrdinalLabel(index)} · {stage.name}
              </b>
              <small>{formatContestRange(stage.startAt, stage.endAt)}</small>
            </li>
          ))}
        </ol>
        <div className="c-contest-detail-actions">
          {signup ? (
            <a className="c-contest-cta" href={canChallenge ? toH5ContestChallengeHash(contest.id) : toH5ContestRankHash(contest.id)}>
              {canChallenge ? '去闯关' : '查看排行'}
            </a>
          ) : (
            <a className="c-contest-cta" href={toH5ContestSignupHash(contest.id)}>
              立即报名
            </a>
          )}
        </div>
      </article>
    </H5ContestShell>
  );
}
