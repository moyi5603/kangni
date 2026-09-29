import { useMemo } from 'react';
import {
  goH5Back,
  toH5CourseListHash,
  toH5ContestCertsHash,
} from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { listMyCourseRecords, listPublishedClientCourses } from '../../courses/model/clientCourse';
import { listPublishedClientExams } from '../../exams/model/clientExam';
import { listMedals } from '../../../medal/model/medalStore';
import { useChallengeDayLogs, useContestSignups, useContests } from '../../../skills-contest/model/contestStore';
import { contestRankBoard, DEMO_CONTEST_USER } from '../model/clientContest';

function formatHours(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function H5LearningArchive() {
  const contests = useContests();
  const contestId = contests[0]?.id ?? 0;
  useContestSignups(contestId);
  useChallengeDayLogs(contestId);

  const view = useMemo(() => {
    const courses = listPublishedClientCourses();
    const learning = listMyCourseRecords('learning', courses);
    const done = listMyCourseRecords('done', courses);
    const exams = listPublishedClientExams();
    const passedCount = exams.filter((exam) => exam.result === 'passed').length;
    const me = contestId ? contestRankBoard(contestId).find((row) => row.isMe) : undefined;
    const medals = listMedals().filter((medal) => medal.status === '有效').length;
    return {
      studyHours: done.length * 2 + learning.length * 0.5,
      points: me?.points ?? 0,
      credits: me?.credits ?? 0,
      courseCount: learning.length + done.length,
      examTotal: exams.length,
      examPassed: passedCount,
      examFailed: exams.length - passedCount,
      medals,
    };
  }, [contestId]);

  return (
    <H5ActivityShell className="is-archive" title="学习档案" onBack={goH5Back}>
      <div className="c-archive">
        <section className="c-archive-hero">
          <h2>{DEMO_CONTEST_USER.name}</h2>
          <ul className="c-archive-metrics">
            <li>
              <b>{formatHours(view.studyHours)}</b>
              <span>学习时长</span>
            </li>
            <li>
              <b>{view.points}</b>
              <span>积分</span>
            </li>
            <li>
              <b>{view.credits}</b>
              <span>学分</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="c-archive-title">个人荣誉</h3>
          <ul className="c-archive-honors">
            <li>
              <b>2</b>
              <span>项荣誉</span>
              <small>超过 82% 的人</small>
            </li>
            <li>
              <a href={toH5ContestCertsHash()}>
                <b>1</b>
                <span>张证书</span>
                <small>超过 61% 的人</small>
              </a>
            </li>
            <li>
              <b>{view.medals}</b>
              <span>枚勋章</span>
              <small>超过 74% 的人</small>
            </li>
          </ul>
        </section>

        <section className="c-archive-card">
          <h3>学习</h3>
          <a className="c-archive-row" href={toH5CourseListHash()}>
            <span>课程</span>
            <em>{view.courseCount}</em>
          </a>
          <div className="c-archive-row">
            <span>文档</span>
            <em>0</em>
          </div>
          <div className="c-archive-row">
            <span>直播</span>
            <em>0</em>
          </div>
        </section>

        <section className="c-archive-card">
          <h3>考试</h3>
          <div className="c-archive-row">
            <span>全部</span>
            <em>{view.examTotal}</em>
          </div>
          <div className="c-archive-row">
            <span>通过</span>
            <em>{view.examPassed}</em>
          </div>
          <div className="c-archive-row">
            <span>未通过</span>
            <em>{view.examFailed}</em>
          </div>
        </section>
      </div>
    </H5ActivityShell>
  );
}
