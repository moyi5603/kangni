import { useMemo, useState } from 'react';
import { Breadcrumb, Button, Card, Empty, Input, Radio, Space, Typography } from 'antd';
import { getQuestionStore } from '../../exams/model/questionStore';
import {
  MAP_SKINS,
  currentStageIndex,
  isTaskPassed,
  nextAttemptNo,
  quizPassedByRate,
  quizSeedKey,
  resolveQuizQuestionIds,
  shanghaiDayKey,
  type PlanTask,
} from '../model/learningPlan';
import { getLearningPlanStore, useLearningPlanSnapshot } from '../model/learningPlanStore';

const USER_ID = 'demo';

export function LearningPlanMapPreview({
  recordId,
  onBack,
}: {
  recordId?: string;
  onBack?: () => void;
}) {
  const snap = useLearningPlanSnapshot();
  const plan = snap.plans.find((item) => item.id === Number(recordId));
  const [day, setDay] = useState(() => shanghaiDayKey(Date.now()));
  const [quizTaskId, setQuizTaskId] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attempts, setAttempts] = useState<{ taskId: string; day: string }[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const practiceQuestions = getQuestionStore('practice').useQuestions();

  const progress = plan ? getLearningPlanStore().getProgress(plan.id, USER_ID) : undefined;
  const current = plan && progress ? currentStageIndex(plan.stages, progress, plan.progressMode, day) : 0;
  const skinLabel = plan ? (MAP_SKINS.find((item) => item.id === plan.mapSkinId)?.label ?? plan.mapSkinId) : '';

  const pool = useMemo(
    () => practiceQuestions.filter((item) => item.status === '启用').map((item) => item.id),
    [practiceQuestions],
  );

  const startQuiz = (task: PlanTask) => {
    if (!plan) return;
    const taskAttempts = attempts.filter((item) => item.taskId === task.id);
    const attemptNo = nextAttemptNo(taskAttempts, plan.progressMode, day);
    const seed = quizSeedKey({
      planId: plan.id,
      taskId: task.id,
      attemptNo,
      userId: USER_ID,
      naturalDate: day,
      progressMode: plan.progressMode,
      dailyContent: plan.dailyContent,
      quizScope: plan.quizScope,
    });
    setQuestionIds(resolveQuizQuestionIds(task, pool, seed));
    setAnswers({});
    setQuizResult(null);
    setQuizTaskId(task.id);
    setAttempts((prev) => [...prev, { taskId: task.id, day }]);
  };

  const submitQuiz = () => {
    if (!plan || !quizTaskId) return;
    let correct = 0;
    questionIds.forEach((id) => {
      const q = practiceQuestions.find((item) => item.id === id);
      if (q && q.answer && answers[id] === q.answer) correct += 1;
    });
    const rate = questionIds.length === 0 ? 0 : correct / questionIds.length;
    if (quizPassedByRate(rate, plan.quizPassRate)) {
      getLearningPlanStore().markQuizPassed(plan.id, USER_ID, quizTaskId, day);
      setQuizResult('已及格');
      setQuizTaskId(null);
    } else {
      setQuizResult('未及格');
    }
  };

  if (!plan || !progress) {
    return (
      <div className="page-stack">
        <Breadcrumb
          separator=">"
          items={[
            { title: '学习计划' },
            {
              title: onBack ? (
                <Button type="link" className="breadcrumb-link" onClick={onBack}>
                  计划管理
                </Button>
              ) : (
                '计划管理'
              ),
            },
            { title: '闯关预览' },
          ]}
        />
        <Card>
          <Empty description="计划不存在" />
          {onBack ? <Button onClick={onBack}>返回</Button> : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '学习计划' },
          {
            title: onBack ? (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                计划管理
              </Button>
            ) : (
              '计划管理'
            ),
          },
          { title: '闯关预览' },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {plan.name}
        </Typography.Title>
        <Typography.Text type="secondary">{skinLabel}</Typography.Text>
      </div>
      <Input
        value={day}
        onChange={(event) => setDay(event.target.value)}
        placeholder="YYYY-MM-DD"
        addonBefore="模拟日期"
        style={{ maxWidth: 320 }}
      />
      {plan.stages.map((stage, stageIndex) => {
        const locked = stageIndex > current;
        return (
          <Card key={stage.id} title={stage.name} extra={locked ? '未解锁' : undefined}>
            {locked ? (
              <Typography.Text type="secondary">未解锁</Typography.Text>
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {stage.tasks.map((task) => {
                  const passed = isTaskPassed(task, progress, plan.progressMode, day);
                  return (
                    <div key={task.id}>
                      <Space wrap>
                        <Typography.Text>
                          {task.title}
                          {passed ? '（已完成）' : ''}
                        </Typography.Text>
                        {task.type === 'course' && !passed ? (
                          <Button onClick={() => getLearningPlanStore().markCourseDone(plan.id, USER_ID, task.id)}>
                            标记完成
                          </Button>
                        ) : null}
                        {task.type === 'lecture' && !passed ? (
                          <Button onClick={() => getLearningPlanStore().markLectureDone(plan.id, USER_ID, task.id)}>
                            标记完成
                          </Button>
                        ) : null}
                        {task.type === 'exam' && !passed ? (
                          <Button onClick={() => getLearningPlanStore().markExamPassed(plan.id, USER_ID, task.id)}>
                            标记及格
                          </Button>
                        ) : null}
                        {task.type === 'quiz' && !passed ? (
                          <Button onClick={() => startQuiz(task)}>
                            {quizResult === '未及格' ? '再闯' : '开始闯关'}
                          </Button>
                        ) : null}
                      </Space>
                      {task.type === 'quiz' && quizTaskId === task.id ? (
                        <Space direction="vertical" style={{ marginTop: 12, width: '100%' }}>
                          {questionIds.map((id) => {
                            const q = practiceQuestions.find((item) => item.id === id);
                            return (
                              <div key={id}>
                                <Typography.Paragraph>{q?.stem ?? `题目 ${id}`}</Typography.Paragraph>
                                <Radio.Group
                                  value={answers[id]}
                                  onChange={(event) => setAnswers((prev) => ({ ...prev, [id]: event.target.value }))}
                                >
                                  {(q?.options ?? ['A', 'B']).map((opt, index) => (
                                    <Radio key={opt} value={String.fromCharCode(65 + index)}>
                                      {opt}
                                    </Radio>
                                  ))}
                                </Radio.Group>
                              </div>
                            );
                          })}
                          <Button type="primary" onClick={submitQuiz}>
                            交卷
                          </Button>
                          {quizResult ? <Typography.Text>{quizResult}</Typography.Text> : null}
                        </Space>
                      ) : null}
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>
        );
      })}
    </div>
  );
}
