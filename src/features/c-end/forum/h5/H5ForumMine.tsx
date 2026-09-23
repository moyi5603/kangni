import { useMemo, useState } from 'react';
import { goH5Back, toH5ForumTopicHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { MomentMediaViewer } from '../../activities/components/MomentFeed';
import { H5DeleteSheet } from '../../activities/h5/H5DeleteSheet';
import { updateClientTopic, deleteClientTopic, useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { type ForumTopic } from '../../../forum/model/forum';
import { myClientForumTopics } from '../model/clientForum';
import { usePreviewList } from '../../portal/emptyPreview';
import { ForumMinePost } from './ForumMinePost';
import { H5ForumCompose } from './H5ForumCompose';

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function H5ForumMine() {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = usePreviewList(useForumTopics());
  const [editing, setEditing] = useState<ForumTopic | null>(null);
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number>();
  const list = useMemo(() => myClientForumTopics(topics), [topics]);
  const editingBoard = editing ? boards.find((item) => item.name === editing.boardName) : undefined;

  return (
    <div className="c-h5-shell is-forum">
      <div className="c-h5-frame">
        <header className="c-h5-top">
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={goH5Back}>
            <IconBack />
          </button>
          <h1 className="c-h5-title">我的帖子</h1>
          <span className="c-icon-btn" aria-hidden />
        </header>
        <main className="c-h5-main is-detail c-forum-mine">
          <ul className="c-forum-posts">
            {list.map((topic) => (
              <ForumMinePost
                key={topic.id}
                topic={topic}
                href={toH5ForumTopicHash(topic.id)}
                onEdit={() => setEditing(topic)}
                onDelete={() => setDeletingId(topic.id)}
                onOpenImages={(index) => setViewer({ urls: topic.images, index })}
              />
            ))}
          </ul>
          {list.length === 0 ? <p className="c-forum-empty">暂无帖子</p> : null}
        </main>
        {editing ? (
          <H5ForumCompose
            key={`edit-${editing.id}`}
            open
            mode="edit"
            tags={(editingBoard?.tags ?? []).filter(Boolean)}
            initial={{ title: editing.title, content: editing.content, images: editing.images, tag: editing.tags[0] }}
            onClose={() => setEditing(null)}
            onSubmit={(draft) => {
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
