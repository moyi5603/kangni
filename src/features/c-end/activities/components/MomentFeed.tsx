import { useEffect, useRef, useState } from 'react';
import { type Activity } from '../../../activities/model/activity';
import { formatMomentCommentLine, isPlayableMomentVideo, momentImageGridMod, type MomentRecord } from '../../../activities/model/moment';
import {
  MOMENT_VIEWER,
  addMomentComment,
  addMomentReply,
  deleteMomentComment,
  deleteMomentReply,
  toggleMomentLike,
  useCanSubmitMoment,
  useClientMoments,
} from '../../../activities/model/momentStore';
import { H5DeleteSheet } from '../h5/H5DeleteSheet';
import { PcDeleteModal } from '../pc/PcDeleteModal';
import { EmployeeAvatar } from './EmployeeAvatar';
import { IconComment, IconLike } from './Icons';

type MediaViewer =
  | { kind: 'images'; urls: string[]; index: number }
  | { kind: 'video'; url: string };

function MomentMediaViewer({
  viewer,
  onClose,
  onIndex,
}: {
  viewer: MediaViewer;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const playable = viewer.kind === 'video' && isPlayableMomentVideo(viewer.url);
  const count = viewer.kind === 'images' ? viewer.urls.length : 1;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (viewer.kind !== 'images') return;
      if (event.key === 'ArrowLeft') onIndex((viewer.index - 1 + count) % count);
      if (event.key === 'ArrowRight') onIndex((viewer.index + 1) % count);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [count, onClose, onIndex, viewer]);

  return (
    <div className="c-moment-viewer" role="dialog" aria-modal="true" aria-label={viewer.kind === 'video' ? '播放视频' : '查看大图'} onClick={onClose}>
      <button className="c-moment-viewer-close" type="button" aria-label="关闭" onClick={onClose}>
        关闭
      </button>
      {viewer.kind === 'images' && count > 1 ? (
        <>
          <button
            className="c-moment-viewer-nav is-prev"
            type="button"
            aria-label="上一张"
            onClick={(event) => {
              event.stopPropagation();
              onIndex((viewer.index - 1 + count) % count);
            }}
          >
            ‹
          </button>
          <button
            className="c-moment-viewer-nav is-next"
            type="button"
            aria-label="下一张"
            onClick={(event) => {
              event.stopPropagation();
              onIndex((viewer.index + 1) % count);
            }}
          >
            ›
          </button>
          <p className="c-moment-viewer-count">
            {viewer.index + 1} / {count}
          </p>
        </>
      ) : null}
      {viewer.kind === 'images' ? (
        <img src={viewer.urls[viewer.index]} alt="" onClick={(event) => event.stopPropagation()} />
      ) : playable ? (
        <video src={viewer.url} controls autoPlay playsInline onClick={(event) => event.stopPropagation()} />
      ) : (
        <img src={viewer.url} alt="" onClick={(event) => event.stopPropagation()} />
      )}
    </div>
  );
}

type ReplyTarget = { commentId: number; name: string };
type PendingDelete =
  | { kind: 'comment'; commentId: number }
  | { kind: 'reply'; commentId: number; replyId: number };

function MomentLine({
  author,
  content,
  replyTo,
  own,
  onReply,
  onDelete,
}: {
  author: string;
  content: string;
  replyTo?: string;
  own: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="c-moment-line-row">
      <button type="button" className="c-moment-line" onClick={onReply} aria-label={formatMomentCommentLine(author, content, replyTo)}>
        {replyTo ? (
          <>
            <strong>{author}</strong>回复<strong>{replyTo}</strong>：{content}
          </>
        ) : (
          <>
            <strong>{author}</strong>：{content}
          </>
        )}
      </button>
      {own ? (
        <button
          type="button"
          className="c-moment-del"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          删除
        </button>
      ) : null}
    </li>
  );
}

