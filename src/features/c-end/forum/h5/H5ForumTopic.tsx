import { useRef, useState } from 'react';
import { goH5Back, toH5ForumBoardHash, toH5MailboxHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { EmployeeAvatar } from '../../activities/components/EmployeeAvatar';
import { H5DeleteSheet } from '../../activities/h5/H5DeleteSheet';
import { forumClientSelf, forumPersonDepartment, type ForumTopicComment, type ForumTopicReply } from '../../../forum/model/forum';
import {
  addClientTopicComment,
  addClientTopicReply,
  deleteClientTopicComment,
  deleteClientTopicReply,
  isTopicFavorited,
  isTopicLiked,
  toggleTopicFavorite,
  toggleTopicLike,
  toggleClientTopicCommentLike,
  toggleClientTopicReplyLike,
  updateClientTopic,
  deleteClientTopic,
  useForumBoards,
  useForumTopics,
} from '../../../forum/model/forumStore';
import { formatForumPostDate, isClientForumTopicVisible, isOwnClientTopic, clientNeedsReply, sortClientTopicComments, topicReplyCount, capForumComposeImages, FORUM_COMPOSE_IMAGE_MAX, forumActorName, forumAnonSerials, type ForumCommentSort } from '../model/clientForum';
import { MomentMediaViewer } from '../../activities/components/MomentFeed';
import { ForumPhotoGrid } from './ForumPhotoGrid';
import { ForumPostAuthor } from './ForumPostAuthor';
import { ForumPostStats } from './ForumPostStats';
import { ForumPostTitle, ForumNeedReplyBanner, ForumOwnTopicActions } from './ForumPostTitle';
import { H5ForumCompose } from './H5ForumCompose';

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconLike() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7 11v9H4v-9h3Zm3 9h7.2a2 2 0 0 0 2-1.7l1.2-7A2 2 0 0 0 18.4 9H13V5a2 2 0 0 0-2-2h-.4L7 11h3v9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8L12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ForumCommentItem({
  item,
  nested,
  replyToName,
  onReply,
  onLike,
  onDelete,
  onPreview,
  anonSerial,
}: {
  item: ForumTopicComment | ForumTopicReply;
  nested?: boolean;
  replyToName?: string;
  onReply: () => void;
  onLike: () => void;
  onDelete?: () => void;
  onPreview: (urls: string[], index: number) => void;
  anonSerial?: number;
}) {
  const name = forumActorName(item.author, item.authorAnonymous, anonSerial);
  const department = item.authorAnonymous ? '' : forumPersonDepartment(item.author);
  const date = formatForumPostDate(item.createdAt);
  const replyTo = replyToName ?? ('replyTo' in item ? item.replyTo : undefined);
  const likedBy = item.likedBy ?? [];
  const liked = likedBy.includes(forumClientSelf);
  const likeLabel = nested ? `点赞 ${name} 的回复` : `点赞 ${name} 的评论`;
  return (
    <article className={nested ? 'c-forum-comment is-reply' : 'c-forum-comment'}>
      <EmployeeAvatar name={item.authorAnonymous ? (name === '我' ? '我' : '匿') : item.author} />
      <div className="c-forum-comment-main">
        <div className="c-forum-comment-head">
          <p className="c-forum-comment-name">
            {item.pinned ? <em className="c-forum-comment-pin">置顶</em> : null}
            {name}
            {department ? <span> · {department}</span> : null}
          </p>
          <time dateTime={date}>{date}</time>
        </div>
        {replyTo ? <p className="c-forum-comment-to">回复 {replyTo}</p> : null}
        {item.content ? <p className="c-forum-comment-body">{item.content}</p> : null}
        {item.images?.length ? (
          <ForumPhotoGrid className="c-forum-comment-photos" images={item.images} onOpen={(index) => onPreview(item.images ?? [], index)} />
        ) : null}
        <div className="c-forum-comment-actions">
          <button
            type="button"
            className={liked ? 'is-on' : undefined}
            aria-label={likeLabel}
            aria-pressed={liked}
            onClick={onLike}
          >
            <IconLike />
            <span>{likedBy.length}</span>
          </button>
          <button type="button" aria-label={`回复 ${name}`} onClick={onReply}>
            回复
          </button>
          {onDelete ? (
            <button type="button" aria-label={nested ? '删除回复' : '删除评论'} onClick={onDelete}>
              删除
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function H5ForumTopic({ id }: { id: number }) {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = useForumTopics();
  const topic = topics.find((item) => item.id === id);
  const board = topic ? boards.find((item) => item.name === topic.boardName) : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<{ commentId: number; name: string }>();
  const [pending, setPending] = useState<{ kind: 'topic' } | { kind: 'comment'; commentId: number } | { kind: 'reply'; commentId: number; replyId: number }>();
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null);
  const [commentSort, setCommentSort] = useState<ForumCommentSort>('hot');
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftAnonymous, setDraftAnonymous] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hidden =
    !topic ||
    !isClientForumTopicVisible(topic) ||
    !board ||
    (board.kind !== 'forum' && board.kind !== 'mailbox') ||
    board.status !== 'enabled';

  if (hidden) {
    return (
      <div className="c-h5-shell is-forum">
        <div className="c-h5-frame">
          <header className="c-h5-top">
            <button className="c-icon-btn" type="button" aria-label="返回" onClick={goH5Back}>
              <IconBack />
            </button>
            <h1 className="c-h5-title">帖子</h1>
            <span className="c-icon-btn" aria-hidden />
          </header>
          <main className="c-h5-main">
            <p className="c-forum-empty">帖子不存在</p>
          </main>
        </div>
      </div>
    );
  }

  const backHash = board?.kind === 'mailbox' ? toH5MailboxHash() : board ? toH5ForumBoardHash(board.id) : '#/c/h5/forum/1';
  const anonSerials = forumAnonSerials(topic);
  const liked = isTopicLiked(topic.id);
  const favorited = isTopicFavorited(topic.id);

  const startReply = (commentId: number, name: string) => {
    setReplyTo({ commentId, name });
    setComposerOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const sendDraft = () => {
    const text = draft.trim();
    const anonymous = Boolean(board.anonymous && draftAnonymous);
    const result = replyTo
      ? addClientTopicReply(topic.id, replyTo.commentId, text, replyTo.name, draftImages, anonymous)
      : addClientTopicComment(topic.id, text, draftImages, anonymous);
    if (!result.ok) {
      toast.show(result.error);
      return;
    }
    setDraft('');
    setDraftImages([]);
    setReplyTo(undefined);
    setDraftAnonymous(false);
    setComposerOpen(false);
  };

  const confirmDelete = () => {
    if (!pending) return;
    if (pending.kind === 'topic') {
      const result = deleteClientTopic(topic.id);
      if (!result.ok) toast.show(result.error);
      else window.location.hash = backHash;
      setPending(undefined);
      return;
    }
    const result =
      pending.kind === 'comment'
        ? deleteClientTopicComment(topic.id, pending.commentId)
        : deleteClientTopicReply(topic.id, pending.commentId, pending.replyId);
    if (!result.ok) toast.show(result.error);
    setPending(undefined);
  };

  return (
    <div className="c-h5-shell is-forum">
      <div className="c-h5-frame">
        <header className="c-h5-top">
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={() => { window.location.hash = backHash; }}>
            <IconBack />
          </button>
          <h1 className="c-h5-title">{topic.boardName}</h1>
          <span className="c-icon-btn" aria-hidden />
        </header>
        <main className={clientNeedsReply(topic) ? 'c-h5-main is-detail c-forum-topic is-need-reply' : 'c-h5-main is-detail c-forum-topic'}>
          <ForumNeedReplyBanner topic={topic} />
          <ForumPostAuthor topic={topic} />
          <ForumPostTitle topic={topic} className="c-forum-post-title" />
          <p className="c-forum-topic-body">{topic.content}</p>
          {topic.images.length ? (
            <ForumPhotoGrid
              className="c-forum-topic-photos"
              images={topic.images}
              onOpen={(index) => setViewer({ urls: topic.images, index })}
            />
          ) : null}
          <ForumPostStats
            topic={topic}
            variant="detail"
            extra={
              isOwnClientTopic(topic) ? (
                <ForumOwnTopicActions onEdit={() => setEditing(true)} onDelete={() => setPending({ kind: 'topic' })} />
              ) : null
            }
          />
          <section className="c-forum-topic-comments" aria-label="回复">
            <div className="c-forum-topic-comments-head">
              <h3>回复 {topicReplyCount(topic)}</h3>
              <div className="c-forum-comment-sort" role="tablist" aria-label="回复排序">
                {([
                  ['hot', '热门'],
                  ['asc', '正序'],
                  ['desc', '倒序'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={commentSort === key}
                    className={commentSort === key ? 'is-on' : undefined}
                    onClick={() => setCommentSort(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {topic.comments.length === 0 ? <p className="c-forum-empty">暂无回复</p> : null}
            {sortClientTopicComments(topic.comments, commentSort).map((comment) => (
              <div key={comment.id} className="c-forum-comment-thread">
                <ForumCommentItem
                  item={comment}
                  anonSerial={anonSerials.get(comment.author)}
                  onReply={() => startReply(comment.id, forumActorName(comment.author, comment.authorAnonymous, anonSerials.get(comment.author)))}
                  onLike={() => toggleClientTopicCommentLike(topic.id, comment.id)}
                  onDelete={comment.author === forumClientSelf ? () => setPending({ kind: 'comment', commentId: comment.id }) : undefined}
                  onPreview={(urls, index) => setViewer({ urls, index })}
                />
                {comment.replies.length ? (
                  <div className="c-forum-comment-replies">
                    {[...comment.replies]
                      .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)))
                      .map((reply) => (
                      <ForumCommentItem
                        key={reply.id}
                        item={reply}
                        nested
                        anonSerial={anonSerials.get(reply.author)}
                        replyToName={forumActorName(comment.author, comment.authorAnonymous, anonSerials.get(comment.author))}
                        onReply={() => startReply(comment.id, forumActorName(reply.author, reply.authorAnonymous, anonSerials.get(reply.author)))}
                        onLike={() => toggleClientTopicReplyLike(topic.id, comment.id, reply.id)}
                        onDelete={
                          reply.author === forumClientSelf
                            ? () => setPending({ kind: 'reply', commentId: comment.id, replyId: reply.id })
                            : undefined
                        }
                        onPreview={(urls, index) => setViewer({ urls, index })}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        </main>
        <form
          className="c-forum-topic-dock"
          onSubmit={(event) => {
            event.preventDefault();
            sendDraft();
          }}
        >
          {replyTo ? (
            <div className="c-forum-topic-dock-hint">
              <span>回复 {replyTo.name}</span>
              <button type="button" onClick={() => setReplyTo(undefined)}>
                取消
              </button>
            </div>
          ) : null}
          <div className="c-forum-topic-dock-row">
            <input
              ref={inputRef}
              value={draft}
              placeholder={replyTo ? `回复 ${replyTo.name}` : '写评论…'}
              aria-label="写评论"
              onFocus={() => setComposerOpen(true)}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" disabled={!draft.trim() && !draftImages.length}>
              发送
            </button>
            <button
              type="button"
              className={liked ? 'is-on' : undefined}
              aria-label="点赞"
              aria-pressed={liked}
              onClick={() => toggleTopicLike(topic.id)}
            >
              <IconLike />
              <span>{topic.likeCount}</span>
            </button>
            <button
              type="button"
              className={favorited ? 'is-on' : undefined}
              aria-label="收藏"
              aria-pressed={favorited}
              onClick={() => toggleTopicFavorite(topic.id)}
            >
              <IconStar />
              <span>{topic.favoriteCount}</span>
            </button>
          </div>
          <div className="c-forum-dock-media" hidden={!composerOpen && !draftImages.length && !replyTo}>
            <ul className="c-forum-dock-thumbs">
              {draftImages.map((src, index) => (
                <li key={`${src}-${index}`}>
                  <img src={src} alt="" />
                  <button type="button" aria-label="删除图片" onClick={() => setDraftImages(draftImages.filter((_, i) => i !== index))}>
                    ×
                  </button>
                </li>
              ))}
              {draftImages.length < FORUM_COMPOSE_IMAGE_MAX ? (
                <li className="c-forum-dock-add">
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      aria-label="评论传图"
                      onChange={async (event) => {
                        const files = event.target.files;
                        if (!files?.length) return;
                        const remaining = FORUM_COMPOSE_IMAGE_MAX - draftImages.length;
                        const picked = await Promise.all(Array.from(files).slice(0, remaining).map(readAsDataUrl));
                        setDraftImages(capForumComposeImages(draftImages, picked));
                        event.target.value = '';
                      }}
                    />
                    <span>+</span>
                  </label>
                </li>
              ) : null}
            </ul>
            {board.anonymous ? (
              <label className="c-forum-anon">
                <input
                  type="checkbox"
                  checked={draftAnonymous}
                  aria-label="匿名评论"
                  onChange={(event) => setDraftAnonymous(event.target.checked)}
                />
                匿名
              </label>
            ) : null}
          </div>
        </form>
        {pending ? (
          <H5DeleteSheet
            title={pending.kind === 'topic' ? '删除帖子' : '删除评论'}
            description={pending.kind === 'topic' ? '删除后无法恢复。' : undefined}
            onCancel={() => setPending(undefined)}
            onConfirm={confirmDelete}
          />
        ) : null}
        {viewer ? (
          <MomentMediaViewer
            viewer={{ kind: 'images', urls: viewer.urls, index: viewer.index }}
            onClose={() => setViewer(null)}
            onIndex={(index) => setViewer((current) => (current ? { ...current, index } : current))}
          />
        ) : null}
        {editing ? (
          <H5ForumCompose
            key={topic.id}
            open
            mode="edit"
            tags={(board?.tags ?? []).filter(Boolean)}
            initial={{ title: topic.title, content: topic.content, images: topic.images, tag: topic.tags[0] }}
            onClose={() => setEditing(false)}
            onSubmit={(nextDraft) => {
              const result = updateClientTopic(topic.id, {
                title: nextDraft.title,
                content: nextDraft.content,
                images: nextDraft.images,
                tags: nextDraft.tag ? [nextDraft.tag] : [],
              });
              if (!result.ok) {
                toast.show(result.error);
                return;
              }
              toast.show('已保存');
              setEditing(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
