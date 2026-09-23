import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityRulesPage } from './ActivityRulesPage';

describe('ActivityRulesPage', () => {
  it('shows signup min/max range and daily cap on other grants', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityRulesPage />
      </App>,
    );
    expect(html).toContain('规则设置（仅演示）');
    expect(html).toContain('活动积分');
    expect(html).toContain('placeholder="下限"');
    expect(html).toContain('placeholder="上限"');
    expect(html).toContain('活动评论可得');
    expect(html).toContain('活动打分可得');
    expect(html).toContain('发布精彩瞬间可得');
    expect(html).toContain('积分，每日上限');
    expect(html).not.toContain('活动首评最多可得');
    expect(html).not.toContain('活动首次发布精彩瞬间最多可得');
  });
});
