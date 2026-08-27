import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialActivities } from '../../../activities/model/activity';
import { restoreRelatedSignups } from '../../../activities/model/related';
import type { ClientSignupView } from '../model/clientActivity';
import { loadDemoSignups, resetClientSignups } from '../model/signupStore';
import { H5MySignups, SignupGroup } from './H5MySignups';

const signup = {
  activityId: initialActivities[0].id,
  name: '陈产品',
  phone: '13800001111',
  type: '个人报名',
  status: '已通过' as const,
  createdAt: '2026-08-18T12:00:00.000Z',
};

describe('H5 my signups', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });

  it('renders the empty state with one route-home action', () => {
    const html = renderToStaticMarkup(<H5MySignups />);

    expect(html).toContain('<h1 class="c-h5-title">我的报名</h1>');
    expect(html).toContain('<h2>还没有报名活动</h2>');
    expect(html).toContain('<p>去看看最近有哪些活动值得参加</p>');
    expect(html).toContain('>去看看活动</button>');
    expect(html).not.toContain('c-h5-signup-tabs');
    expect(html).not.toContain('c-h5-signup-search');
    expect(html).not.toContain('搜索活动名称');
  });

  it('takes precedence over an activity id in the H5 route branch', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="my" activityId={1} />);

    expect(html).toContain('<h1 class="c-h5-title">我的报名</h1>');
    expect(html).not.toContain('c-detail-cover');
  });

  it('renders a valid association as one whole-card button', () => {
    const item: ClientSignupView = { signup, activity: initialActivities[0] };
    const html = renderToStaticMarkup(<SignupGroup title="待参加" items={[item]} />);

    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('<button');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(initialActivities[0].title);
    expect(html).toContain('个人报名');
    expect(html).toContain('已通过');
    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('已结束');
    expect(html).not.toContain('c-h5-signup-status');
    expect(html).not.toContain(signup.createdAt);
    expect(html).toContain('c-signup-thumb');
    expect(html).toContain(`src="${initialActivities[0].coverUrl}"`);
    expect(html).not.toContain('c-cover-type');
  });

  it('renders a missing association as ended, inactive content', () => {
    const item: ClientSignupView = {
      signup: { ...signup, activityId: -1, status: '待审核' },
    };
    const html = renderToStaticMarkup(<SignupGroup title="已结束" items={[item]} />);
    const cardHtml = html.slice(html.indexOf('<article'), html.indexOf('</article>') + '</article>'.length);

    expect(html).toContain('活动已失效');
    expect(html).toContain('个人报名');
    expect(html).toContain('待审核');
    expect(html).toContain('c-signup-status-row');
    expect(cardHtml).not.toContain('未开始');
    expect(cardHtml).not.toContain('进行中');
    expect(cardHtml).not.toContain('已结束');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('c-signup-thumb');
    expect(html).not.toContain('<img');
  });

  it('defaults to the waiting tab for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups />);

    expect(html).toContain('c-h5-signup-search');
    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).toContain('c-h5-signup-tabs');
    expect(html).toContain('待审核');
    expect(html).toContain('待参加');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('已驳回');
    expect(html).toContain('中秋员工晚会');
    expect(html).toContain('年度体检安排');
    expect(html).toContain('周四篮球夜');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('秋季消防演练');
    expect(html).not.toContain('活动已失效');
  });

  it('shows no pending demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="pending" />);

    expect(html).toContain('暂无待审核活动');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('秋季消防演练');
  });

  it('shows ongoing demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ongoing" />);

    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('秋季消防演练');
  });

  it('shows ended demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ended" />);

    expect(html).toContain('春季员工开放日');
    expect(html).not.toContain('暂无已结束活动');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('秋季消防演练');
  });

  it('shows rejected demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="rejected" />);

    expect(html).toContain('秋季消防演练');
    expect(html).toContain('已驳回');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });

  it('filters the current tab by activity title', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialQuery="晚会" />);

    expect(html).toContain('中秋员工晚会');
    expect(html).toContain('value="晚会"');
    expect(html).not.toContain('年度体检安排');
  });

  it('keeps the query when showing another tab and reports no matches', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="pending" initialQuery="晚会" />);

    expect(html).toContain('未找到相关活动');
    expect(html).toContain('value="晚会"');
    expect(html).toContain('c-h5-signup-tabs');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });
});