function MomentCard({
  moment,
  onEdit,
  surface,
}: {
  moment: MomentRecord;
  onEdit: (record: MomentRecord) => void;
  surface: 'h5' | 'pc';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget>();
  const [pending, setPending] = useState<PendingDelete>();
  const [viewer, setViewer] = useState<MediaViewer>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const liked = moment.likedBy.includes(MOMENT_VIEWER);
  const passed = moment.status === '已通过';
  const hasEngage = moment.likedBy.length > 0 || moment.comments.length > 0;

  const openCompose = (target?: ReplyTarget) => {
    setReplyTo(target);
    setComposing(true);
    setMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const sendDraft = () => {
    const text = draft.trim();
    if (!text) return;
    const result = replyTo
      ? addMomentReply(moment.id, replyTo.commentId, text, MOMENT_VIEWER, replyTo.name)
      : addMomentComment(moment.id, text);
    if (result.ok) {
      setDraft('');
      setReplyTo(undefined);
      setComposing(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [menuOpen]);

  return (
    <article className="c-moment-card">
      <div className="c-moment-meta">
        <EmployeeAvatar name={moment.author} size="md" />
        <div className="c-moment-meta-main">
          <strong>{moment.author}</strong>
          {moment.status === '待审核' ? <span className="c-moment-flag">审核中</span> : null}
          {moment.status === '已驳回' ? <span className="c-moment-flag is-reject">已驳回</span> : null}
        </div>
      </div>
      {moment.content ? <p className="c-moment-body">{moment.content}</p> : null}
      {moment.type === '图文类型' ? (
        <div className={`c-moment-grid ${momentImageGridMod(moment.imageUrls.length)}`}>
          {moment.imageUrls.map((url, index) => (
            <button
              key={`${url}-${index}`}
              className="c-moment-media-btn"
              type="button"
              aria-label="查看大图"
              onClick={() => setViewer({ kind: 'images', urls: moment.imageUrls, index })}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : moment.videoUrl ? (
        <button
          className="c-moment-media-btn c-moment-video-poster"
          type="button"
          aria-label="播放视频"
          onClick={() => setViewer({ kind: 'video', url: moment.videoUrl! })}
        >
          {isPlayableMomentVideo(moment.videoUrl) ? (
            <video className="c-moment-video" src={moment.videoUrl} muted playsInline preload="metadata" />
          ) : (
            <img src={moment.videoUrl} alt="" />
          )}
          <span className="c-moment-play" aria-hidden />
        </button>
      ) : null}
      {moment.status === '已驳回' ? (
        <div className="c-moment-reject">
          <p>驳回原因：{moment.rejectReason}</p>
          <button className="c-btn c-btn-primary" type="button" onClick={() => onEdit(moment)}>
            修改后再提
          </button>
        </div>
      ) : null}
      {passed ? (
        <>
          <div className="c-moment-foot">
            <time dateTime={moment.createdAt}>{moment.createdAt.slice(0, 16)}</time>
            <div className="c-moment-more-wrap" ref={menuRef}>
              {menuOpen ? (
                <div className="c-moment-pop" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleMomentLike(moment.id);
                      setMenuOpen(false);
                    }}
                  >
                    <IconLike />
                    {liked ? '取消' : '赞'}
                  </button>
                  <button type="button" role="menuitem" onClick={() => openCompose()}>
                    <IconComment />
                    评论
                  </button>
                </div>
              ) : null}
              <button
                className="c-moment-more"
                type="button"
                aria-label="更多"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                ···
              </button>
            </div>
          </div>
          {hasEngage ? (
            <div className="c-moment-engage">
              {moment.likedBy.length > 0 ? (
                <p className="c-moment-likes">
                  <IconLike />
                  <span>{moment.likedBy.join('，')}</span>
                </p>
              ) : null}
              {moment.comments.length > 0 ? (
                <ul className="c-moment-comments">
                  {moment.comments.flatMap((item) => [
                    <MomentLine
                      key={`c-${item.id}`}
                      author={item.author}
                      content={item.content}
                      own={item.author === MOMENT_VIEWER}
                      onReply={() => openCompose({ commentId: item.id, name: item.author })}
                      onDelete={() => setPending({ kind: 'comment', commentId: item.id })}
                    />,
                    ...item.replies.map((entry) => (
                      <MomentLine
                        key={`r-${entry.id}`}
                        author={entry.author}
                        content={entry.content}
                        replyTo={entry.replyTo ?? item.author}
                        own={entry.author === MOMENT_VIEWER}
                        onReply={() => openCompose({ commentId: item.id, name: entry.author })}
                        onDelete={() => setPending({ kind: 'reply', commentId: item.id, replyId: entry.id })}
                      />
                    )),
                  ])}
                </ul>
              ) : null}
            </div>
          ) : null}
          {composing ? (
            <form
              className="c-moment-input-row"
              onSubmit={(event) => {
                event.preventDefault();
                sendDraft();
              }}
            >
              <input
                ref={inputRef}
                value={draft}
                placeholder={replyTo ? `回复${replyTo.name}` : '评论'}
                aria-label={replyTo ? `回复${replyTo.name}` : '评论'}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className="c-comment-composer-send" type="submit" disabled={!draft.trim()}>
                发送
              </button>
              <button
                type="button"
                className="c-moment-composer-cancel"
                onClick={() => {
                  setComposing(false);
                  setReplyTo(undefined);
                  setDraft('');
                }}
              >
                取消
              </button>
            </form>
          ) : null}
        </>
      ) : null}
      {viewer ? (
        <MomentMediaViewer
          viewer={viewer}
          onClose={() => setViewer(undefined)}
          onIndex={(index) => setViewer((current) => (current?.kind === 'images' ? { ...current, index } : current))}
        />
      ) : null}
      {pending ? (
        surface === 'pc' ? (
          <PcDeleteModal
            onCancel={() => setPending(undefined)}
            onConfirm={() => {
              if (pending.kind === 'comment') deleteMomentComment(moment.id, pending.commentId);
              else deleteMomentReply(moment.id, pending.commentId, pending.replyId);
              setPending(undefined);
            }}
          />
        ) : (
          <H5DeleteSheet
            onCancel={() => setPending(undefined)}
            onConfirm={() => {
              if (pending.kind === 'comment') deleteMomentComment(moment.id, pending.commentId);
              else deleteMomentReply(moment.id, pending.commentId, pending.replyId);
              setPending(undefined);
            }}
          />
        )
      ) : null}
    </article>
  );
}

export function MomentFeed({
  activity,
  onCompose,
  hideTitle,
  surface = 'h5',
}: {
  activity: Activity;
  onCompose: (record?: MomentRecord) => void;
  hideTitle?: boolean;
  surface?: 'h5' | 'pc';
}) {
  const moments = useClientMoments(activity.id);
  const canSubmit = useCanSubmitMoment(activity);

  return (
    <section className="c-moment-feed" aria-label="精彩瞬间">
      {hideTitle && !canSubmit ? null : (
        <div className="c-moment-head">
          {hideTitle ? null : <h2 className="c-detail-name c-detail-section">精彩瞬间</h2>}
          {canSubmit ? (
            <button className="c-btn c-btn-primary c-moment-publish" type="button" onClick={() => onCompose()}>
              发布瞬间
            </button>
          ) : null}
        </div>
      )}
      {moments.length === 0 ? (
        <p className="c-empty">还没有精彩瞬间</p>
      ) : (
        moments.map((item) => <MomentCard key={item.id} moment={item} onEdit={onCompose} surface={surface} />)
      )}
    </section>
  );
}