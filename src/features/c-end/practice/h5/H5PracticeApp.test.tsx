import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { H5PracticeBank } from './H5PracticeBank';
import { H5PracticeQuiz } from './H5PracticeQuiz';

describe('H5 practice bank', () => {
  it('lists practice categories and links into quiz', () => {
    const html = renderToStaticMarkup(<H5PracticeBank />);
    expect(html).toContain('练习库');
    expect(html).not.toContain('习题分类');
    expect(html).toContain('每日一练');
    expect(html).toContain('专项突破');
    expect(html).toContain('错题巩固');
    expect(html).toContain('href="#/c/h5/practice/101"');
    expect(html).toContain('href="#/c/h5/practice/102"');
  });

  it('quiz shows first question of the category', () => {
    const html = renderToStaticMarkup(<H5PracticeQuiz categoryId={101} />);
    expect(html).toContain('每日一练');
    expect(html).toContain('以下哪项属于有效的时间管理方法？');
    expect(html).toContain('番茄工作法');
    expect(html).toContain('下一题');
  });

  it('mounts from CEndApp', () => {
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="practice-bank" />)).toContain('每日一练');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="practice-quiz" practiceCategoryId={101} />)).toContain(
      '以下哪项属于有效的时间管理方法？',
    );
  });
});
