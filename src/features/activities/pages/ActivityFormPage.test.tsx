import { readFileSync } from 'node:fs';
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

  it('puts optional 报名分组设置 below visibility and out of signup field palette', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    const notify = html.indexOf('发送消息通知');
    const group = html.indexOf('报名分组设置');
    const collapse = html.indexOf('advanced-settings-collapse');
    expect(group).toBeGreaterThan(notify);
    expect(collapse).toBeGreaterThan(group);
    expect(html).toContain('可不设置');
    expect(html).toContain('不设置');
    expect(html).not.toContain('signup-field-groups');
    const paletteStart = html.indexOf('signup-fields-palette');
    const paletteEnd = html.indexOf('自定义字段', paletteStart);
    expect(html.slice(paletteStart, paletteEnd)).not.toContain('分组选择');
    expect(html.slice(paletteStart, paletteEnd)).not.toContain('报名分组设置');
  });

  it('selects recurring weekdays like interest-group create, not checkbox group', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="edit" recordId="8" onBack={() => undefined} />
      </App>,
    );
    expect(html).toContain('重复周几');
    expect(html).toContain('repeat-weekday-checks');
    expect(html).toContain('周四');
    expect(html).not.toContain('ant-checkbox-group');
    expect(html).toContain('ant-checkbox');
    const source = readFileSync(new URL('./ActivityFormPage.tsx', import.meta.url), 'utf8');
    expect(source).toMatch(/<Form\.Item[^>]*name="repeatRules"/);
    expect(source).toMatch(/useWatch\(\s*'repeatRules',\s*\{\s*form,\s*preserve:\s*true\s*\}/);
  });

  it('lays out recurring weekday time rules at most two per row', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="edit" recordId="8" onBack={() => undefined} />
      </App>,
    );
    expect(html).toContain('重复周几');
    expect(html).toContain('repeat-session-grid');
    expect(html).toContain('周五时段');
    expect(html).toContain('time-range');
    expect(html).toContain('ant-col-12');
    const source = readFileSync(new URL('./ActivityFormPage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('<TimePicker');
    expect(source).not.toContain('TimePicker.RangePicker');
    expect(source).toMatch(/repeat-session-grid[\s\S]*?<Col\s+span=\{12\}/);
    expect(html).not.toContain('repeat-rule-grid');
    const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.edit-form \.repeat-session-grid \.ant-form-item-row\s*\{\s*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\.edit-form \.time-range\s*\{[^}]*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\.edit-form \.ant-form-item-label\s*\{[^}]*flex:\s*0 0 112px/);
    expect(css).not.toMatch(/\.edit-form \.repeat-session-grid \.ant-form-item-label\s*\{[^}]*flex:\s*0 0 auto/);
    expect(css).toMatch(
      /@media \(max-width: 900px\)[\s\S]*\.edit-form \.repeat-session-grid \.ant-form-item-row\s*\{\s*flex-wrap:\s*nowrap/,
    );
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
    expect(activityTime).toBeGreaterThan(location);
    expect(html).toContain('activity-time-field');
    expect(schedule).toBeGreaterThan(activityTime);
    expect(signup).toBeGreaterThan(schedule);
    expect(quota).toBeGreaterThan(signup);
    expect(detail).toBeGreaterThan(quota);
    expect(html).not.toContain('每场人数上限');
    expect(html).not.toContain('schedule-linked');
    expect(html).not.toContain('联系电话');
  });

  it('pins form actions with cancel, save, then save-and-publish on create', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    const cancel = html.indexOf('aria-label="取消"');
    const save = html.indexOf('aria-label="保存"');
    const submit = html.indexOf('aria-label="保存并发布"');
    expect(cancel).toBeGreaterThan(-1);
    expect(save).toBeGreaterThan(cancel);
    expect(submit).toBeGreaterThan(save);
    expect(html).not.toContain('aria-label="提交审核"');
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

  it('keeps only minutes-before-start for check-in in advanced settings', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    expect(html).toContain('扫码签到');
    expect(html).not.toContain('活动开始后可扫');
    expect(html).not.toContain('二维码有效期');
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
      expect(html).toContain('规则范围');
      expect(html).not.toContain('每日上限');
      expect(html).not.toContain('活动首评可得积分');
      expect(html).not.toContain('活动打分可得积分');
      expect(html).not.toContain('首次发布精彩瞬间可得积分');
      expect(html.indexOf('活动设置')).toBeLessThan(html.indexOf('活动积分'));
      expect(html).not.toContain('是否开启精彩瞬间审核');
      expect(html).not.toContain('精彩瞬间审核');
    }
  });

  it('locks edit form after the activity has ended', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="edit" recordId="14" onBack={() => undefined} />
      </App>,
    );
    expect(html).toContain('活动已结束，不能编辑');
    expect(html).not.toContain('aria-label="保存"');
  });
});
