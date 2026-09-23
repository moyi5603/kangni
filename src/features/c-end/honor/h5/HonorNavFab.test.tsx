import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HonorNavFab } from './HonorNavFab';

describe('HonorNavFab', () => {
  it('renders nothing on the honor home', () => {
    const html = renderToStaticMarkup(
      <HonorNavFab atRoot onBack={() => undefined} onHome={() => undefined} />,
    );
    expect(html).toBe('');
    expect(html).not.toContain('回主页');
  });

  it('renders nothing on nested honor pages', () => {
    const html = renderToStaticMarkup(
      <HonorNavFab atRoot={false} onBack={() => undefined} onHome={() => undefined} />,
    );
    expect(html).toBe('');
    expect(html).not.toContain('返回上一页');
    expect(html).not.toContain('回主页');
  });
});
