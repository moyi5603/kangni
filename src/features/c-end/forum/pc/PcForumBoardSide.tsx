import { toPcForumBoardHash, toPcForumTopicHash } from '../../../../app/navigation';
import { EmployeeAvatar } from '../../activities/components/EmployeeAvatar';
import { forumClientSelf, forumPersonDepartment, type ForumBoard } from '../../../forum/model/forum';
import { useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { clientNeedsReply, topicReplyCount, visibleClientForumTopics } from '../model/clientForum';
import { usePreviewList } from '../../portal/emptyPreview';

export function PcForumBoardSide({ board, onPublish }: { board: ForumBoard; onPublish: () => void }) {
  const boards = useForumBoards();
  const topics = usePreviewList(useForumTopics());
  const boardTopics = visibleClientForumTopics(topics, board.name);
  const hotTopics = [...boardTopics]
    .sort((left, right) => topicReplyCount(right) - topicReplyCount(left) || right.likeCount - left.likeCount)
    .slice(0, 5);
  const needReply = boardTopics.filter((item) => clientNeedsReply(item)).slice(0, 5);
  const otherBoards = boards.filter((item) => item.kind === 'forum' && item.status === 'enabled' && item.id !== board.id);

  return (
    <aside className="c-forum-pc-side">
      <section className="c-forum-pc-qualify">
        <div className="c-forum-pc-qualify-user">
          <EmployeeAvatar name={forumClientSelf} size="md" />
          <div>
            <strong>{forumClientSelf}</strong>
            <span>{forumPersonDepartment(forumClientSelf) || '—'}</span>
          </div>
        </div>
      </section>
      <button className="c-forum-pc-publish" type="button" onClick={onPublish}>
        立即发布
      </button>
      <section className="c-forum-pc-side-block">
        <h3>管理员</h3>
        <ul className="c-forum-pc-side-people">
          {(board.manager || '')
            .split(/[、,，]/)
            .map((name) => name.trim())
            .filter(Boolean)
            .map((name) => (
              <li key={name}>
                <EmployeeAvatar name={name} size="sm" />
                <span className="c-forum-pc-side-person">
                  <strong>{name}</strong>
                  <em>{forumPersonDepartment(name) || '—'}</em>
                </span>
              </li>
            ))}
        </ul>
      </section>
      {needReply.length ? (
        <section className="c-forum-pc-side-block">
          <h3>待你回复</h3>
          <ul className="c-forum-pc-side-list is-alert">
            {needReply.map((topic) => (
              <li key={topic.id}>
                <a href={toPcForumTopicHash(topic.id)}>{topic.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {hotTopics.length ? (
        <section className="c-forum-pc-side-block">
          <h3>热门帖子</h3>
          <ol className="c-forum-pc-side-list is-rank">
            {hotTopics.map((topic, index) => (
              <li key={topic.id}>
                <span className="c-forum-pc-side-rank">{index + 1}</span>
                <a href={toPcForumTopicHash(topic.id)}>{topic.title}</a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {otherBoards.length ? (
        <section className="c-forum-pc-side-block">
          <h3>其他论坛</h3>
          <ul className="c-forum-pc-side-boards">
            {otherBoards.map((item) => (
              <li key={item.id}>
                <a href={toPcForumBoardHash(item.id)}>
                  {item.icon ? <img src={item.icon} alt="" /> : null}
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
