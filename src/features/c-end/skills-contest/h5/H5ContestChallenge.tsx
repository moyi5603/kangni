import { useMemo, useRef, useState } from 'react';
import { goH5Back, toH5ContestSignupHash } from '../../../../app/navigation';
import { addContestWrongItems, getContest, recordGateAttempt, useChallengeDayLogs, useContestSignups, useContests } from '../../../skills-contest/model/contestStore';
import { useCEndToast } from '../../activities/components/CEndToast';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import {
  buildGatePaper,
  canEnterChallenge,
  collectWrongAnswers,
  contestGateState,
  currentStage,
  DEMO_CONTEST_USER,
  east8Date,
  mySignup,
  summarizeGate,
  todayGateLog,
} from '../model/clientContest';
import { ContestGateResult } from './ContestGateResult';
import { ContestTrailMap } from './ContestTrailMap';
import { H5ContestShell } from './H5ContestShell';

export function H5ContestChallenge({ id }: { id: number }) {
  useContests();
  useChallengeDayLogs(id);
  const toast = useCEndToast();
  const contest = getContest(id);
  const signups = useContestSignups(id);
  const signup = contest ? mySignup(id, signups) : undefined;
  const stage = contest ? currentStage(contest) : undefined;
  const log = contest && signup && stage ? todayGateLog(id, stage.id, signup.id) : undefined;
  const [playing, setPlaying] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof summarizeGate> & { gateIndex: number } | null>(null);
  const startedAt = useRef(Date.now());
  const paper = useMemo(() => (stage ? buildGatePaper(stage) : []), [stage]);

  if (!contest || !stage) {
    return (
      <H5ContestShell title="闯关" onBack={goH5Back}>
        <p className="c-empty">赛事不存在</p>
      </H5ContestShell>
    );
  }

  if (!signup) {
    return (
      <H5ContestShell title="每日闯关" onBack={goH5Back}>
        <div className="c-contest-challenge">
          <p className="c-empty">报名后才能闯关</p>
          <a className="c-contest-cta" href={toH5ContestSignupHash(id)}>
            去报名
          </a>
        </div>
      </H5ContestShell>
    );
  }

  if (!canEnterChallenge(contest, signup)) {
    return (
      <H5ContestShell title="每日闯关" onBack={goH5Back}>
        <p className="c-empty">当前阶段暂无闯关资格</p>
      </H5ContestShell>
    );
  }

  const finishGate = () => {
    if (playing == null) return;
    const summary = summarizeGate(paper, answers, stage.passCorrectCount, (Date.now() - startedAt.current) / 1000);
    recordGateAttempt({
      contestId: id,
      stageId: stage.id,
      signupId: signup.id,
      gateIndex: playing,
      passed: summary.passed,
      date: east8Date(),
    });
    addContestWrongItems({
      contestId: id,
      signupId: signup.id,
      stageId: stage.id,
      items: collectWrongAnswers(paper, answers),
    });
    setResult({ ...summary, gateIndex: playing });
    setPlaying(null);
    setCursor(0);
    setAnswers({});
  };

  if (result) {
    return (
      <ContestGateResult
        gateIndex={result.gateIndex}
        passed={result.passed}
        durationSeconds={result.durationSeconds}
        correctCount={result.correctCount}
        accuracy={result.accuracy}
        userId={DEMO_CONTEST_USER.name}
        onBack={() => setResult(null)}
      />
    );
  }

  if (playing != null) {
    const question = paper[cursor];
    const last = cursor >= paper.length - 1;
    return (
      <H5ContestShell title={`关 ${playing + 1}`} onBack={() => setPlaying(null)}>
        {question ? (
          <div className="c-contest-quiz">
            <p className="c-contest-quiz-progress">
              {cursor + 1} / {paper.length}
            </p>
            <h2>{question.stem}</h2>
            <ul>
              {question.options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className={answers[question.id] === option ? 'is-on' : undefined}
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="c-contest-cta"
              type="button"
              disabled={!answers[question.id]}
              onClick={() => (last ? finishGate() : setCursor((value) => value + 1))}
            >
              {last ? '提交本关' : '下一题'}
            </button>
          </div>
        ) : (
          <p className="c-empty">暂无题目</p>
        )}
      </H5ContestShell>
    );
  }

  const passedCount = Array.from({ length: stage.dailyGateCount }).filter((_, index) => log?.gates[index]?.passed).length;
  const percent = Math.round((passedCount / Math.max(stage.dailyGateCount, 1)) * 100);

  const tryPlay = (index: number) => {
    if (contestGateState(index, log?.gates, stage.dailyGateCount) === 'locked') {
      toast.show('先通关前一关');
      return;
    }
    setPlaying(index);
    setCursor(0);
    setAnswers({});
    startedAt.current = Date.now();
  };

  return (
    <H5ActivityShell className="is-contest is-trail" header={<span className="sr-only">闯关地图</span>}>
      <ContestTrailMap
        contestName={contest.name}
        stageName={stage.name}
        mapId={stage.mapId}
        count={stage.dailyGateCount}
        gates={log?.gates}
        paper={paper}
        percent={percent}
        onBack={goH5Back}
        onPlay={tryPlay}
      />
    </H5ActivityShell>
  );
}
