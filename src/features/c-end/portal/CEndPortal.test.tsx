import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndPortal } from './CEndPortal';

describe('C-end portal', () => {
  it('lists activity, course, exam, and vote H5 entries without honor', () => {
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
    expect(html).toContain('>考试 PC<');
    expect(html).toContain('href="#/c/exam"');
    expect(html).toContain('>考试 H5<');
    expect(html).toContain('href="#/c/h5/exams"');
    expect(html).toContain('>投票 H5<');
    expect(html).toContain('href="#/c/h5/votes"');
    expect(html).toContain('普通投票 · 手机');
    expect(html).toContain('>投票 PC<');
    expect(html).toContain('href="#/c/pc/votes"');
    expect(html).toContain('普通投票 · 宽屏门户');
    expect(html).toContain('>兴趣小组 H5<');
    expect(html).toContain('href="#/c/h5/interest-groups"');
    expect(html).toContain('兴趣小组 · 手机');
    expect(html).toContain('>兴趣小组 PC<');
    expect(html).toContain('href="#/c/pc/interest-groups"');
    expect(html).toContain('兴趣小组 · 宽屏门户');
    expect(html).not.toContain('评优 H5');
    expect(html).not.toContain('href="#/c/h5/honor"');
    expect(html).not.toContain('href="#/c/h5/honor-admin"');
    expect(html).toContain('返回后台');
  });
});
