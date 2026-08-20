import { useMemo, useState } from 'react';
import { goH5CourseList } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { IconComment, IconLike, IconStar } from '../../activities/components/Icons';
import { useCEndToast } from '../../activities/components/CEndToast';
import { H5CommentSheet } from '../../activities/h5/H5CommentSheet';
import {
  courseCommentStatusLabel,
  formatCourseCommentDisplayTime,
  submitCourseComment,
  useVisibleCourseComments,
} from '../../../training/model/courseCommentStore';
import { toggleCourseFavorite, toggleCourseLike, useCourseEngagement } from '../../../training/model/courseEngagementStore';
import { useCourseCommentConfig } from '../../../training/model/trainingStore';
import { getClientCourse, getCourseLearning } from '../model/clientCourse';

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" className="c-icon" aria-hidden>
      <path d="M4 20h4.4L19 9.4 14.6 5 4 15.6V20Z" />
      <path d="m13.8 6.8 3.4 3.4" />
    </svg>
  );
}

function IconRocket() {
  return (
    <svg viewBox="0 0 24 24" className="c-icon" aria-hidden>
      <path d="M14 4c3 2 6 7 6 11a4 4 0 0 1-4 4c-4 0-9-3-11-6l5-5" />
      <path d="M9 15 5 19" />
      <circle cx="15" cy="9" r="1.2" />
    </svg>
  );
}

function emphasizeIntro(text: string) {
  const parts = text.split(/(沟通方式不对|非能力不足)/);
  return parts.map((part, index) =>
    part === '沟通方式不对' || part === '非能力不足' ? <strong key={index}>{part}</strong> : part,
  );
}

