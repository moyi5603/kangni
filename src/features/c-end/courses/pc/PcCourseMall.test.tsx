import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { PcCourseMall } from './PcCourseMall';

describe('PC course mall catalog', () => {
  it('uses activity PC catalog layout instead of an enlarged H5 mall', () => {
    const html = renderToStaticMarkup(<PcCourseMall />);

    expect(html).toContain('class="c-pc-shell is-course"');
    expect(html).toContain('<h1 class="c-pc-header-title">课程</h1>');
    expect(html).toContain('手机版');
    expect(html).toContain('<h2 class="c-section-title">发现课程</h2>');
    expect(html).toContain('c-pc-grid');
    expect(html).toContain('c-pc-card');
    expect(html).toContain('aria-label="课程分类"');
    expect(html).toContain('aria-selected="true">科技分类0001</button>');
    expect(html).toContain('快速上手销售技巧');
    expect(html).toContain('href="#/c/course/2"');
    expect(html).not.toContain('c-h5-course-card');
    expect(html).not.toContain('c-h5-course-mall-l2');
    expect(html).not.toContain('c-pc-course-mall-nav');
  });

  it('is mounted from CEndApp PC courses page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="courses" />);

    expect(html).toContain('class="c-pc-shell is-course"');
    expect(html).toContain('发现课程');
    expect(html).toContain('快速上手销售技巧');
    expect(html).not.toContain('发现活动');
  });
});
