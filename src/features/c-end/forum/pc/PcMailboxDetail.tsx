import { toPcMailboxHash } from '../../../../app/navigation';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { topicChairmanReplies } from '../../../forum/model/forum';
import { useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { mailboxProposalStatus, myClientMailboxTopics } from '../model/clientForum';
import { MAILBOX_H5_DIRECTIONS, mailboxStatusKindClass } from '../h5/H5MailboxHome';

function mailboxLabel(boardName: string) {
  return MAILBOX_H5_DIRECTIONS.find((item) => item.boardName === boardName)?.title ?? boardName;
}

export function PcMailboxDetail({ id }: { id: number }) {
  const boards = useForumBoards();
  const topics = useForumTopics();
  const topic = myClientMailboxTopics(topics).find((item) => item.id === id);
  const board = topic ? boards.find((item) => item.name === topic.boardName) : undefined;
  const replies = topic ? topicChairmanReplies(topic) : [];
  const status = topic ? mailboxProposalStatus(topic) : null;

  return (
    <PcActivityShell
      title="建言详情"
      className="is-mailbox"
      headerActions={
        <a className="c-mailbox-pc-back" href={toPcMailboxHash()}>
          返回列表
        </a>
      }
    >
      {topic && status ? (
        <article className="c-mailbox-detail c-mailbox-pc-detail">
          <section className="c-mailbox-detail-card">
            <p className="c-mailbox-box">{mailboxLabel(topic.boardName)}</p>
            <h2 className="c-mailbox-detail-title">{topic.title}</h2>
            <div className="c-mailbox-item-top">
              <p className="c-mailbox-item-tags">
                {board?.anonymous ? (
                  <span className="c-mailbox-kind">{topic.authorAnonymous ? '匿名' : '实名'}</span>
                ) : null}
                <span className={mailboxStatusKindClass(status)}>{status}</span>
              </p>
              <span className="c-mailbox-item-time">{topic.publishedAt}</span>
            </div>
            <p className="c-mailbox-detail-body">{topic.content}</p>
            {topic.images.length ? (
              <ul className="c-mailbox-detail-photos">
                {topic.images.map((src) => (
                  <li key={src}>
                    <img src={src} alt="" />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          {replies.length ? (
            <section className="c-mailbox-detail-reply" aria-label="回复">
              <h3>回复</h3>
              {replies.map((reply, index) => (
                <div className="c-mailbox-detail-reply-item" key={`${reply.time}-${index}`}>
                  <p>{reply.content}</p>
                  <span className="c-mailbox-item-time">{reply.time}</span>
                </div>
              ))}
            </section>
          ) : null}
        </article>
      ) : (
        <p className="c-mailbox-empty">建言不存在</p>
      )}
    </PcActivityShell>
  );
}
