import { formatForumPostDate, topicListThumbs } from '../model/clientForum';
import { type ForumTopic } from '../../../forum/model/forum';
import { ForumPhotoGrid } from './ForumPhotoGrid';
import { ForumPostTitle, ForumOwnTopicActions } from './ForumPostTitle';
import { ForumPostStats } from './ForumPostStats';
import { ForumPostExcerpt } from './ForumPostExcerpt';

export function ForumMinePost({
  topic,
  href,
  statsVariant = 'default',
  thumbMax = 3,
  onEdit,
  onDelete,
  onOpenImages,
}: {
  topic: ForumTopic;
  href: string;
  statsVariant?: 'default' | 'list';
  thumbMax?: number;
  onEdit: () => void;
  onDelete: () => void;
  onOpenImages: (index: number) => void;
}) {
  const thumbs = topicListThumbs(topic.images, thumbMax);
  const date = formatForumPostDate(topic.publishedAt);
  return (
    <li className="c-forum-post c-forum-mine-post">
      <a className="c-forum-post-main" href={href}>
        <p className="c-forum-mine-meta">
          <span className="c-forum-post-board">{topic.boardName}</span>
          <time dateTime={date}>{date}</time>
        </p>
        <ForumPostTitle topic={topic} showPin={false} />
      </a>
      {thumbs.length ? (
        <ForumPhotoGrid
          className="c-forum-thumbs"
          images={topic.images}
          cells={thumbs}
          onOpen={onOpenImages}
        />
      ) : null}
      <ForumPostExcerpt topic={topic} href={href} />
      <div className="c-forum-post-foot">
        <ForumPostStats
          topic={topic}
          topicHref={href}
          variant={statsVariant}
          extra={<ForumOwnTopicActions onEdit={onEdit} onDelete={onDelete} />}
        />
      </div>
    </li>
  );
}
