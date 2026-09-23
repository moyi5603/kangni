import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PcActivityShell } from './PcActivityShell';

describe('PC activity shell', () => {
  it('keeps the desktop chrome with the activity title', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).toContain('<header class="c-pc-header">');
    expect(html).toContain('<h1 class="c-pc-header-title">活动</h1>');
    expect(html).not.toContain('活动广场');
    expect(html).not.toContain('手机版');
    expect(html).not.toContain('回主页');
    expect(html).toContain('内容');
  });

  it('renders optional header actions in the third header column', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell headerActions={<button type="button">我的活动</button>}>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).toContain('c-pc-header-actions');
    expect(html).toContain('>我的活动</button>');
  });

  it('omits the actions slot when headerActions is missing', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).not.toContain('c-pc-header-actions');
    expect(html).not.toContain('我的活动');
  });
});
