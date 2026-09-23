import { useState } from 'react';
import { isTopicPinned, type ForumTopic } from '../../../forum/model/forum';
import { clientNeedsReply } from '../model/clientForum';

export function ForumNeedReplyBanner({ topic }: { topic: ForumTopic }) {
  if (!clientNeedsReply(topic)) return null;
  return (
    <p className="c-forum-need-reply-banner" role="status">
      需要你回复
      <span>我来回复</span>
    </p>
  );
}

export function ForumOwnTopicActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="c-forum-own-actions">
      <button
        className="c-forum-more"
        type="button"
        aria-label="更多操作"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        …
      </button>
      <div className="c-forum-own-menu" hidden={!open} role="menu">
        <button
          className="c-forum-edit"
          type="button"
          role="menuitem"
          aria-label="编辑帖子"
          onClick={() => {
            setOpen(false);
            onEdit();
          }}
        >
          编辑
        </button>
        <button
          className="c-forum-edit is-danger"
          type="button"
          role="menuitem"
          aria-label="删除帖子"
          onClick={() => {
            setOpen(false);
            onDelete();
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

export function ForumPostTitle({
  topic,
  className,
  showPin = true,
}: {
  topic: ForumTopic;
  className?: string;
  showPin?: boolean;
}) {
  const tags = (topic.tags ?? []).map((item) => item.trim()).filter(Boolean);
  return (
    <h2 className={className ?? 'c-forum-post-title'}>
      {showPin && isTopicPinned(topic) ? <em>置顶</em> : null}
      {tags.map((tag) => (
        <span key={tag} className="c-forum-tag">
          {tag}
        </span>
      ))}
      {topic.title}
    </h2>
  );
}
