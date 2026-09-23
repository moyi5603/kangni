import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityDetailPage } from './ActivityDetailPage';
import { ActivityMomentListPage } from './ActivityMomentListPage';
import { CommentList, SignupList } from './ActivityRelatedListPage';
import { useActivities } from '../model/activityStore';
import { excerpt } from '../model/moment';

describe('ActivityDetailPage', () => {
  it('keeps one primary action on the same row as the title', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="1"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('activity-detail-title-row');
    expect(html).toContain('activity-detail-header-actions');
    expect(html).toContain('aria-label="编辑"');
    expect(html).toContain('活动已结束，不能编辑');
    expect(html).toContain('aria-label="复制创建"');
    expect((html.match(/ant-btn-primary/g) ?? []).length).toBe(1);
    expect(html).toContain('activity-detail-descriptions');
    expect(html).not.toContain('封面图片');
    expect(html).toContain('报名截止时间');
    expect(html).toContain('活动终止时间');
    expect(html).toContain('创建人');

    const header = html.slice(html.indexOf('activity-detail-header-card'), html.indexOf('ant-tabs'));
    expect(header).toContain('activity-activity-header');
    expect(header).toContain('activity-detail-cover');
    expect(header.indexOf('文化')).toBeGreaterThan(-1);
    expect(header.indexOf('activity-detail-title-row')).toBeGreaterThan(header.indexOf('文化'));
    expect(header.indexOf('活动时间：')).toBeGreaterThan(header.indexOf('activity-detail-title-row'));
    expect(header).toContain('报名时间：');
    expect(header).toContain('活动地点：');
    expect(header).toContain('报名截止时间');
    expect(header).toContain('活动终止时间');
    expect(header).toContain('报名人数');
    expect(header).toContain('评论数');
    expect(header).toContain('精彩瞬间数');
    expect(header.indexOf('评论数')).toBeGreaterThan(header.indexOf('报名人数'));
    expect(header.indexOf('精彩瞬间数')).toBeGreaterThan(header.indexOf('评论数'));
    expect(header.indexOf('待审核报名')).toBeGreaterThan(header.indexOf('精彩瞬间数'));
    expect(html).not.toContain('aria-label="终止活动"');
    expect(html).toContain('aria-label="删除"');
  });

  it('shows signup audit as one field without a separate approval-flow switch', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="2"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('是否审核报名');
    expect(html).not.toContain('是否开启报名审批流');
    expect(html).toContain('aria-label="终止活动"');
    expect(html).toContain('aria-label="删除"');
  });

  it('lists sessions below activity detail for a series', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="26"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('报名截止时间');
    expect(html).toContain('活动终止时间');
    expect(html.indexOf('活动详情')).toBeLessThan(html.indexOf('高级设置'));
    expect(html.indexOf('高级设置')).toBeLessThan(html.indexOf('>场次<'));
    expect(html).toContain('报名截止');
  });

  it('puts visibility and signup groups on the detail tab before advanced settings', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="2"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    const detail = html.indexOf('活动详情');
    const visibility = html.indexOf('可见范围');
    const groups = html.indexOf('报名分组设置');
    const advanced = html.indexOf('advanced-settings-collapse');
    expect(visibility).toBeGreaterThan(detail);
    expect(groups).toBeGreaterThan(visibility);
    expect(advanced).toBeGreaterThan(groups);
    const collapseStart = html.indexOf('advanced-settings-collapse');
    const collapseChunk = html.slice(collapseStart);
    expect(collapseChunk.indexOf('可见范围')).toBe(-1);
    expect(collapseChunk.indexOf('报名分组设置')).toBe(-1);
  });

  it('hides the session table on a one-off activity', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="1"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('活动详情');
    expect(html).not.toContain('>场次<');
  });

  it('allows edit while in progress and keeps 质量改进 groups on the detail tab', () => {
    const inProgress = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="2"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(inProgress).toContain('aria-label="编辑"');
    expect(inProgress).not.toContain('活动已结束，不能编辑');
    expect(inProgress).not.toContain('活动已终止，不能编辑');

    const quality = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="14"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(quality).toContain('报名分组设置');
    expect(quality).toContain('质量组（限 20 人）');
    expect(quality).toContain('工艺组（限 20 人）');
    expect(quality).toContain('活动已结束，不能编辑');
  });

  it('shows check-in QR tab and a header action when enabled', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDetailPage
          recordId="26"
          tab="checkin"
          onBack={() => undefined}
          onEdit={() => undefined}
          onCopy={() => undefined}
          onTabChange={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('aria-label="签到码"');
    expect(html).toContain('下载');
    expect(html).toContain('二维码');
  });
});

