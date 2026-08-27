import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteStoreForTests } from '../model/voteStore';
import { VoteListPage } from './VoteListPage';

beforeEach(() => {
  __resetVoteStoreForTests();
});

describe('VoteListPage', () => {
  it('renders filters, create action and seeded rows', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteListPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('投票管理');
    expect(html).toContain('创建投票');
    expect(html).toContain('投票名称');
    expect(html).toContain('匿名');
    expect(html).toContain('题目数');
    expect(html).toContain('午餐口味征集');
    expect(html).toContain('季度明星员工与作品');
    expect(html).toContain('创新项目投票');
    expect(html).toContain('分享');
    expect(html).toContain('aria-label="分享 午餐口味征集"');
    expect(html).not.toContain('普通投票');
    expect(html).not.toContain('评选投票');
    expect(html).not.toContain('本页先占位');
  });
});
