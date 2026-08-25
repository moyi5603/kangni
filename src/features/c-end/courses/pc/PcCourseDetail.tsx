import { useMemo, useState } from 'react';
import { goPcCourseList } from '../../../../app/navigation';
import { DetailEngageBar } from '../../activities/components/DetailEngageBar';
import { EmployeeAvatar } from '../../activities/components/EmployeeAvatar';
import { useCEndToast } from '../../activities/components/CEndToast';
import { PcCommentModal } from '../../activities/pc/PcCommentModal';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import {
  courseCommentStatusLabel,
  formatCourseCommentDisplayTime,
  submitCourseComment,
  useVisibleCourseComments,
} from '../../../training/model/courseCommentStore';
import { toggleCourseFavorite, toggleCourseLike, useCourseEngagement } from '../../../training/model/courseEngagementStore';
import { useCourseCommentConfig } from '../../../training/model/trainingStore';
import { getClientCourse, getCourseLearning } from '../model/clientCourse';

function emphasizeIntro(text: string) {
  const parts = text.split(/(沟通方式不对|非能力不足)/);
  return parts.map((part, index) =>
    part === '沟通方式不对' || part === '非能力不足' ? <strong key={index}>{part}</strong> : part,
  );
}

export function PcCourseDetail({ id }: { id: number }) {
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
      <PcActivityShell className="is-course" title="课程学习">
        <div className="c-missing">
          <p className="c-empty">课程不存在</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goPcCourseList}>
            返回列表
          </button>
        </div>
      </PcActivityShell>
    );
  }

  const openComments = () => {
    document.getElementById('course-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onComment = () => {
    if (!showComment) return;
    openComments();
    setCommentOpen(true);
  };

  return (
    <PcActivityShell className="is-course" title="课程学习">
      <button className="c-back-link" type="button" onClick={goPcCourseList}>
        ← 返回列表
      </button>
      <div className="c-pc-detail">
        <article>
          <button
            className={`c-detail-cover c-pc-course-player is-${course.cover}`}
            type="button"
            aria-label={`播放 ${course.title}`}
            onClick={() => toast.show('播放待开发')}
          >
            <span className="c-pc-course-cover-art" />
            <span className="c-pc-course-play" />
          </button>
          <div className="c-detail-body c-article-body">
            <header className="c-detail-heading">
              <div className="c-detail-tags">
                <span className="c-pin">{course.tag}</span>
              </div>
              <h2 className="c-detail-name">{course.title}</h2>
            </header>
            <section className="c-detail-info-card" aria-label="课程进度">
              <div className="c-pc-course-progress-row">
                <span>课程进度</span>
                <span>{learning.progress}%</span>
              </div>
              <div className="c-pc-course-progress-track" aria-hidden>
                <span className="c-pc-course-progress-fill" style={{ width: `${learning.progress}%` }} />
              </div>
            </section>
            <section className="c-detail-content-section" aria-labelledby="pc-course-intro">
              <h2 id="pc-course-intro" className="c-detail-name c-detail-section">
                课程介绍
              </h2>
              <div className="c-html">
                {learning.intro.map((paragraph) => (
                  <p key={paragraph}>{emphasizeIntro(paragraph)}</p>
                ))}
              </div>
            </section>
            {showComment ? (
              <section className="c-activity-comments" id="course-comments" aria-labelledby="course-comments-title">
                <div className="c-activity-comments-head">
                  <h2 id="course-comments-title" className="c-detail-name c-detail-section">
                    评论 {comments.length}
                  </h2>
                </div>
                {comments.length === 0 ? (
                  <p className="c-empty">暂无评论</p>
                ) : (
                  <ul className="c-activity-comment-list">
                    {comments.map((item) => (
                      <li key={item.id} className="c-activity-comment">
                        <EmployeeAvatar name={item.author} />
                        <div className="c-activity-comment-main">
                          <div className="c-activity-comment-head">
                            <span>
                              {item.author}
                              {item.statusLabel ? (
                                <span className="c-course-comment-status">{item.statusLabel}</span>
                              ) : null}
                            </span>
                            <time>{item.time}</time>
                          </div>
                          <p>{item.text}</p>
                          <div className="c-activity-comment-actions">
                            <button
                              type="button"
                              className="c-comment-reply"
                              onClick={() => toast.show('回复待开发')}
                            >
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
        </article>
        <aside className="c-pc-side">
          <h2 className="c-detail-name">{course.title}</h2>
          <div className="c-detail-tags">
            <span className="c-pin">{course.tag}</span>
          </div>
          <DetailEngageBar
            liked={engagement.liked}
            favorited={engagement.favorited}
            likes={engagement.likes}
            stars={engagement.stars}
            comments={comments.length}
            showLike={showLike}
            showFavorite={showFavorite}
            showComment={showComment}
            onLike={() => toggleCourseLike(id)}
            onFavorite={() => toggleCourseFavorite(id)}
            onComment={onComment}
          />
          <section className="c-pc-course-syllabus" aria-label="课程目录">
            <h3>课程目录（课件+答题）</h3>
            <ul>
              {learning.lessons.map((lesson) => {
                const active = lesson.id === activeLessonId;
                return (
                  <li key={lesson.id}>
                    <button
                      className={`c-pc-course-lesson${active ? ' is-active' : ''}`}
                      type="button"
                      onClick={() => setActiveLessonId(lesson.id)}
                    >
                      <span className="c-pc-course-lesson-copy">
                        <span className="c-pc-course-lesson-title">{lesson.title}</span>
                        <span className="c-pc-course-lesson-meta">
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
          <button className="c-cta" type="button" disabled>
            完成全部学习后解锁答题
          </button>
        </aside>
      </div>
      {commentOpen && showComment ? (
        <PcCommentModal
          onCancel={() => setCommentOpen(false)}
          onSubmit={(content) => {
            const result = submitCourseComment(id, content);
            if (result === 'ok') {
              setCommentOpen(false);
              if (commentConfig.commentAuditEnabled) {
                toast.show('已提交，待审核');
              } else {
                toast.show('评论成功');
              }
            }
          }}
        />
      ) : null}
    </PcActivityShell>
  );
}
