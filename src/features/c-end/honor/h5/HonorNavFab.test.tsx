import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HonorNavFab } from './HonorNavFab';

describe('HonorNavFab', () => {
  it('shows only 回主页 on the honor home', () => {
    const html = renderToStaticMarkup(
      <HonorNavFab atRoot onBack={() => undefined} onHome={() => undefined} />,
    );

    expect(html).toContain('class="c-h5-detail-fab is-home"');
    expect(html).toContain('回主页');
    expect(html).not.toContain('返回上一页');
  });

  it('shows 返回上一页 and 回主页 on nested honor pages', () => {
    const html = renderToStaticMarkup(
      <HonorNavFab atRoot={false} onBack={() => undefined} onHome={() => undefined} />,
    );

    expect(html).toContain('class="c-h5-detail-fab"');
    expect(html).not.toContain('is-home');
    expect(html).toContain('返回上一页');
    expect(html).toContain('回主页');
    expect(html.indexOf('返回上一页')).toBeLessThan(html.indexOf('回主页'));
  });
});
