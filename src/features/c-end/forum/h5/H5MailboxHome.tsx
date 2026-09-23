import { useMemo, useState } from 'react';
import { goH5Back, toH5MailboxTopicHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { forumClientSelf } from '../../../forum/model/forum';
import { publishClientTopic, useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { mailboxProposalCount, mailboxProposalStatus, myClientMailboxTopics } from '../model/clientForum';
import { usePreviewList } from '../../portal/emptyPreview';
import { H5ForumCompose } from './H5ForumCompose';

export const MAILBOX_H5_DIRECTIONS = [
  {
    boardName: '经营发展',
    title: '战略发展建言',
    handler: '李明远',
    department: '经营管理中心',
    purpose: '关注长期发展、经营策略与跨部门协同落地路径，收集战略规划、流程优化和业务创新方面的落地建议。',
    tags: ['战略发展', '业务创新', '流程优化'],
    photo: '/forum/mailbox-li.png',
  },
  {
    boardName: '员工体验',
    title: '员工体验建言',
    handler: '周岚',
    department: '人力资源部',
    purpose: '关注人才发展、员工体验与企业文化建设，收集组织管理、日常办公感受、培养机制、沟通协作和福利保障方面的改进意见，推动一线问题及时闭环，让员工反馈能被看见并跟进。',
    tags: ['员工体验', '组织管理', '企业文化'],
    photo: '/forum/mailbox-zhou.png',
  },
] as const;

type Direction = (typeof MAILBOX_H5_DIRECTIONS)[number];
const LONG_PURPOSE = 70;

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MailboxProposalPhotos({ images, className }: { images: string[]; className: string }) {
  if (!images.length) return null;
  return (
    <ul className={className}>
      {images.map((src) => (
        <li key={src}>
          <img src={src} alt="" />
        </li>
      ))}
    </ul>
  );
}

function mailboxLabel(topic: { boardName: string }) {
  return MAILBOX_H5_DIRECTIONS.find((item) => item.boardName === topic.boardName)?.title ?? topic.boardName;
}

export function mailboxStatusKindClass(status: ReturnType<typeof mailboxProposalStatus>) {
  if (status === '已回复') return 'c-mailbox-kind is-done';
  if (status === '已驳回') return 'c-mailbox-kind is-reject';
  return 'c-mailbox-kind is-wait';
}

export function H5MailboxHome() {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = usePreviewList(useForumTopics());
  const [direction, setDirection] = useState<Direction | null>(null);
  const [openPurposes, setOpenPurposes] = useState<Record<string, boolean>>({});
  const mine = useMemo(() => myClientMailboxTopics(topics), [topics]);

  return (
    <div className="c-h5-shell is-mailbox">
      <div className="c-h5-frame">
        <main className="c-h5-main is-detail c-mailbox">
          <header className="c-mailbox-hero">
            <div className="c-mailbox-hero-bar">
              <button className="c-mailbox-back" type="button" aria-label="返回" onClick={goH5Back}>
                <IconBack />
              </button>
              <h1>信箱列表</h1>
            </div>
          </header>

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
                      <a className="c-mailbox-item" href={toH5MailboxTopicHash(topic.id)}>
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
        </main>
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
    </div>
  );
}