function SignupTab() {
  const activity = useActivities().find((item) => item.id === 2);
  if (!activity) return null;
  return <SignupList activity={activity} />;
}

function OnceSignupTab() {
  const activity = useActivities().find((item) => item.id === 1);
  if (!activity) return null;
  return <SignupList activity={activity} />;
}

function CommentTab() {
  const activity = useActivities().find((item) => item.id === 1);
  if (!activity) return null;
  return <CommentList activity={activity} />;
}

function MomentTab() {
  const activity = useActivities().find((item) => item.id === 1);
  if (!activity) return null;
  return <ActivityMomentListPage activity={activity} />;
}

describe('Activity related tabs', () => {
  it('puts signup count on the left and create on the right, with overflow row actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <SignupTab />
      </App>,
    );
    const peopleTotal = html.search(/共 \d+ 条/);
    const exportBtn = html.indexOf('导出');
    const importBtn = html.indexOf('批量导入');
    const add = html.indexOf('添加人员');
    expect(peopleTotal).toBeGreaterThan(-1);
    expect(exportBtn).toBeGreaterThan(peopleTotal);
    expect(importBtn).toBeGreaterThan(exportBtn);
    expect(add).toBeGreaterThan(importBtn);
    const detail = html.indexOf('aria-label="详情 林销"');
    const approve = html.indexOf('aria-label="通过 林销 的报名"');
    const reject = html.indexOf('aria-label="驳回 林销 的报名"');
    const more = html.indexOf('更多操作 林销');
    expect(detail).toBeGreaterThan(-1);
    expect(approve).toBeGreaterThan(detail);
    expect(reject).toBeGreaterThan(approve);
    expect(more).toBeGreaterThan(reject);
    expect(html).toContain('删除 林销 的报名');
    expect(html).not.toContain('aria-label="查看 林销 的报名详情"');
    expect(html).toContain('ant-btn-dangerous');
  });

  it('keeps a searchable session filter on the people list for series and hides it for a one-off', () => {
    const series = renderToStaticMarkup(
      <App>
        <SignupTab />
      </App>,
    );
    expect(series).toContain('全部场次');
    expect(series).toContain('signup-session-search-select');
    expect(series).toContain('ant-select-show-search');
    expect(series.indexOf('场次')).toBeGreaterThan(-1);
    expect(series.indexOf('场次')).toBeLessThan(series.indexOf('报名时间'));
    expect(series).toContain('第 1 场');
    expect(series).toContain('场次时间');
    expect(series).toContain('2026-08-31 09:30 ~ 2026-08-31 17:30');
    expect(series).not.toContain('共 3 场');
    expect(series).not.toContain('名额');

    const once = renderToStaticMarkup(
      <App>
        <OnceSignupTab />
      </App>,
    );
    expect(once).not.toContain('全部场次');
    expect(once).not.toContain('共 3 场');
  });

  it('puts reply before delete on comments', () => {
    const html = renderToStaticMarkup(
      <App>
        <CommentTab />
      </App>,
    );
    const reply = html.indexOf('aria-label="回复 张悦 的评论"');
    const remove = html.indexOf('aria-label="删除 张悦 的评论"');
    expect(reply).toBeGreaterThan(-1);
    expect(remove).toBeGreaterThan(reply);
    expect(html).toContain('点赞');
    expect(html.indexOf('点赞')).toBeGreaterThan(html.indexOf('评论时间'));
    expect(html.indexOf('点赞')).toBeLessThan(html.indexOf('aria-label="回复 张悦 的评论"'));
  });

  it('hides reply on the moments list and keeps detail then delete', () => {
    const html = renderToStaticMarkup(
      <App>
        <MomentTab />
      </App>,
    );
    const label = excerpt('开场致辞很有感染力，全家都来了。');
    const detail = html.indexOf(`aria-label="详情 ${label}"`);
    const remove = html.indexOf(`aria-label="删除 ${label}"`);
    expect(detail).toBeGreaterThan(-1);
    expect(remove).toBeGreaterThan(detail);
    expect(html).not.toContain(`aria-label="回复 ${label}"`);
    expect(html).not.toContain('回复评论');
  });
});
