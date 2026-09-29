import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5CourseMall } from './H5CourseMall';

describe('H5 course mall catalog', () => {
  it('puts L1 on top, L2 on the left rail, and L3 on the sub header', () => {
    const html = renderToStaticMarkup(<H5CourseMall />);

    expect(html).toContain('class="c-h5-shell is-course is-mall"');
    expect(html).toContain('<h1 class="c-h5-title">课程列表</h1>');
    expect(html).toContain('全部课程');
    expect(html).toContain('我的记录');
    expect(html.indexOf('全部课程')).toBeLessThan(html.indexOf('搜索课程'));
    expect(html).toContain('role="tablist" aria-label="课程记录"');
    expect(html).toContain('学习中');
    expect(html).toContain('已完成');
    expect(html).toContain('人观看');
    const records = html.split('class="records-panel"')[1] ?? '';
    expect(records).toContain('class="c-h5-course-card"');
    expect(records).toContain('开始学习');
    expect(records).toContain('新员工入职指引');
    expect(records).not.toContain('已学');
    expect(records).not.toContain('再看一遍');
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

  it('opens 我的记录 from the records route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="course-records" />);

    expect(html).toContain('<h1 class="c-h5-title">我的记录</h1>');
    expect(html).toContain('is-records');
    expect(html).toContain('学习中');
  });
});
