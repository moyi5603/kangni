import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { validateBadgeDescription } from '../model/incentive';
import { IncentiveBadgeFormPage } from './IncentiveBadgeFormPage';

const noop = () => {};

describe('IncentiveBadgeFormPage', () => {
  it('renders create heading', () => {
    const html = renderToStaticMarkup(
      <App>
        <IncentiveBadgeFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建勋章');
    expect(html).toContain('勋章图标');
    expect(html).toContain('建议比例1:1');
    expect(html).toContain('勋章归属');
    expect(html).toContain('勋章名称');
    expect(html).toContain('适用组织');
    expect(html).toContain('启用状态');
    expect(html).toContain('【行为定义】');
    expect(html).toContain('【积分认定标准】');
    expect(html).toContain('【典型场景说明】');
    expect(html).toContain('【不计分情形】');
  });

  it('rejects a description that is missing the four section titles', () => {
    expect(validateBadgeDescription('只有一段').ok).toBe(false);
  });
});
