import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PcActivityShell } from './PcActivityShell';

describe('PC activity shell', () => {
  it('keeps the desktop chrome with the employee-activity title', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).toContain('<header class="c-pc-header">');
    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).not.toContain('活动广场');
    expect(html).not.toContain('手机版');
    expect(html).not.toContain('回主页');
    expect(html).toContain('内容');
  });
});
