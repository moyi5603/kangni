import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultCourseCommentConfig } from '../../../training/model/training';
import { updateCourseCommentConfig } from '../../../training/model/trainingStore';
import { H5CourseDetail } from './H5CourseDetail';

describe('H5 course detail', () => {
  afterEach(() => {
    updateCourseCommentConfig(1, defaultCourseCommentConfig());
  });

  it('renders the learning chrome, catalog, comments, and engage bar', () => {
    const html = renderToStaticMarkup(<H5CourseDetail id={1} />);

    expect(html).toContain('class="c-h5-shell is-course is-detail"');
    expect(html).toContain('<h1 class="c-h5-title">课程学习</h1>');
    expect(html).toContain('快速提升自己的沟通能力');
    expect(html).toContain('沟通方式不对');
    expect(html).toContain('课程进度');
    expect(html).toContain('0%');
    expect(html).toContain('完成全部学习后解锁答题');
    expect(html).toContain('课程目录（课件+答题）');
    expect(html).toContain('1.课件20260708');
    expect(html).toContain('2.PPT高级排版技巧');
    expect(html).toContain('3.PPT动画特效制作');
    expect(html).toContain('5:21');
    expect(html).toContain('已学0%');
    expect(html).toContain('共2条评论');
    expect(html).toContain('钟。');
    expect(html).toContain('你好');
    expect(html).toContain('已驳回');
    expect(html).toContain('这条被驳回了，只有我能看见。');
    expect(html).toContain('08-10 18:11');
    expect(html).toContain('回复');
    expect(html).toContain('说点什么...');
    expect(html).toContain('aria-label="点赞"');
    expect(html).toContain('aria-label="收藏"');
    expect(html).toContain('aria-label="评论"');
    expect(html).not.toContain('aria-label="分享"');
    expect(html).toContain('aria-label="快速入口"');
  });

  it('hides comment like and favorite when disabled in comment config', () => {
    updateCourseCommentConfig(1, {
      commentEnabled: false,
      commentAuditEnabled: false,
      likeEnabled: false,
      favoriteEnabled: false,
    });
    const html = renderToStaticMarkup(<H5CourseDetail id={1} />);
    expect(html).not.toContain('说点什么...');
    expect(html).not.toContain('id="course-comments"');
    expect(html).not.toContain('条评论');
    expect(html).not.toContain('aria-label="点赞"');
    expect(html).not.toContain('aria-label="收藏"');
    expect(html).not.toContain('aria-label="评论"');
    expect(html).not.toContain('aria-label="分享"');
    expect(html).toContain('aria-label="快速入口"');
  });

  it('mounts from CEndApp course-detail page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="course-detail" courseId={1} />);

    expect(html).toContain('class="c-h5-shell is-course is-detail"');
    expect(html).toContain('1.课件20260708');
  });

  it('does not fall through to activity home when course id is missing', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="course-detail" />);

    expect(html).not.toContain('员工活动');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('课程学习');
  });
});
