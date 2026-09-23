import { useMemo, useState } from 'react';
import { goH5Back, toH5ForumTopicHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { MomentMediaViewer } from '../../activities/components/MomentFeed';
import { publishClientTopic, updateClientTopic, deleteClientTopic, useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { type ForumTopic } from '../../../forum/model/forum';
import { clientNeedsReply, isOwnClientTopic, sortClientForumTopics, topicAuthorName, topicListThumbs, visibleClientForumTopics } from '../model/clientForum';
import { ForumPhotoGrid } from './ForumPhotoGrid';
import { ForumPostAuthor } from './ForumPostAuthor';
import { ForumPostTitle, ForumNeedReplyBanner, ForumOwnTopicActions } from './ForumPostTitle';
import { usePreviewList } from '../../portal/emptyPreview';
import { H5ForumCompose } from './H5ForumCompose';
import { ForumPostStats } from './ForumPostStats';
import { ForumPostExcerpt } from './ForumPostExcerpt';
import { H5DeleteSheet } from '../../activities/h5/H5DeleteSheet';

type BoardTab = 'all' | string;
type SortKey = 'reply' | 'publish';

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m15.8 15.8 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 20h4.1L19 9.1 14.9 5 4 15.9z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function matchesTab(topic: ForumTopic, tab: BoardTab) {
  if (tab === 'all') return true;
  return topic.tags.includes(tab);
}

export function H5ForumBoard({ id }: { id: number }) {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = usePreviewList(useForumTopics());
  const board = boards.find((item) => item.id === id && item.kind === 'forum' && item.status === 'enabled');
  const [tab, setTab] = useState<BoardTab>('all');
  const [sort, setSort] = useState<SortKey>('reply');
  const [descOpen, setDescOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editing, setEditing] = useState<ForumTopic | null>(null);
  const [query, setQuery] = useState('');
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number>();

  const tabs = useMemo(() => {
    const tags = (board?.tags ?? []).filter(Boolean);
    return [
      { key: 'all' as const, label: '全部' },
      ...tags.map((name) => ({ key: name, label: name })),
    ];
  }, [board]);

  const list = useMemo(() => {
    if (!board) return [];
    const rows = visibleClientForumTopics(topics, board.name)
      .filter((item) => matchesTab(item, tab))
      .filter((item) => {
        if (!query.trim()) return true;
        return `${item.title}${item.tags.join('')}${item.content}${topicAuthorName(item)}`.includes(query.trim());
      });
    return sortClientForumTopics(rows, sort);
  }, [board, query, sort, tab, topics]);

  if (!board) {
    return (
      <div className="c-h5-shell is-forum">
        <div className="c-h5-frame">
          <header className="c-h5-top">
            <button className="c-icon-btn" type="button" aria-label="返回" onClick={goH5Back}>
              <IconBack />
            </button>
            <h1 className="c-h5-title">论坛</h1>
            <span className="c-icon-btn" aria-hidden />
          </header>
          <main className="c-h5-main">
            <p className="c-forum-empty">论坛不存在或已停用</p>
          </main>
        </div>
      </div>
    );
  }

  const boardTopics = visibleClientForumTopics(topics, board.name);
  const topicCount = boardTopics.length;

  return (
    <div className="c-h5-shell is-forum">
      <div className="c-h5-frame">
        <main className="c-h5-main is-detail c-forum-board">
          <section className="c-forum-hero">
            {board.headerImage ? <img className="c-forum-hero-img" src={board.headerImage} alt="" /> : <span className="c-forum-hero-fallback" />}
            <div className="c-forum-hero-mask" />
            <header className="c-forum-nav">
              <button type="button" aria-label="返回" onClick={goH5Back}>
                <IconBack />
              </button>
            </header>
            <div className="c-forum-hero-overlay">
              <div className="c-forum-hero-meta">
                <img className="c-forum-hero-icon" src={board.icon || board.headerImage} alt="" />
                <div className="c-forum-hero-copy">
                  <h1>{board.name}<span>{topicCount}帖子</span></h1>
                </div>
              </div>
              {board.description ? (
                <button
                  className={descOpen ? 'c-forum-hero-desc is-open' : 'c-forum-hero-desc'}
                  type="button"
                  aria-expanded={descOpen}
                  aria-label={descOpen ? '收起简介' : '展开简介'}
                  onClick={() => setDescOpen((value) => !value)}
                >
                  <span className="c-forum-hero-desc-text">{board.description}</span>
                </button>
              ) : null}
            </div>
          </section>

          <section className="c-forum-sheet">
            <label className="c-forum-search-bar">
              <IconSearch />
              <input
                value={query}
                placeholder="搜索帖子"
                aria-label="搜索帖子"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="c-forum-tabs" role="tablist" aria-label="帖子分类">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  className={tab === item.key ? 'is-on' : undefined}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="c-forum-sort">
              <span>{tab === 'all' ? '全部帖子' : tabs.find((item) => item.key === tab)?.label}</span>
              <div>
                <button type="button" className={sort === 'reply' ? 'is-on' : undefined} onClick={() => setSort('reply')}>
                  最新回复
                </button>
                <button type="button" className={sort === 'publish' ? 'is-on' : undefined} onClick={() => setSort('publish')}>
                  最新发布
                </button>
              </div>
            </div>

            <ul className="c-forum-posts">
              {list.map((topic) => {
                const thumbs = topicListThumbs(topic.images);
                const href = toH5ForumTopicHash(topic.id);
                return (
                <li key={topic.id} className={clientNeedsReply(topic) ? 'c-forum-post is-need-reply' : 'c-forum-post'}>
                  <a className="c-forum-post-main" href={href}>
                    <ForumNeedReplyBanner topic={topic} />
                    <ForumPostAuthor topic={topic} />
                    <ForumPostTitle topic={topic} />
                  </a>
                  {thumbs.length ? (
                    <ForumPhotoGrid
                      className="c-forum-thumbs"
                      images={topic.images}
                      cells={thumbs}
                      onOpen={(index) => setViewer({ urls: topic.images, index })}
                    />
                  ) : null}
                    <ForumPostExcerpt topic={topic} href={href} />
                    <div className="c-forum-post-foot">
                      <ForumPostStats
                        topic={topic}
                        extra={
                          isOwnClientTopic(topic) ? (
                            <ForumOwnTopicActions onEdit={() => setEditing(topic)} onDelete={() => setDeletingId(topic.id)} />
                          ) : null
                        }
                      />
                    </div>
                </li>
                );
              })}
            </ul>
            {list.length === 0 ? <p className="c-forum-empty">暂无帖子</p> : null}
          </section>
        </main>

        <button
          className="c-forum-fab"
          type="button"
          onClick={() => {
            setEditing(null);
            setComposeOpen(true);
          }}
        >
          <IconPencil />
          立即发布
        </button>

        {composeOpen || editing ? (
          <H5ForumCompose
            key={editing ? `edit-${editing.id}` : 'create'}
            open
            mode={editing ? 'edit' : 'create'}
            allowAnonymous={!editing && board.anonymous}
            tags={(board.tags ?? []).filter(Boolean)}
            initial={
              editing
                ? { title: editing.title, content: editing.content, images: editing.images, tag: editing.tags[0] }
                : undefined
            }
            onClose={() => {
              setComposeOpen(false);
              setEditing(null);
            }}
            onSubmit={(draft) => {
              if (editing) {
                const result = updateClientTopic(editing.id, {
                  title: draft.title,
                  content: draft.content,
                  images: draft.images,
                  tags: draft.tag ? [draft.tag] : [],
                });
                if (!result.ok) {
                  toast.show(result.error);
                  return;
                }
                toast.show('已保存');
                setEditing(null);
                return;
              }
              const result = publishClientTopic({
                boardName: board.name,
                title: draft.title,
                content: draft.content,
                images: draft.images,
                tags: draft.tag ? [draft.tag] : [],
                authorAnonymous: draft.anonymous,
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
        {deletingId ? (
          <H5DeleteSheet
            title="删除帖子"
            description="删除后无法恢复。"
            onCancel={() => setDeletingId(undefined)}
            onConfirm={() => {
              const result = deleteClientTopic(deletingId);
              if (!result.ok) toast.show(result.error);
              setDeletingId(undefined);
            }}
          />
        ) : null}
        {viewer ? (
          <MomentMediaViewer
            viewer={{ kind: 'images', urls: viewer.urls, index: viewer.index }}
            onClose={() => setViewer(null)}
            onIndex={(index) => setViewer((current) => (current ? { ...current, index } : current))}
          />
        ) : null}
      </div>
    </div>
  );
}
