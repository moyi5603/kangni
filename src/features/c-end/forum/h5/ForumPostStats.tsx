import { toH5ForumTopicHash } from '../../../../app/navigation';
import { topicReplyCount } from '../model/clientForum';
import {
  isTopicFavorited,
  isTopicLiked,
  toggleTopicFavorite,
  toggleTopicLike,
  useForumTopics,
} from '../../../forum/model/forumStore';
import type { ForumTopic } from '../../../forum/model/forum';
import type { ReactNode } from 'react';

function IconReply() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
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

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ForumPostStats({
  topic,
  topicHref,
  variant = 'default',
  extra,
}: {
  topic: ForumTopic;
  topicHref?: string;
  variant?: 'default' | 'pc' | 'list' | 'detail';
  extra?: ReactNode;
}) {
  useForumTopics();
  const href = topicHref ?? toH5ForumTopicHash(topic.id);
  const liked = isTopicLiked(topic.id);
  const favorited = isTopicFavorited(topic.id);
  const replyCount = topicReplyCount(topic);
  const detail = variant === 'pc' || variant === 'detail';
  const reply = detail ? (
    <span className="c-forum-stats-metric" aria-label={`评论 ${replyCount}`}>
      <IconReply />
      <span>{replyCount}</span>
    </span>
  ) : (
    <a href={href} aria-label={`回复 ${replyCount}`}>
      <IconReply />
      <span>{replyCount}</span>
    </a>
  );
  const like = (
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
  );
  const favorite = (
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
  );
  const views = detail ? (
    <span className="c-forum-stats-metric" aria-label={`浏览 ${topic.viewCount}`}>
      <IconEye />
      <span>{topic.viewCount}</span>
    </span>
  ) : (
    <a href={href} aria-label={`浏览 ${topic.viewCount}`}>
      <IconEye />
      <span>{topic.viewCount}</span>
    </a>
  );
  return (
    <div
      className={
        variant === 'pc' ? 'c-forum-stats is-pc' : variant === 'list' ? 'c-forum-stats is-list' : variant === 'detail' ? 'c-forum-stats is-detail' : 'c-forum-stats'
      }
    >
      <div className="c-forum-stats-metrics">
        {detail ? (
          <>
            {like}
            {favorite}
            {reply}
            {views}
          </>
        ) : (
          <>
            {reply}
            {like}
            {favorite}
            {views}
          </>
        )}
      </div>
      {extra}
    </div>
  );
}
