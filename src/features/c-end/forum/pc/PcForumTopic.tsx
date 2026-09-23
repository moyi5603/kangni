import { useEffect, useRef, useState } from 'react';
import { toPcForumBoardHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { H5DeleteSheet } from '../../activities/h5/H5DeleteSheet';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { forumClientSelf } from '../../../forum/model/forum';
import {
  addClientTopicComment,
  addClientTopicReply,
  deleteClientTopicComment,
  deleteClientTopicReply,
  deleteClientTopic,
  publishClientTopic,
  toggleClientTopicCommentLike,
  toggleClientTopicReplyLike,
  updateClientTopic,
  useForumBoards,
  useForumTopics,
} from '../../../forum/model/forumStore';
import {
  capForumComposeImages,
  clientNeedsReply,
  FORUM_COMPOSE_IMAGE_MAX,
  forumActorName,
  forumAnonSerials,
  isClientForumTopicVisible,
  isOwnClientTopic,
  sortClientTopicComments,
  topicReplyCount,
  type ForumCommentSort,
} from '../model/clientForum';
import { MomentMediaViewer } from '../../activities/components/MomentFeed';
import { EmployeeAvatar } from '../../activities/components/EmployeeAvatar';
import { ForumPhotoGrid } from '../h5/ForumPhotoGrid';
import { ForumPostAuthor } from '../h5/ForumPostAuthor';
import { ForumPostStats } from '../h5/ForumPostStats';
import { ForumPostTitle, ForumNeedReplyBanner, ForumOwnTopicActions } from '../h5/ForumPostTitle';
import { ForumCommentItem } from '../h5/H5ForumTopic';
import { H5ForumCompose } from '../h5/H5ForumCompose';
import { PcForumBoardSide } from './PcForumBoardSide';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function IconComposerSmile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10.2" r="1" fill="currentColor" />
      <circle cx="15" cy="10.2" r="1" fill="currentColor" />
      <path d="M8.6 14.4c1 .9 2.2 1.4 3.4 1.4s2.4-.5 3.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

type PcForumReplyTarget = { commentId: number; name: string; replyId?: number };

function PcForumComposer({
  open,
  inline,
  replyHint,
  allowAnonymous,
  anonymous,
  draft,
  draftImages,
  onDraftChange,
  onImagesChange,
  onAnonymousChange,
  onSubmit,
  onCancelReply,
  onFocus,
  onCollapse,
}: {
  open: boolean;
  inline?: boolean;
  replyHint?: string;
  allowAnonymous?: boolean;
  anonymous?: boolean;
  draft: string;
  draftImages: string[];
  onDraftChange: (value: string) => void;
  onImagesChange: (images: string[]) => void;
  onAnonymousChange?: (value: boolean) => void;
  onSubmit: () => void;
  onCancelReply?: () => void;
  onFocus?: () => void;
  onCollapse?: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const cancelRef = useRef(onCancelReply);
  cancelRef.current = onCancelReply;

  useEffect(() => {
    if (!inline) return;
    const onPointerDown = (event: PointerEvent) => {
      if (formRef.current?.contains(event.target as Node)) return;
      cancelRef.current?.();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [inline]);
  const expanded = inline || open;
  const className = inline
    ? 'c-forum-pc-composer is-inline is-open'
    : open
      ? 'c-forum-pc-composer is-open'
      : 'c-forum-pc-composer is-collapsed';

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <span className="c-forum-pc-composer-avatar">
        <EmployeeAvatar name={forumClientSelf} size="md" />
      </span>
      <div className="c-forum-pc-composer-box" onClick={() => inputRef.current?.focus()}>
        <textarea
          ref={inputRef}
          rows={1}
          autoFocus={inline}
          value={draft}
          placeholder={replyHint ? `回复 ${replyHint}` : '参与讨论，说说你的看法…'}
          aria-label="写评论"
          onFocus={onFocus}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (formRef.current?.contains(next)) return;
            if (!draft.trim() && !draftImages.length && !replyHint) onCollapse?.();
          }}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        {allowAnonymous ? (
          <label className="c-forum-anon">
            <input
              type="checkbox"
              checked={Boolean(anonymous)}
              aria-label="匿名评论"
              onChange={(event) => onAnonymousChange?.(event.target.checked)}
            />
            匿名
          </label>
        ) : null}
        {expanded ? (
          <>
            <ul className="c-forum-pc-composer-thumbs">
              {draftImages.map((src, index) => (
                <li key={`${src}-${index}`}>
                  <img src={src} alt="" />
                  <button type="button" aria-label="删除图片" onClick={() => onImagesChange(draftImages.filter((_, i) => i !== index))}>
                    ×
                  </button>
                </li>
              ))}
              {draftImages.length < FORUM_COMPOSE_IMAGE_MAX ? (
                <li className="c-forum-pc-composer-add">
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
                        onImagesChange(capForumComposeImages(draftImages, picked));
                        event.target.value = '';
                      }}
                    />
                    <span>+</span>
                  </label>
                </li>
              ) : null}
            </ul>
            <div className="c-forum-pc-composer-bar">
              <div className="c-forum-pc-composer-tools">
                <button type="button" aria-label="表情">
                  <IconComposerSmile />
                </button>
              </div>
              <button type="submit" disabled={!draft.trim() && !draftImages.length}>
                发布
              </button>
            </div>
          </>
        ) : null}
      </div>
    </form>
  );
}

