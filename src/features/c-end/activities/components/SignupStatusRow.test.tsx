import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SignupStatusRow } from './SignupStatusRow';

describe('SignupStatusRow', () => {
  it('renders activity and audit pills together', () => {
    const html = renderToStaticMarkup(
      <SignupStatusRow activityStatus="进行中" auditStatus="已通过" />,
    );

    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('c-pill is-ongoing');
    expect(html).toContain('进行中');
    expect(html).toContain('c-pill is-audit-passed');
    expect(html).toContain('已通过');
  });

  it('omits the activity pill when the association is missing', () => {
    const html = renderToStaticMarkup(<SignupStatusRow auditStatus="待审核" />);

    expect(html).toContain('待审核');
    expect(html).toContain('is-audit-pending');
    expect(html).not.toContain('未开始');
    expect(html).not.toContain('进行中');
    expect(html).not.toContain('已结束');
    expect(html).not.toContain('c-pill is-upcoming');
    expect(html).not.toContain('c-pill is-ongoing');
    expect(html).not.toContain('c-pill is-ended');
  });

  it('renders activity status without an audit pill', () => {
    const html = renderToStaticMarkup(<SignupStatusRow activityStatus="进行中" />);

    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('进行中');
    expect(html).not.toContain('is-audit-');
  });
});
