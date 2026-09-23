import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ForumLinkBody } from './ForumLinkModal';

describe('ForumLinkBody', () => {
  it('shows the url and a copy action', () => {
    const html = renderToStaticMarkup(
      <ForumLinkBody title="二手论坛" url="https://corp.example/#/c/h5/forum/1" onCopy={() => undefined} />,
    );
    expect(html).toContain('二手论坛');
    expect(html).toContain('https://corp.example/#/c/h5/forum/1');
    expect(html).toContain('aria-label="C端链接"');
    expect(html).toContain('复制链接');
  });
});
