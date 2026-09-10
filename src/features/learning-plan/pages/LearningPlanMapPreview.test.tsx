import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { getLearningPlanStore } from '../model/learningPlanStore';
import { LearningPlanMapPreview } from './LearningPlanMapPreview';

const demoPlan = {
  id: 1,
  name: '安全日练',
  assignMode: 'once' as const,
  progressMode: 'daily' as const,
  dailyContent: 'fixed' as const,
  quizScope: 'cohort' as const,
  quizPassRate: 60,
  mapSkinId: 'city' as const,
  overtimeAllowed: true,
  taskSync: true,
  progressSync: true,
  status: 'published' as const,
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  stages: [
    {
      id: 's1',
      name: '基础',
      tasks: [
        { id: 'c1', type: 'course' as const, required: true, title: '安全课' },
        { id: 'q1', type: 'quiz' as const, required: true, title: '一练', quizMode: 'manual' as const, questionIds: [1] },
      ],
    },
    {
      id: 's2',
      name: '进阶',
      tasks: [{ id: 'e1', type: 'exam' as const, required: true, title: '安全考' }],
    },
  ],
};

describe('LearningPlanMapPreview', () => {
  beforeEach(() => {
    getLearningPlanStore().reset([demoPlan]);
    getLearningPlanStore().markCourseDone(1, 'demo', 'c1');
  });

  it('locks later stage and shows selected skin label', () => {
    const html = renderToStaticMarkup(
      <App>
        <LearningPlanMapPreview recordId="1" />
      </App>,
    );
    expect(html).toContain('城市路线');
    expect(html).toContain('基础');
    expect(html).toContain('未解锁');
  });
});
