import { describe, expect, it } from 'vitest';
import { applyRichTextBlockBackground, readRichTextBlockBackground } from './richTextBackground';

describe('richTextBlockBackground', () => {
  it('wraps html with a block background and can clear it', () => {
    const withBg = applyRichTextBlockBackground('<p>介绍</p>', '#fff1b8');
    expect(readRichTextBlockBackground(withBg)).toBe('#fff1b8');
    expect(withBg).toContain('data-rt-block-bg');
    expect(withBg).toContain('<p>介绍</p>');
    expect(applyRichTextBlockBackground(withBg, null)).toBe('<p>介绍</p>');
  });
});