export function H5CourseDetail({ id }: { id: number }) {
  const toast = useCEndToast();
  const course = getClientCourse(id);
  const learning = getCourseLearning(id);
  const commentConfig = useCourseCommentConfig(id);
  const showComment = commentConfig.commentEnabled;
  const showLike = commentConfig.likeEnabled;
  const showFavorite = commentConfig.favoriteEnabled;
  const engagement = useCourseEngagement(id);
  const commentRecords = useVisibleCourseComments(id);
  const [commentOpen, setCommentOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState(learning?.lessons[0]?.id ?? 0);
  const comments = useMemo(
    () =>
      commentRecords.map((item) => ({
        id: item.id,
        author: item.author,
        text: item.text,
        time: formatCourseCommentDisplayTime(item.createdAt),
        statusLabel: courseCommentStatusLabel(item.status),
      })),
    [commentRecords],
  );

  if (!course || !learning) {
    return (
      <H5ActivityShell className="is-course is-detail" title="课程学习" onBack={goH5CourseList}>
        <p className="c-h5-course-empty">课程不存在</p>
      </H5ActivityShell>
    );
  }

  const onCommentCompose = () => {
    if (!showComment) return;
    setCommentOpen(true);
  };

  return (
    <H5ActivityShell
      className="is-course is-detail"
      title="课程学习"
      onBack={goH5CourseList}
      detail
      footer={
        <div className="c-h5-course-engage">
          {showComment ? (
            <button className="c-h5-course-engage-input" type="button" onClick={onCommentCompose}>
              <IconPencil />
              说点什么...
            </button>
          ) : null}
          {showLike ? (
            <button
              className={`c-h5-course-engage-btn${engagement.liked ? ' is-on' : ''}`}
              type="button"
              aria-label={engagement.liked ? '取消点赞' : '点赞'}
              aria-pressed={engagement.liked}
              onClick={() => toggleCourseLike(id)}
            >
              <IconLike />
              {engagement.likes}
            </button>
          ) : null}
          {showFavorite ? (
            <button
              className={`c-h5-course-engage-btn${engagement.favorited ? ' is-on' : ''}`}
              type="button"
              aria-label={engagement.favorited ? '取消收藏' : '收藏'}
              aria-pressed={engagement.favorited}
              onClick={() => toggleCourseFavorite(id)}
            >
              <IconStar />
              {engagement.stars}
            </button>
          ) : null}
          {showComment ? (
            <button
              className="c-h5-course-engage-btn"
              type="button"
              aria-label="评论"
              onClick={() => document.getElementById('course-comments')?.scrollIntoView({ block: 'start' })}
            >
              <IconComment />
              {comments.length}
            </button>
          ) : null}
          <button
            className="c-h5-course-rocket"
            type="button"
            aria-label="快速入口"
            onClick={() => toast.show('快捷入口待开发')}
          >
            <IconRocket />
          </button>
        </div>
      }
    >
      <div className="c-h5-course-learn">
        <button
          className={`c-h5-course-player c-h5-course-cover is-${course.cover}`}
          type="button"
          aria-label={`播放 ${course.title}`}
          onClick={() => toast.show('播放待开发')}
        >
          <span className="c-h5-course-cover-art" />
          <span className="c-h5-course-play is-lg" />
        </button>

        <h2 className="c-h5-course-learn-title">{course.title}</h2>
        <div className="c-h5-course-learn-intro">
          {learning.intro.map((paragraph) => (
            <p key={paragraph}>{emphasizeIntro(paragraph)}</p>
          ))}
        </div>

        <section className="c-h5-course-progress" aria-label="课程进度">
          <div className="c-h5-course-progress-row">
            <span>课程进度</span>
            <span>{learning.progress}%</span>
          </div>
          <div className="c-h5-course-progress-track" aria-hidden>
            <span className="c-h5-course-progress-fill" style={{ width: `${learning.progress}%` }} />
            <span className="c-h5-course-progress-thumb" style={{ left: `max(6px, ${learning.progress}%)` }} />
          </div>
        </section>

        <button className="c-h5-course-unlock" type="button" disabled>
          完成全部学习后解锁答题
        </button>

        <section className="c-h5-course-syllabus" aria-label="课程目录">
          <h3>课程目录（课件+答题）</h3>
          <ul>
            {learning.lessons.map((lesson) => {
              const active = lesson.id === activeLessonId;
              return (
                <li key={lesson.id}>
                  <button
                    className={`c-h5-course-lesson${active ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveLessonId(lesson.id)}
                  >
                    <span className={`c-h5-course-cover is-${lesson.cover} c-h5-course-lesson-cover`} aria-hidden>
                      <span className="c-h5-course-cover-art" />
                    </span>
                    <span className="c-h5-course-lesson-copy">
                      <span className="c-h5-course-lesson-title">{lesson.title}</span>
                      <span className="c-h5-course-lesson-meta">
                        {lesson.duration}
                        <span>已学{lesson.learned}%</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {showComment ? (
          <section className="c-h5-course-comments" id="course-comments" aria-label="评论">
            <h3>共{comments.length}条评论</h3>
            {comments.length === 0 ? (
              <p className="c-h5-course-empty">暂无评论</p>
            ) : (
              <ul>
                {comments.map((item) => (
                  <li key={item.id} className="c-h5-course-comment">
                    <span className="c-h5-course-comment-avatar" aria-hidden>
                      {item.author.slice(0, 1)}
                    </span>
                    <div>
                      <p className="c-h5-course-comment-name">
                        {item.author}
                        {item.statusLabel ? (
                          <span className="c-course-comment-status">{item.statusLabel}</span>
                        ) : null}
                      </p>
                      <p className="c-h5-course-comment-text">{item.text}</p>
                      <div className="c-h5-course-comment-foot">
                        <time>{item.time}</time>
                        <button type="button" onClick={() => toast.show('回复待开发')}>
                          回复
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
      {commentOpen && showComment ? (
        <H5CommentSheet
          onCancel={() => setCommentOpen(false)}
          onSubmit={(content) => {
            const result = submitCourseComment(id, content);
            if (result === 'ok') {
              setCommentOpen(false);
              if (commentConfig.commentAuditEnabled) {
                toast.show('已提交，待审核');
              }
            }
          }}
        />
      ) : null}
    </H5ActivityShell>
  );
}
