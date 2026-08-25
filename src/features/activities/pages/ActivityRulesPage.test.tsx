import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityRulesPage } from './ActivityRulesPage';

describe('ActivityRulesPage', () => {
  it('shows signup range and three max caps', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityRulesPage />
      </App>,
    );
    expect(html).toContain('报名活动可得积分');
    expect(html).toContain('活动首评最多可得');
    expect(html).toContain('活动打分最多可得');
    expect(html).toContain('活动首次发布精彩瞬间最多可得');
  });
});
