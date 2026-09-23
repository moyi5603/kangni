import { EmployeeAvatar } from '../../activities/components/EmployeeAvatar';
import { formatForumPostDate, topicAuthorDepartment, topicAuthorName } from '../model/clientForum';
import type { ForumTopic } from '../../../forum/model/forum';

export function ForumPostAuthor({ topic }: { topic: ForumTopic }) {
  const name = topicAuthorName(topic);
  const department = topicAuthorDepartment(topic);
  const date = formatForumPostDate(topic.publishedAt);
  return (
    <div className="c-forum-user">
      <EmployeeAvatar name={topic.authorAnonymous ? (name === '我' ? '我' : '匿') : name} size="md" />
      <div className="c-forum-user-copy">
        <p className="c-forum-user-name">
          {name}
          {department ? <span> · {department}</span> : null}
        </p>
        <time className="c-forum-user-date" dateTime={date}>
          {date}
        </time>
      </div>
    </div>
  );
}
