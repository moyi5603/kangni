import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5ExamList } from './H5ExamList';

describe('H5 exam list', () => {
  it('defaults L1 to 全部 and lists published exams', () => {
    const html = renderToStaticMarkup(<H5ExamList />);

    expect(html).toContain('class="c-h5-shell is-exam is-mall"');
    expect(html).toContain('<h1 class="c-h5-title">考试列表</h1>');
    expect(html).toContain('placeholder="全部"');
    expect(html).toContain('aria-label="考试分类"');
    expect(html).toContain('aria-pressed="true">全部</button>');
    expect(html).not.toContain('aria-pressed="true">【一级】验收测试考试</button>');
    expect(html).not.toContain('aria-label="二级分类"');
    expect(html).not.toContain('aria-label="三级分类"');
    expect(html).toContain('不看已结束');
    expect(html).toContain('href="#/c/h5/exam-7"');
    expect(html).not.toContain('/take');
    expect(html).toContain('项目管理考试');
    expect(html).toContain('需求分析与PRD撰写能力考核');
    expect(html).toContain('绩效薪酬体系设计考核');
    expect(html).not.toContain('>测试考试</h2>');
    expect(html).not.toContain('点击开始准备');
    expect(html).not.toContain('成绩已生成');
    expect(html).not.toContain('成绩页即将开放');
    expect(html).toContain('href="#/c/h5/exam-6"');
    expect(html).toContain('看成绩');
  });

  it('is mounted from CEndApp exams page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="exams" />);
    expect(html).toContain('class="c-h5-shell is-exam is-mall"');
    expect(html).toContain('考试列表');
  });
});
