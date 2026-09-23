import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ForumOverviewPage } from './ForumOverviewPage';
import { MailboxOverviewPage } from './MailboxOverviewPage';

describe('ForumOverviewPage', () => {
  it('shows forum dashboard metrics and latest posts', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumOverviewPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('概览');
    expect(html).toContain('论坛数');
    expect(html).toContain('帖子数');
    expect(html).toContain('评论数');
    expect(html).toContain('生效禁言');
    expect(html).not.toContain('置顶帖');
    expect(html).toContain('帖子论坛分布');
    expect(html).toContain('互动热度分层');
    expect(html).not.toContain('帖子标签分布');
    expect(html).not.toContain('置顶分布');
    expect(html).toContain('无评论');
    expect(html).toContain('最新帖子');
    expect(html).toContain('建议食堂增加低糖早餐选项');
    expect(html).toContain('发帖人');
    expect(html).toContain('overview-pie');
    expect(html).toContain('概览日期范围');
    expect(html).toContain('>日<');
    expect(html).toContain('>月<');
  });
});

describe('MailboxOverviewPage', () => {
  it('shows mailbox dashboard metrics and pending advice', () => {
    const html = renderToStaticMarkup(
      <App>
        <MailboxOverviewPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('概览');
    expect(html).toContain('信箱数');
    expect(html).toContain('建言数');
    expect(html).toContain('待回复');
    expect(html).toContain('已回复');
    expect(html).toContain('建言信箱分布');
    expect(html).toContain('回复情况');
    expect(html).toContain('待回复建言');
    expect(html).toContain('建议建立建言分发与闭环跟踪机制');
    expect(html).not.toContain('关于跨部门项目职责边界不清的情况反馈');
    expect(html).toContain('概览日期范围');
    expect(html).toContain('>日<');
    expect(html).toContain('>月<');
  });
});
