import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlaceholderPage } from './PlaceholderPage';

describe('PlaceholderPage', () => {
  it('puts placeholder copy on a white Card over the layout canvas', () => {
    const html = renderToStaticMarkup(
      <PlaceholderPage
        breadcrumbItems={[{ title: '工作台' }, { title: '数据看板' }]}
        title="数据看板"
        applicationLabel="工作台"
      />,
    );

    expect(html).toContain('ant-card');
    expect(html).toContain('数据看板');
    expect(html).toContain('当前应用「工作台」');
  });
});
