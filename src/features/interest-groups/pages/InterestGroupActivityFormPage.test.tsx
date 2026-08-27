import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { setPendingAiActivityDraft } from '../model/interestGroupActivityPlan';
import { InterestGroupActivityFormPage } from './InterestGroupActivityFormPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupActivityFormPage', () => {
  beforeEach(() => {
    setPendingAiActivityDraft(null);
  });

  it('renders create form with activity-style fields and actions', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage mode="create" onBack={() => undefined} onSaved={() => undefined} />,
    );
    expect(html).toContain('新建活动');
    expect(html).toContain('advanced-form-page');
    expect(html).toContain('form-2col');
    expect(html).toContain('活动标题');
    expect(html).toContain('分类');
    expect(html).toContain('活动地点');
    expect(html).toContain('所属小组');
    expect(html).not.toContain('小组负责人');
    expect(html).toContain('举办方式');
    expect(html).toContain('活动时间');
    expect(html).toContain('报名时间');
    expect(html).toContain('报名总人数');
    expect(html).not.toContain('每场人数上限');
    expect(html).toContain('活动详情');
    expect(html).toContain('可见范围');
    expect(html).toContain('报名信息收集');
    expect(html).toContain('AI 帮写');
    expect(html).not.toContain('AI 策划');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
    expect(html).not.toContain('保存活动');
    expect(html).toContain('aria-label="保存"');
    expect(html).toContain('aria-label="取消"');
    const location = html.indexOf('活动地点');
    const group = html.indexOf('所属小组');
    const schedule = html.indexOf('举办方式');
    const activityTime = html.indexOf('活动时间');
    const signup = html.indexOf('报名时间');
    const quota = html.indexOf('报名总人数');
    const detail = html.indexOf('aria-label="活动详情"');
    const cancel = html.indexOf('aria-label="取消"');
    const save = html.indexOf('aria-label="保存"');
    expect(group).toBeGreaterThan(location);
    expect(schedule).toBeGreaterThan(group);
    expect(activityTime).toBeGreaterThan(schedule);
    expect(signup).toBeGreaterThan(activityTime);
    expect(quota).toBeGreaterThan(signup);
    expect(detail).toBeGreaterThan(quota);
    expect(save).toBeGreaterThan(cancel);
  });

  it('prefills group when recordId is group id', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="create"
        recordId="1"
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
    );
    expect(html).toContain('城市夜跑团');
  });

  it('renders edit form with existing title and recurring schedule fields', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="edit"
        recordId="101"
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
    );
    expect(html).toContain('编辑活动');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('重复周几');
    expect(html).toContain('周期起止');
    expect(html).toContain('报名开始');
    expect(html).toContain('报名截止');
    expect(html).toContain('aria-label="保存"');
    expect(html).not.toContain('保存修改');
  });

  it('renders AI draft as editable publish form', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="create"
        presentation="ai"
        draft={{
          coverUrl: '/activities/basketball.jpg',
          title: '云端晨行看日出',
          groupId: 2,
          categoryKey: 'sport',
          type: 'series',
          sessions: [{ startAt: '2026-06-15 04:30', endAt: '2026-06-15 14:00' }, { startAt: '2026-06-29 04:30', endAt: '2026-06-29 14:00' }],
          signupStartAt: '2026-06-01 09:00',
          signupEndAt: '2026-06-14 18:00',
          signupHoursBefore: 2,
          visibility: '全员',
          departments: [],
          customPeople: [],
          importFileName: '',
          importedPeople: [],
          notifyOnPublish: false,
          needAudit: false,
          signupApprovalNodes: [],
          signupFields: [],
          signupPoints: 1,
          signupPointsEnabled: false,
          location: '云栖谷停车场',
          capacity: 24,
          detailHtml: '<p>日出</p>',
        }}
        onBack={() => undefined}
        onSaved={() => undefined}
        onRegenerate={() => undefined}
      />,
    );
    expect(html).toContain('AI 活动策划');
    expect(html).toContain('方案已生成');
    expect(html).toContain('确认并保存活动');
    expect(html).toContain('重新生成');
    expect(html).toContain('云端晨行');
    expect(html).toContain('第 1 场');
    expect(html).toContain('每场人数上限');
    expect(html).toContain('支持 jpg / png');
    expect(html).not.toContain('重新生成封面');
    expect(html).not.toContain('AI 已生成');
    expect(html).toContain('上传封面');
    expect(html).not.toContain('/activities/basketball.jpg');
  });
});
