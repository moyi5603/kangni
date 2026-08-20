import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndPortal } from './CEndPortal';

describe('C-end portal', () => {
  it('lists activity PC, activity H5, and course H5 entries', () => {
    const html = renderToStaticMarkup(<CEndPortal />);

    expect(html).toContain('C 端预览');
    expect(html).toContain('>活动 PC<');
    expect(html).toContain('href="#/c/pc"');
    expect(html).toContain('>活动 H5<');
    expect(html).toContain('href="#/c/h5"');
    expect(html).toContain('>课程 PC<');
    expect(html).toContain('href="#/c/course"');
    expect(html).toContain('>课程 H5<');
    expect(html).toContain('href="#/c/h5/courses"');
    expect(html).toContain('返回后台');
  });
});
