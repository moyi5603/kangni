import { useMemo, useState } from 'react';
import { toPcMailboxTopicHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { forumClientSelf } from '../../../forum/model/forum';
import { publishClientTopic, useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { mailboxProposalCount, mailboxProposalStatus, myClientMailboxTopics } from '../model/clientForum';
import { H5ForumCompose } from '../h5/H5ForumCompose';
import { usePreviewList } from '../../portal/emptyPreview';
import { MAILBOX_H5_DIRECTIONS, MailboxProposalPhotos, mailboxStatusKindClass } from '../h5/H5MailboxHome';

type Direction = (typeof MAILBOX_H5_DIRECTIONS)[number];
const LONG_PURPOSE = 70;

function mailboxLabel(topic: { boardName: string }) {
  return MAILBOX_H5_DIRECTIONS.find((item) => item.boardName === topic.boardName)?.title ?? topic.boardName;
}

export function PcMailboxHome() {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = usePreviewList(useForumTopics());
  const [direction, setDirection] = useState<Direction | null>(null);
  const [openPurposes, setOpenPurposes] = useState<Record<string, boolean>>({});
  const mine = useMemo(() => myClientMailboxTopics(topics), [topics]);

  return (
    <PcActivityShell title="信箱列表" className="is-mailbox">
      <div className="c-mailbox-pc">
        <section className="c-mailbox-dirs" aria-label="信箱列表">
          {MAILBOX_H5_DIRECTIONS.map((item) => {
            const longPurpose = item.purpose.length >= LONG_PURPOSE;
            const purposeOpen = Boolean(openPurposes[item.boardName]);
            return (
              <article key={item.boardName} className="c-mailbox-dir">
                <div className="c-mailbox-dir-row">
                  <button
                    className="c-mailbox-photo-btn"
                    type="button"
                    aria-label={`提交 ${item.title}`}
                    onClick={() => setDirection(item)}
                  >
                    <img className="c-mailbox-photo" src={item.photo} alt="" />
                  </button>
                  <div className="c-mailbox-dir-copy">
                    <button
                      className="c-mailbox-dir-main"
                      type="button"
                      aria-label={`提交 ${item.title}`}
                      onClick={() => setDirection(item)}
                    >
                      <h2>{item.title}</h2>
                      <p className="c-mailbox-handler">{item.handler} · {item.department}</p>
                      <ul className="c-mailbox-tags">
                        {item.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    </button>
                    <button
                      className={purposeOpen ? 'c-mailbox-purpose is-open' : 'c-mailbox-purpose'}
                      type="button"
                      aria-expanded={longPurpose ? purposeOpen : undefined}
                      aria-label={longPurpose ? (purposeOpen ? '收起简介' : '展开简介') : undefined}
                      onClick={() => {
                        if (!longPurpose) return;
                        setOpenPurposes((current) => ({ ...current, [item.boardName]: !current[item.boardName] }));
                      }}
                    >
                      {item.purpose}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="c-mailbox-mine" aria-label="我的建言">
          <h2>我的建言</h2>
          {mine.length ? (
            <ul className="c-mailbox-list">
              {mine.map((topic) => {
                const status = mailboxProposalStatus(topic);
                const board = boards.find((item) => item.name === topic.boardName);
                return (
                  <li key={topic.id}>
                    <a className="c-mailbox-item" href={toPcMailboxTopicHash(topic.id)}>
                      <h3>{topic.title}</h3>
                      <p className="c-mailbox-box">{mailboxLabel(topic)}</p>
                      <div className="c-mailbox-item-top">
                        <p className="c-mailbox-item-tags">
                          {board?.anonymous ? (
                            <span className="c-mailbox-kind">{topic.authorAnonymous ? '匿名' : '实名'}</span>
                          ) : null}
                          <span className={mailboxStatusKindClass(status)}>{status}</span>
                        </p>
                        <span className="c-mailbox-item-time">{topic.publishedAt}</span>
                      </div>
                      <p className="c-mailbox-excerpt">{topic.content}</p>
                      <MailboxProposalPhotos images={topic.images} className="c-mailbox-item-photos" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="c-mailbox-empty">已有 {mailboxProposalCount(topics)} 条建言</p>
          )}
        </section>
      </div>
      {direction ? (
        <H5ForumCompose
          open
          heading="提交建言"
          tags={[]}
          allowAnonymous={Boolean(boards.find((item) => item.name === direction.boardName)?.anonymous)}
          onClose={() => setDirection(null)}
          onSubmit={(draft) => {
            const result = publishClientTopic({
              boardName: direction.boardName,
              title: draft.title,
              content: draft.content,
              images: draft.images,
              tags: [],
              author: forumClientSelf,
              authorAnonymous: draft.anonymous,
              chairName: direction.handler,
            });
            if (!result.ok) {
              toast.show(result.error);
              return;
            }
            toast.show('已提交');
            setDirection(null);
          }}
        />
      ) : null}
    </PcActivityShell>
  );
}
