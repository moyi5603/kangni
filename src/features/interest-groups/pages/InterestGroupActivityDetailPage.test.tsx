import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupActivityDetailPage } from './InterestGroupActivityDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupActivityDetailPage', () => {
  it('renders header and default detail tab', () => {
    const html = renderPage(
      <InterestGroupActivityDetailPage
        recordId="101"
        onBack={() => undefined}
        onEdit={() => undefined}
        onTabChange={() => undefined}
      />,
    );
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('详情');
    expect(html).not.toContain('活动描述');
    expect(html).toContain('活动信息');
    expect(html).toContain('活动详情');
    expect(html.indexOf('活动详情')).toBeLessThan(html.indexOf('>场次<'));
    expect(html).toContain('活动标题');
    expect(html).toContain('创建时间');
    expect(html).toContain('创建人');
    expect(html).toContain('发布时间');
    expect(html).toContain('activity-detail-cover');
    expect(html).toContain('rich-text-preview');
    expect(html).toContain('报名');
    expect(html).not.toContain('报名情况');
    expect(html).toContain('举办方式');
    expect(html).toContain('报名时间');
    expect(html).toContain('报名截止时间');
    expect(html).toContain('活动终止时间');
    expect(html).toContain('2026-09-24 17:30');
    expect(html).not.toContain('可见范围');
    expect(html).not.toContain('高级设置');
    expect(html).not.toContain('报名信息收集');
    expect(html).not.toContain('活动积分');
    expect(html).toContain('发送消息通知');
    expect(html).toContain('扫码签到');
    expect(html).toContain('aria-label="签到码"');
    expect(html).not.toContain('是否审核报名');
    expect(html).not.toContain('报名司龄限制');
    expect(html).toContain('所属兴趣圈');
    expect(html).not.toContain('兴趣圈负责人');
    expect(html).toContain('评论');
    expect(html).toContain('精彩瞬间');
    expect(html).toContain('周期活动');
    expect(html).not.toMatch(/ant-tag[^>]*>周期活动/);
    expect(html).toContain('activity-detail-title-row');
    expect(html).toContain('activity-detail-header-actions');
    expect(html).toContain('activity-activity-header');
    expect(html).toContain('ant-statistic');
    expect(html).toContain('报名人数');
    expect(html).toContain('点赞');
    expect(html).not.toContain('aria-label="终止活动"'); // 101 夜跑未开始
    const header = html.slice(html.indexOf('activity-detail-header-card'), html.indexOf('ant-tabs'));
    expect(header.indexOf('所属兴趣圈')).toBe(-1);
    expect(header).toContain('活动时间：');
    expect(html).toContain('所属兴趣圈'); // still in detail tab
    const deleteAt = html.lastIndexOf('删除');
    expect(html.slice(Math.max(0, deleteAt - 400), deleteAt)).toMatch(/disabled/);
  });

  it('shows terminate only when in progress', () => {
    const html = renderPage(
      <InterestGroupActivityDetailPage recordId="201" onBack={() => undefined} onEdit={() => undefined} onTabChange={() => undefined} />,
    );
    expect(html).toContain('aria-label="终止活动"');
    expect(html).not.toContain('活动开始后方可终止');
  });

  it('hides the session table on a one-off activity', () => {
    const html = renderPage(
      <InterestGroupActivityDetailPage recordId="102" onBack={() => undefined} onEdit={() => undefined} onTabChange={() => undefined} />,
    );
    expect(html).toContain('活动详情');
    expect(html).not.toContain('>场次<');
  });

  it('shows signup list without status or actions', () => {
    const html = renderPage(
      <InterestGroupActivityDetailPage
        recordId="101"
        tab="signups"
        onBack={() => undefined}
        onEdit={() => undefined}
        onTabChange={() => undefined}
      />,
    );
    expect(html).toContain('李明');
    expect(html).toContain('姓名');
    expect(html).toContain('全部部门');
    expect(html.indexOf('部门')).toBeLessThan(html.indexOf('全部场次'));
    expect(html).toContain('共 ');
    expect(html).toContain('全部场次');
    expect(html).toContain('signup-session-search-select');
    expect(html).toContain('ant-select-show-search');
    expect(html).toContain('第 1 场');
    expect(html).toContain('场次时间');
    expect(html).not.toContain('名额');
    expect(html).not.toContain('操作');
    expect(html).not.toContain('批量通过');
    expect(html).not.toContain('批量驳回');
  });
});
