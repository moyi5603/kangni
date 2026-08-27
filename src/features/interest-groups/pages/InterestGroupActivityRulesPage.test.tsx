import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupActivityRulesPage } from './InterestGroupActivityRulesPage';

describe('InterestGroupActivityRulesPage', () => {
  it('shows signup range, grant points and daily caps like the activities app', () => {
    const html = renderToStaticMarkup(
      <App>
        <InterestGroupActivityRulesPage />
      </App>,
    );
    expect(html).toContain('规则设置');
    expect(html).toContain('兴趣小组');
    expect(html).toContain('活动积分');
    expect(html).toContain('活动评论可得');
    expect(html).toContain('活动打分可得');
    expect(html).toContain('发布精彩瞬间可得');
    expect(html).toContain('每日上限');
    expect(html).toContain('是否允许员工创建小组');
    expect(html).toContain('是否允许小组成员创建活动');
    expect(html).toContain('员工创建小组是否需要审核');
    expect(html).toContain('员工创建活动是否需要管理员审核');
    expect(html).toContain('ig-create-permission-card');
    expect(html).not.toContain('活动首评最多可得');
    expect(html).not.toContain('活动首次发布精彩瞬间最多可得');
  });
});