export function PcForumTopic({ id, composeReply }: { id: number; composeReply?: PcForumReplyTarget }) {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = useForumTopics();
  const topic = topics.find((item) => item.id === id);
  const board = topic ? boards.find((item) => item.name === topic.boardName) : undefined;
  const [editing, setEditing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<PcForumReplyTarget | undefined>(composeReply);
  const [pending, setPending] = useState<{ kind: 'topic' } | { kind: 'comment'; commentId: number } | { kind: 'reply'; commentId: number; replyId: number }>();
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null);
  const [commentSort, setCommentSort] = useState<ForumCommentSort>('hot');
  const [composing, setComposing] = useState(false);
  const [draftAnonymous, setDraftAnonymous] = useState(false);

  const hidden =
    !topic ||
    !isClientForumTopicVisible(topic) ||
    !board ||
    (board.kind !== 'forum' && board.kind !== 'mailbox') ||
    board.status !== 'enabled';

  if (hidden) {
    return (
      <PcActivityShell title="帖子" className="is-forum">
        <p className="c-forum-empty">帖子不存在</p>
      </PcActivityShell>
    );
  }

  const backHash = toPcForumBoardHash(board.id);
  const anonSerials = forumAnonSerials(topic);
  const topOpen = !replyTo && (composing || Boolean(draft.trim()) || draftImages.length > 0);

  const startReply = (commentId: number, name: string, replyId?: number) => {
    setReplyTo({ commentId, name, replyId });
    setComposing(false);
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
    setComposing(false);
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
    <PcActivityShell title={topic.boardName} className="is-forum">
      <a className="c-back-link" href={backHash}>
        ← 返回{topic.boardName}
      </a>
      <div className="c-forum-pc-layout is-topic">
        <article className={clientNeedsReply(topic) ? 'c-forum-pc-card c-forum-topic is-need-reply' : 'c-forum-pc-card c-forum-topic'}>
          <ForumNeedReplyBanner topic={topic} />
          <ForumPostAuthor topic={topic} />
          <ForumPostTitle topic={topic} className="c-forum-post-title" />
          <p className="c-forum-topic-body">{topic.content}</p>
          {topic.images.length ? (
            <ForumPhotoGrid
              className="c-forum-topic-photos is-pc-3"
              images={topic.images}
              onOpen={(index) => setViewer({ urls: topic.images, index })}
            />
          ) : null}
          <ForumPostStats
            topic={topic}
            topicHref="#comments"
            variant="pc"
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
            <PcForumComposer
              open={topOpen}
              draft={draft}
              draftImages={draftImages}
              allowAnonymous={board.anonymous}
              anonymous={draftAnonymous}
              onAnonymousChange={setDraftAnonymous}
              onDraftChange={setDraft}
              onImagesChange={setDraftImages}
              onSubmit={sendDraft}
              onFocus={() => {
                setReplyTo(undefined);
                setComposing(true);
              }}
              onCollapse={() => setComposing(false)}
            />
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
                {replyTo?.commentId === comment.id && replyTo.replyId == null ? (
                  <PcForumComposer
                    open
                    inline
                    replyHint={replyTo.name}
                    draft={draft}
                    draftImages={draftImages}
                    allowAnonymous={board.anonymous}
                    anonymous={draftAnonymous}
                    onAnonymousChange={setDraftAnonymous}
                    onDraftChange={setDraft}
                    onImagesChange={setDraftImages}
                    onSubmit={sendDraft}
                    onCancelReply={() => {
                      setReplyTo(undefined);
                      setDraft('');
                      setDraftImages([]);
                    }}
                  />
                ) : null}
                {comment.replies.length ? (
                  <div className="c-forum-comment-replies">
                    {[...comment.replies]
                      .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)))
                      .map((reply) => (
                        <div key={reply.id}>
                          <ForumCommentItem
                            item={reply}
                            nested
                            anonSerial={anonSerials.get(reply.author)}
                            replyToName={forumActorName(comment.author, comment.authorAnonymous, anonSerials.get(comment.author))}
                            onReply={() => startReply(comment.id, forumActorName(reply.author, reply.authorAnonymous, anonSerials.get(reply.author)), reply.id)}
                            onLike={() => toggleClientTopicReplyLike(topic.id, comment.id, reply.id)}
                            onDelete={
                              reply.author === forumClientSelf
                                ? () => setPending({ kind: 'reply', commentId: comment.id, replyId: reply.id })
                                : undefined
                            }
                            onPreview={(urls, index) => setViewer({ urls, index })}
                          />
                          {replyTo?.commentId === comment.id && replyTo.replyId === reply.id ? (
                            <PcForumComposer
                              open
                              inline
                              replyHint={replyTo.name}
                              draft={draft}
                              draftImages={draftImages}
                              allowAnonymous={board.anonymous}
                              anonymous={draftAnonymous}
                              onAnonymousChange={setDraftAnonymous}
                              onDraftChange={setDraft}
                              onImagesChange={setDraftImages}
                              onSubmit={sendDraft}
                              onCancelReply={() => {
                                setReplyTo(undefined);
                                setDraft('');
                                setDraftImages([]);
                              }}
                            />
                          ) : null}
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        </article>
        <PcForumBoardSide
          board={board}
          onPublish={() => {
            setEditing(false);
            setComposeOpen(true);
          }}
        />
      </div>
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
      {composeOpen || editing ? (
        <H5ForumCompose
          key={editing ? `edit-${topic.id}` : 'create'}
          open
          mode={editing ? 'edit' : 'create'}
          allowAnonymous={!editing && board.anonymous}
          tags={(board.tags ?? []).filter(Boolean)}
          initial={
            editing
              ? { title: topic.title, content: topic.content, images: topic.images, tag: topic.tags[0] }
              : undefined
          }
          onClose={() => {
            setEditing(false);
            setComposeOpen(false);
          }}
          onSubmit={(nextDraft) => {
            if (editing) {
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
              return;
            }
            const result = publishClientTopic({
              boardName: board.name,
              title: nextDraft.title,
              content: nextDraft.content,
              images: nextDraft.images,
              tags: nextDraft.tag ? [nextDraft.tag] : [],
              authorAnonymous: nextDraft.anonymous,
            });
            if (!result.ok) {
              toast.show(result.error);
              return;
            }
            toast.show('发布成功');
            setComposeOpen(false);
          }}
        />
      ) : null}
    </PcActivityShell>
  );
}
