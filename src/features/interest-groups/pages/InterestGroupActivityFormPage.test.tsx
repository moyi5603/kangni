import { readFileSync } from 'node:fs';
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
    expect(html).toContain('所属兴趣圈');
    expect(html).not.toContain('兴趣圈负责人');
    expect(html).toContain('举办方式');
    expect(html).toContain('活动时间');
    expect(html).toContain('报名时间');
    expect(html).toContain('报名总人数');
    expect(html).not.toContain('每场人数上限');
    expect(html).toContain('活动详情');
    expect(html).not.toContain('可见范围');
    expect(html).toContain('发送消息通知');
    expect(html).toContain('仅通知兴趣圈成员');
    expect(html).not.toContain('通知对象');
    expect(html).not.toContain('全员');
    expect(html).toContain('扫码签到');
    expect(html).not.toContain('报名信息收集');
    expect(html).not.toContain('高级设置');
    expect(html).not.toContain('活动积分');
    expect(html).not.toContain('是否审核报名');
    expect(html).not.toContain('报名司龄限制');
    expect(html).not.toContain('审批流节点');
    expect(html).toContain('AI 帮写');
    expect(html).not.toContain('AI 策划');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
    expect(html).not.toContain('保存活动');
    expect(html).toContain('aria-label="保存"');
    expect(html).toContain('aria-label="取消"');
    const location = html.indexOf('活动地点');
    const group = html.indexOf('所属兴趣圈');
    const schedule = html.indexOf('举办方式');
    const activityTime = html.indexOf('活动时间');
    const signup = html.indexOf('报名时间');
    const quota = html.indexOf('报名总人数');
    const detail = html.indexOf('aria-label="活动详情"');
    const cancel = html.indexOf('aria-label="取消"');
    const save = html.indexOf('aria-label="保存"');
    expect(group).toBeGreaterThan(location);
    expect(activityTime).toBeGreaterThan(group);
    expect(html).toContain('activity-time-field');
    expect(schedule).toBeGreaterThan(activityTime);
    expect(signup).toBeGreaterThan(schedule);
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
    expect(html).toContain('周一');
    expect(html).toContain('ant-checkbox');
    expect(html).not.toContain('ant-checkbox-group');
    expect(html).not.toContain('周期起止');
    expect(html).toContain('报名开始');
    expect(html).toContain('报名截止');
    expect(html).toContain('aria-label="保存"');
    expect(html).not.toContain('保存修改');
  });

  it('lets create-mode 周期活动 check 重复周几 without Checkbox.Group swallowing the first click', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="create"
        draft={{
          coverUrl: '/x.jpg',
          title: '周四夜跑',
          groupId: 1,
          categoryKey: 'sport',
          type: 'recurring',
          sessions: [],
          signupStartAt: '2026-06-01 09:00',
          signupEndAt: '2026-09-24 18:00',
          signupHoursBefore: 2,
          visibility: '全员',
          departments: [],
          customPeople: [],
          importFileName: '',
          importedPeople: [],
          notifyOnPublish: false,
          notifyAudience: 'members',
          needAudit: false,
          signupApprovalNodes: [],
          signupFields: [],
          signupPoints: 1,
          signupPointsEnabled: false,
          checkInEnabled: false,
          checkInOpenMode: 'before_start',
          checkInOpenMinutesBefore: 30,
          checkInValidAfterStart: 3,
          checkInValidAfterStartUnit: 'day',
          checkInDynamicQr: false,
          location: '滨江绿道',
          capacity: 20,
          detailHtml: '<p>夜跑</p>',
          startAt: '2026-06-04 19:30',
          endAt: '2026-09-24 21:00',
          repeatRules: [],
        }}
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
    );
    expect(html).toContain('重复周几');
    expect(html).toContain('周四');
    expect(html).not.toContain('ant-checkbox-group');
    expect(html).toContain('ant-checkbox');
    expect(html).not.toMatch(/ant-checkbox-wrapper-disabled/);
  });

  it('lays out 周期活动 周几时段 two per row', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="edit"
        recordId="101"
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
    );
    expect(html).toContain('周四');
    expect(html).toContain('repeat-session-grid');
    expect(html).toContain('time-range');
    expect(html).toContain('ant-col-12');
    const source = readFileSync(new URL('./InterestGroupActivityFormPage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('<TimePicker');
    expect(source).not.toContain('TimePicker.RangePicker');
    expect(source).toMatch(/repeat-session-grid[\s\S]*?<Col\s+span=\{12\}/);
    const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.edit-form \.repeat-session-grid \.ant-form-item-row\s*\{\s*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\.edit-form \.time-range\s*\{[^}]*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\.edit-form \.ant-form-item-label\s*\{[^}]*flex:\s*0 0 112px/);
    expect(css).not.toMatch(/\.edit-form \.repeat-session-grid \.ant-form-item-label\s*\{[^}]*flex:\s*0 0 auto/);
    expect(css).toMatch(
      /@media \(max-width: 900px\)[\s\S]*\.edit-form \.repeat-session-grid \.ant-form-item-row\s*\{\s*flex-wrap:\s*nowrap/,
    );
  });

  it('registers repeatRules on the form so weekday checks can stick', () => {
    const source = readFileSync(new URL('./InterestGroupActivityFormPage.tsx', import.meta.url), 'utf8');
    expect(source).toMatch(/<Form\.Item[^>]*name="repeatRules"/);
    expect(source).toMatch(/useWatch\(\s*'repeatRules',\s*\{\s*form,\s*preserve:\s*true\s*\}/);
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
          notifyAudience: 'members',
          needAudit: false,
          signupApprovalNodes: [],
          signupFields: [],
          signupPoints: 1,
          signupPointsEnabled: false,
          checkInEnabled: false,
          checkInOpenMode: 'before_start',
          checkInOpenMinutesBefore: 30,
          checkInValidAfterStart: 3,
          checkInValidAfterStartUnit: 'day',
          checkInDynamicQr: false,
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
    expect(html).toContain('支持 bmp/png/jpeg/jpg/gif，建议比例16:9，不超过 5MB');
    expect(html).not.toContain('重新生成封面');
    expect(html).not.toContain('AI 已生成');
    expect(html).toContain('上传封面');
    expect(html).not.toContain('/activities/basketball.jpg');
  });
});
