import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityFormPage } from './ActivityFormPage';

describe('ActivityFormPage', () => {
  it('puts visibility on the main form before advanced settings', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    const notify = html.indexOf('发送消息通知');
    const collapse = html.indexOf('advanced-settings-collapse');
    expect(notify).toBeGreaterThan(-1);
    expect(collapse).toBeGreaterThan(notify);
    expect(html).toContain('发送消息通知');
    expect(html).toContain('活动发布后自动发送消息通知');
  });

  it('keeps schedule fields grouped without extra section cards', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    const location = html.indexOf('活动地点');
    const schedule = html.indexOf('举办方式');
    const activityTime = html.indexOf('活动时间');
    const quota = html.indexOf('报名总人数');
    const signup = html.indexOf('报名时间');
    const detail = html.indexOf('aria-label="活动详情"');
    expect(schedule).toBeGreaterThan(location);
    expect(activityTime).toBeGreaterThan(schedule);
    expect(signup).toBeGreaterThan(activityTime);
    expect(quota).toBeGreaterThan(signup);
    expect(detail).toBeGreaterThan(quota);
    expect(html).not.toContain('每场人数上限');
    expect(html).not.toContain('schedule-linked');
    expect(html).not.toContain('联系电话');
  });

  it('pins form actions with cancel, save, then submit review on create', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    const cancel = html.indexOf('aria-label="取消"');
    const save = html.indexOf('aria-label="保存"');
    const submit = html.indexOf('aria-label="提交审核"');
    expect(cancel).toBeGreaterThan(-1);
    expect(save).toBeGreaterThan(cancel);
    expect(submit).toBeGreaterThan(save);
    expect(html).not.toContain('aria-label="提交审批"');
    expect((html.match(/ant-btn-primary/g) ?? []).length).toBe(1);
  });

  it('merges signup audit into one switch that reveals approval nodes', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    expect(html).toContain('是否审核报名');
    expect(html).not.toContain('审批流节点');
    expect(html).not.toContain('是否开启报名审批流');
    expect(html).not.toContain('未设置审批流节点时，由管理员审核报名');
    expect(html).not.toContain('未开启时，由管理员进行审核');
  });

  it('only shows signup points on create and edit', () => {
    for (const props of [
      { mode: 'create' as const },
      { mode: 'edit' as const, recordId: '1' },
    ]) {
      const html = renderToStaticMarkup(
        <App>
          <ActivityFormPage {...props} onBack={() => undefined} />
        </App>,
      );
      expect(html).toContain('活动积分');
      expect(html).not.toContain('活动首评可得积分');
      expect(html).not.toContain('活动打分可得积分');
      expect(html).not.toContain('首次发布精彩瞬间可得积分');
      expect(html.indexOf('活动设置')).toBeLessThan(html.indexOf('活动积分'));
      expect(html).not.toContain('是否开启精彩瞬间审核');
      expect(html).not.toContain('精彩瞬间审核');
    }
  });
});
