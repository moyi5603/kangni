import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityDetailPage } from './ActivityDetailPage';
import { SignupList } from './ActivityRelatedListPage';
import { useActivities } from '../model/activityStore';

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
    expect(html).toContain('aria-label="复制创建"');
    expect((html.match(/ant-btn-primary/g) ?? []).length).toBe(1);
    expect(html).toContain('activity-detail-descriptions');
    expect(html).not.toContain('封面图片');
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
  });

  it('does not list session rows on the detail tab', () => {
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
    expect(html).not.toContain('报名截止');
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

describe('Activity related tabs', () => {
  it('puts signup count on the left and create on the right, with overflow row actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <SignupTab />
      </App>,
    );
    const total = html.indexOf('共 ');
    const exportBtn = html.indexOf('导出');
    const importBtn = html.indexOf('批量导入');
    const add = html.indexOf('添加人员');
    expect(total).toBeGreaterThan(-1);
    expect(exportBtn).toBeGreaterThan(total);
    expect(importBtn).toBeGreaterThan(exportBtn);
    expect(add).toBeGreaterThan(importBtn);
    expect(html).toContain('aria-label="查看 林销 的报名详情"');
    expect(html).toContain('aria-label="通过 林销 的报名"');
    expect(html).toContain('aria-label="驳回 林销 的报名"');
    expect(html).toContain('aria-label="更多操作 林销"');
    expect(html).not.toContain('aria-label="删除 林销 的报名"');
  });
});
