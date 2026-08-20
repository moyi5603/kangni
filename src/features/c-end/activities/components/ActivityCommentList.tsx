import { useEffect, useRef, useState } from 'react';
import type { CommentRecord } from '../../../activities/model/related';
import { COMMENT_PAGE_SIZE, type CommentThread } from '../../../activities/model/commentTree';
import { formatCommentDisplayTime, nextVisibleCommentCount, sliceCommentThreads } from '../model/activityComments';
import { H5DeleteSheet } from '../h5/H5DeleteSheet';
import { PcDeleteModal } from '../pc/PcDeleteModal';
import { DEMO_SIGNUP_USER } from '../model/signupStore';
import { EmployeeAvatar } from './EmployeeAvatar';
import { IconLike } from './Icons';

function CommentActions({
  item,
  onLike,
  onReply,
  onDeleteRequest,
}: {
  item: CommentRecord;
  onLike: (id: number) => void;
  onReply: (id: number, replyToName: string) => void;
  onDeleteRequest: (id: number) => void;
}) {
  const liked = item.likedBy.includes(DEMO_SIGNUP_USER.name);
  return (
    <div className="c-activity-comment-toolbar">
      <time dateTime={item.createdAt}>{formatCommentDisplayTime(item.createdAt)}</time>
      <button
        type="button"
        className={liked ? 'c-comment-like is-on' : 'c-comment-like'}
        aria-pressed={liked}
        aria-label="点赞"
        onClick={() => onLike(item.id)}
      >
        <IconLike />
        {item.likedBy.length}
      </button>
      <button type="button" className="c-comment-reply" onClick={() => onReply(item.id, item.author)}>
        回复
      </button>
      {item.author === DEMO_SIGNUP_USER.name ? (
        <button type="button" className="c-comment-delete" onClick={() => onDeleteRequest(item.id)}>
          删除
        </button>
      ) : null}
    </div>
  );
}

export function ActivityCommentList({
  threads,
  totalCount,
  onLike,
  onSubmit,
  onDelete,
  surface,
  hideTitle,
}: {
  threads: CommentThread[];
  totalCount: number;
  onLike: (id: number) => void;
  onSubmit: (content: string, parentId?: number) => void;
  onDelete: (id: number) => void;
  surface: 'h5' | 'pc';
  hideTitle?: boolean;
}) {
  const [pendingId, setPendingId] = useState<number>();
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string }>();
  const [visibleCount, setVisibleCount] = useState(() => Math.min(COMMENT_PAGE_SIZE, threads.length));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const startReply = (id: number, name: string) => {
    setReplyTo({ id, name });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const sendDraft = () => {
    const text = draft.trim();
    if (!text) return;
    onSubmit(text, replyTo?.id);
    setDraft('');
    setReplyTo(undefined);
  };
  const visibleThreads = sliceCommentThreads(threads, visibleCount);
  const hasMore = visibleCount < threads.length;

  useEffect(() => {
    setVisibleCount((current) => Math.max(current, Math.min(COMMENT_PAGE_SIZE, threads.length)));
  }, [threads.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => nextVisibleCommentCount(current, threads.length));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, threads.length]);

  const closeConfirm = () => setPendingId(undefined);
  const confirmDelete = () => {
    if (pendingId == null) return;
    onDelete(pendingId);
    setPendingId(undefined);
  };

  return (
    <section
      className="c-activity-comments"
      id="activity-comments"
      {...(hideTitle ? { 'aria-label': '评论' } : { 'aria-labelledby': 'activity-comments-title' })}
    >
      {hideTitle ? null : (
        <div className="c-activity-comments-head">
          <h2 id="activity-comments-title" className="c-detail-name c-detail-section">
            评论 {totalCount}
          </h2>
        </div>
      )}
      <form
        className="c-comment-composer"
        onSubmit={(event) => {
          event.preventDefault();
          sendDraft();
        }}
      >
        {replyTo ? (
          <div className="c-comment-composer-hint">
            <span>回复 {replyTo.name}</span>
            <button type="button" className="c-comment-composer-clear" onClick={() => setReplyTo(undefined)}>
              取消
            </button>
          </div>
        ) : null}
        <div className="c-comment-composer-row">
          <EmployeeAvatar name={DEMO_SIGNUP_USER.name} />
          <input
            id="activity-comment-box"
            className="c-comment-composer-field"
            ref={inputRef}
            value={draft}
            placeholder={replyTo ? `回复 ${replyTo.name}` : '说点什么…'}
            aria-label={replyTo ? `回复 ${replyTo.name}` : '说点什么'}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="c-comment-composer-send" type="submit" disabled={!draft.trim()}>
            发送
          </button>
        </div>
      </form>
      {threads.length === 0 ? (
        <p className="c-empty">暂无评论</p>
      ) : (
        <ul className="c-activity-comment-list">
          {visibleThreads.map((thread) => (
            <li key={thread.root.id} className="c-activity-comment">
              <EmployeeAvatar name={thread.root.author} />
              <div className="c-activity-comment-main">
                <div className="c-activity-comment-head">
                  <span>{thread.root.author}</span>
                </div>
                <p>{thread.root.content}</p>
                <CommentActions item={thread.root} onLike={onLike} onReply={startReply} onDeleteRequest={setPendingId} />
                {thread.replies.length > 0 ? (
                  <ul className="c-activity-comment-replies">
                    {thread.replies.map((reply) => (
                      <li key={reply.id} className="c-activity-comment">
                        <EmployeeAvatar name={reply.author} />
                        <div className="c-activity-comment-main">
                          <div className="c-activity-comment-head">
                            <span>{reply.replyLabel}</span>
                          </div>
                          <p>{reply.content}</p>
                          <CommentActions item={reply} onLike={onLike} onReply={startReply} onDeleteRequest={setPendingId} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {hasMore ? <div ref={sentinelRef} data-comment-sentinel="" /> : null}
      {pendingId != null ? (
        surface === 'h5' ? (
          <H5DeleteSheet onCancel={closeConfirm} onConfirm={confirmDelete} />
        ) : (
          <PcDeleteModal onCancel={closeConfirm} onConfirm={confirmDelete} />
        )
      ) : null}
    </section>
  );
}
