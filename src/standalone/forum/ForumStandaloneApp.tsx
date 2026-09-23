import { StandaloneAdminApp } from '../StandaloneAdminApp';
import { renderForumAdminPage } from './renderForumMailboxPages';

export function ForumStandaloneApp() {
  return <StandaloneAdminApp applicationKey="forum" renderPage={renderForumAdminPage} />;
}
