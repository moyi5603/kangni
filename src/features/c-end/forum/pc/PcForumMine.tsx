import { useMemo, useState } from 'react';
import { toPcForumTopicHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { MomentMediaViewer } from '../../activities/components/MomentFeed';
import { H5DeleteSheet } from '../../activities/h5/H5DeleteSheet';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { updateClientTopic, deleteClientTopic, useForumBoards, useForumTopics } from '../../../forum/model/forumStore';
import { type ForumTopic } from '../../../forum/model/forum';
import { myClientForumTopics } from '../model/clientForum';
import { usePreviewList } from '../../portal/emptyPreview';
import { ForumMinePost } from '../h5/ForumMinePost';
import { H5ForumCompose } from '../h5/H5ForumCompose';

export function PcForumMine() {
  const toast = useCEndToast();
  const boards = useForumBoards();
  const topics = usePreviewList(useForumTopics());
  const [editing, setEditing] = useState<ForumTopic | null>(null);
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number>();
  const list = useMemo(() => myClientForumTopics(topics), [topics]);
  const editingBoard = editing ? boards.find((item) => item.name === editing.boardName) : undefined;

  return (
    <PcActivityShell title="我的帖子" className="is-forum">
      <div className="c-forum-pc-layout is-board is-mine">
        <ul className="c-forum-posts">
          {list.map((topic) => (
            <ForumMinePost
              key={topic.id}
              topic={topic}
              href={toPcForumTopicHash(topic.id)}
              statsVariant="list"
              thumbMax={5}
              onEdit={() => setEditing(topic)}
              onDelete={() => setDeletingId(topic.id)}
              onOpenImages={(index) => setViewer({ urls: topic.images, index })}
            />
          ))}
        </ul>
        {list.length === 0 ? <p className="c-forum-empty">暂无帖子</p> : null}
      </div>
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
    </PcActivityShell>
  );
}
