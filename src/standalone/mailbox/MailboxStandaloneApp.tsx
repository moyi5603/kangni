import { StandaloneAdminApp } from '../StandaloneAdminApp';
import { renderMailboxAdminPage } from '../forum/renderForumMailboxPages';

export function MailboxStandaloneApp() {
  return <StandaloneAdminApp applicationKey="mailbox" renderPage={renderMailboxAdminPage} />;
}
