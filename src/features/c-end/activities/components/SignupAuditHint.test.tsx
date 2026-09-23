import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getActivity } from '../../../activities/model/activityStore';
import { SignupAuditHint } from './SignupAuditHint';

describe('SignupAuditHint', () => {
  it('shows node progress and current reviewers for a pending signup', () => {
    const html = renderToStaticMarkup(<SignupAuditHint activity={getActivity(28)!} />);
    expect(html).toContain('报名审核中（第 1/2 节点） · 当前审核：张悦、李明');
  });

  it('renders nothing when the user has no pending signup', () => {
    const html = renderToStaticMarkup(<SignupAuditHint activity={getActivity(2)!} />);
    expect(html).toBe('');
  });
});
