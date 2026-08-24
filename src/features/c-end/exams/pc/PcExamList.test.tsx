import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { PcExamList } from './PcExamList';

describe('PC exam list', () => {
  it('uses info cards without cover images', () => {
    const html = renderToStaticMarkup(<PcExamList />);

    expect(html).toContain('class="c-pc-shell is-exam"');
    expect(html).toContain('<h1 class="c-pc-header-title">考试</h1>');
    expect(html).toContain('<h2 class="c-section-title">发现考试</h2>');
    expect(html).toContain('c-pc-mall-hero is-exam');
    expect(html).toContain('近期可参加的考核');
    expect(html).toContain('进行中');
    expect(html).toContain('正在进行');
    expect(html).toContain('c-pc-exam-grid');
    expect(html).toContain('c-pc-exam-info-card');
    expect(html).toContain('c-pc-cat-cascade');
    expect(html).toContain('aria-label="一级分类"');
    expect(html).toContain('aria-label="二级分类"');
    expect(html).toContain('aria-label="三级分类"');
    expect(html).toContain('不看已结束');
    expect(html).toContain('href="#/c/exam/7"');
    expect(html).toContain('项目管理考试');
    expect(html).toContain('进行中');
    expect(html).toContain('考试时间');
    expect(html).toContain('08-01 00:00:00 ~ 08-29 23:59:59');
    expect(html).not.toContain('>开考<');
    expect(html).not.toContain('>结束<');
    expect(html).not.toContain('c-pc-exam-info-stats');
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('c-h5-exam-card');
    expect(html).not.toContain('c-pc-exam-cover');
    expect(html).not.toContain('c-pc-exam-nav');
    expect(html).not.toContain('点击开始准备');
    expect(html).not.toContain('成绩已生成');
  });

  it('links passed exams to the detail page', () => {
    const html = renderToStaticMarkup(<PcExamList />);
    expect(html).toContain('href="#/c/exam/6"');
    expect(html).not.toContain('href="#/c/exam/6/result"');
    expect(html).toContain('看成绩');
  });

  it('is mounted from CEndApp PC exams page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="exams" />);
    expect(html).toContain('class="c-pc-shell is-exam"');
    expect(html).toContain('发现考试');
  });
});
