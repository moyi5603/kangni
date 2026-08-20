import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5CourseMall } from './H5CourseMall';

describe('H5 course mall catalog', () => {
  it('puts L1 on top, L2 on the left rail, and L3 on the sub header', () => {
    const html = renderToStaticMarkup(<H5CourseMall />);

    expect(html).toContain('class="c-h5-shell is-course is-mall"');
    expect(html).toContain('<h1 class="c-h5-title">课程列表</h1>');
    expect(html).toContain('aria-label="课程分类"');
    expect(html).toContain('aria-pressed="true">科技分类0001</button>');
    expect(html).toContain('快速上手销售技巧');
    expect(html).toContain('产品需求分析实战');
    expect(html).not.toContain('招聘面试技巧');
    expect(html).not.toContain('c-h5-course-l3-trigger');
    expect(html).not.toContain('横滑筛选');
    expect(html).not.toContain('c-h5-course-mode');
  });

  it('is the only course H5 mounted from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="courses" />);

    expect(html).toContain('class="c-h5-shell is-course is-mall"');
    expect(html).not.toContain('横滑筛选');
    expect(html).not.toContain('c-h5-course-mode');
  });
});
