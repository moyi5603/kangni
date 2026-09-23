import type { ForumTopic } from '../../../forum/model/forum';

export function ForumPostExcerpt({ topic, href }: { topic: ForumTopic; href: string }) {
  const text = topic.content.trim();
  if (!text) return null;
  return (
    <a className="c-forum-post-excerpt" href={href}>
      {text}
    </a>
  );
}
