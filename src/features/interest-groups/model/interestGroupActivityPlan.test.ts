import { describe, expect, it } from 'vitest';
import { planInterestGroupActivity, setPendingAiActivityDraft, takePendingAiActivityDraft } from './interestGroupActivityPlan';

describe('planInterestGroupActivity', () => {
  it('routes 夜跑 prompts to weekly riverside run', () => {
    const plan = planInterestGroupActivity('每周三下班后组织一次滨江夜跑，8 公里，分配速组');
    expect(plan.title).toBe('滨江 8K 夜跑');
    expect(plan.type).toBe('recurring');
    expect(plan.groupId).toBe(1);
    expect(plan.categoryKey).toBe('sport');
    expect(plan.repeatWeekday).toBe(3);
    expect(plan.timeStart).toBe('19:30');
    expect(plan.timeEnd).toBe('21:00');
    expect(plan.location).toContain('滨江');
    expect(plan.coverUrl).toBe('');
  });

  it('routes 登山 prompts to sunrise hike series', () => {
    const plan = planInterestGroupActivity('周末搞一次中级难度的登山看日出，需要拼车');
    expect(plan.title).toContain('日出');
    expect(plan.type).toBe('series');
    expect(plan.groupId).toBe(2);
    expect(plan.sessions).toHaveLength(2);
    expect(plan.sessions?.[0]?.startAt).toContain('04:30');
  });

  it('falls back to lunch board-game once', () => {
    const plan = planInterestGroupActivity('午休时间在休闲区办一个轻松的桌游局，适合新人');
    expect(plan.title).toContain('桌游');
    expect(plan.type).toBe('once');
    expect(plan.groupId).toBe(4);
    expect(plan.categoryKey).toBe('game');
    expect(plan.startAt).toContain('12:30');
    expect(plan.coverUrl).toBe('');
  });

  it('hands a pending draft to the create form once', () => {
    const draft = planInterestGroupActivity('桌游');
    setPendingAiActivityDraft(draft);
    expect(takePendingAiActivityDraft()?.title).toBe(draft.title);
    expect(takePendingAiActivityDraft()).toBeNull();
  });
});
