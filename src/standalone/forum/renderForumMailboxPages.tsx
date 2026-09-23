import type { ReactNode } from 'react';
import { ForumBoardDetailPage } from '../../features/forum/pages/ForumBoardDetailPage';
import { ForumBoardFormPage } from '../../features/forum/pages/ForumBoardFormPage';
import { ForumBoardListPage } from '../../features/forum/pages/ForumBoardListPage';
import { ForumOverviewPage } from '../../features/forum/pages/ForumOverviewPage';
import { ForumRiskPage } from '../../features/forum/pages/ForumRiskPage';
import { ForumTagListPage } from '../../features/forum/pages/ForumTagListPage';
import { ForumTopicDetailPage } from '../../features/forum/pages/ForumTopicDetailPage';
import { ForumTopicListPage } from '../../features/forum/pages/ForumTopicListPage';
import { MailboxOverviewPage } from '../../features/forum/pages/MailboxOverviewPage';
import { findBoardByName } from '../../features/forum/model/forum';
import { getForumBoards, getForumTopic } from '../../features/forum/model/forumStore';
import { PlaceholderPage } from '../../features/shell/pages/PlaceholderPage';

type GoToPage = (page: string, recordId?: string) => void;

function backToBoard(kind: 'forum' | 'mailbox', recordId: string | undefined, goToPage: GoToPage) {
  const topic = getForumTopic(Number(recordId));
  const board = topic ? findBoardByName(getForumBoards(), topic.boardName) : undefined;
  if (board) goToPage(kind === 'mailbox' ? 'mailbox-detail' : 'forum-detail', String(board.id));
  else goToPage(kind === 'mailbox' ? 'mailbox-list' : 'forum-list');
}

export function renderForumAdminPage(page: string, recordId: string | undefined, goToPage: GoToPage): ReactNode {
  if (page === 'forum-overview') return <ForumOverviewPage onNavigate={goToPage} />;
  if (page === 'forum-list') return <ForumBoardListPage kind="forum" onNavigate={goToPage} />;
  if (page === 'forum-create' || page === 'forum-edit') {
    return (
      <ForumBoardFormPage
        key={`${page}-${recordId ?? 'new'}`}
        kind="forum"
        mode={page === 'forum-edit' ? 'edit' : 'create'}
        recordId={recordId}
        onBack={() => goToPage('forum-list')}
        onSaved={() => goToPage('forum-list')}
      />
    );
  }
  if (page === 'forum-detail') {
    return (
      <ForumBoardDetailPage
        kind="forum"
        recordId={recordId}
        onBack={() => goToPage('forum-list')}
        onEdit={(id) => goToPage('forum-edit', String(id))}
        onNavigate={goToPage}
      />
    );
  }
  if (page === 'forum-tags') return <ForumTagListPage />;
  if (page === 'topic-detail') {
    return (
      <ForumTopicDetailPage
        kind="forum"
        recordId={recordId}
        onBack={() => backToBoard('forum', recordId, goToPage)}
      />
    );
  }
  if (page === 'forum-risk') return <ForumRiskPage />;
  return (
    <PlaceholderPage breadcrumbItems={[{ title: '论坛' }]} title="论坛" applicationLabel="论坛" />
  );
}

export function renderMailboxAdminPage(page: string, recordId: string | undefined, goToPage: GoToPage): ReactNode {
  if (page === 'mailbox-overview') return <MailboxOverviewPage onNavigate={goToPage} />;
  if (page === 'mailbox-list') return <ForumBoardListPage kind="mailbox" onNavigate={goToPage} />;
  if (page === 'mailbox-create' || page === 'mailbox-edit') {
    return (
      <ForumBoardFormPage
        key={`${page}-${recordId ?? 'new'}`}
        kind="mailbox"
        mode={page === 'mailbox-edit' ? 'edit' : 'create'}
        recordId={recordId}
        onBack={() => goToPage('mailbox-list')}
        onSaved={() => goToPage('mailbox-list')}
      />
    );
  }
  if (page === 'mailbox-detail') {
    return (
      <ForumBoardDetailPage
        kind="mailbox"
        recordId={recordId}
        onBack={() => goToPage('mailbox-list')}
        onEdit={(id) => goToPage('mailbox-edit', String(id))}
        onNavigate={goToPage}
      />
    );
  }
  if (page === 'mailbox-messages') {
    return <ForumTopicListPage kind="mailbox" boardId={recordId} onNavigate={goToPage} />;
  }
  if (page === 'advice-detail') {
    return (
      <ForumTopicDetailPage
        kind="mailbox"
        recordId={recordId}
        onBack={() => backToBoard('mailbox', recordId, goToPage)}
      />
    );
  }
  return (
    <PlaceholderPage breadcrumbItems={[{ title: '信箱' }]} title="信箱" applicationLabel="信箱" />
  );
}
