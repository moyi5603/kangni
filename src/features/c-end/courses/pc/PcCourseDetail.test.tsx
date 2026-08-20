import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultCourseCommentConfig } from '../../../training/model/training';
import { updateCourseCommentConfig } from '../../../training/model/trainingStore';
import { PcCourseDetail } from './PcCourseDetail';

describe('PC course detail', () => {
  afterEach(() => {
    updateCourseCommentConfig(1, defaultCourseCommentConfig());
  });

  it('keeps a two-column activity PC layout with CTA in the aside', () => {
    const html = renderToStaticMarkup(<PcCourseDetail id={1} />);
    const article = html.indexOf('<article');
    const asideIndex = html.indexOf('<aside class="c-pc-side">');
    const aside = html.slice(asideIndex);
    const cta = html.indexOf('class="c-cta"');

    expect(html).toContain('class="c-pc-shell is-course"');
    expect(html).toContain('<h1 class="c-pc-header-title">课程学习</h1>');
    expect(html).toContain('返回列表');
    expect(html).toContain('c-pc-detail');
    expect(html).toContain('快速提升自己的沟通能力');
    expect(html).toContain('课程介绍');
    expect(html).toContain('课程进度');
    expect(article).toBeGreaterThan(-1);
    expect(asideIndex).toBeGreaterThan(article);
    expect(cta).toBeGreaterThan(asideIndex);
    expect(aside).toContain('完成全部学习后解锁答题');
    expect(aside).toContain('课程目录（课件+答题）');
    expect(aside).toContain('1.课件20260708');
    expect(aside).toContain('aria-label="点赞"');
    expect(html.slice(article, asideIndex)).toContain('评论 2');
    expect(html.slice(article, asideIndex)).toContain('钟。');
    expect(html.slice(article, asideIndex)).toContain('已驳回');
    expect(html).not.toContain('说点什么...');
    expect(html).not.toContain('c-h5-course-engage');
    expect(html).not.toContain('c-h5-course-player');
  });

  it('hides engage and comments when disabled in comment config', () => {
    updateCourseCommentConfig(1, {
      commentEnabled: false,
      commentAuditEnabled: false,
      likeEnabled: false,
      favoriteEnabled: false,
    });
    const html = renderToStaticMarkup(<PcCourseDetail id={1} />);
    expect(html).not.toContain('aria-label="点赞"');
    expect(html).not.toContain('aria-label="收藏"');
    expect(html).not.toContain('aria-label="评论"');
    expect(html).not.toContain('id="course-comments"');
    expect(html).not.toContain('评论 2');
    expect(html).not.toContain('钟。');
  });

  it('is mounted from CEndApp PC course-detail page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="course-detail" courseId={1} />);

    expect(html).toContain('1.课件20260708');
    expect(html).toContain('c-pc-detail');
    expect(html).not.toContain('发现活动');
  });
});
