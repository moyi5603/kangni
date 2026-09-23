import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VoteV2PhonePreview } from './VoteV2PhonePreview';

const base = {
  name: '点赞活动',
  intro: '<p>介绍正文</p>',
  startAt: '2026-08-27 17:07:33',
  endAt: '2026-09-06 23:59:59',
  coverUrl: '',
  themeColor: '#31cab1',
  contestantNoun: '选手',
  voteButtonNoun: '点赞',
  voteUnit: '赞',
  homeColumns: 2,
  groupingEnabled: false,
  groups: [],
  period: '每天' as const,
  selectMode: '单选' as const,
  quotaPerUser: 2,
  nowAt: '2026-08-27 17:07:33',
};

describe('VoteV2PhonePreview', () => {
  it('keeps an empty option list instead of sample rows when contestants is []', () => {
    const html = renderToStaticMarkup(<VoteV2PhonePreview {...base} contestants={[]} />);
    expect(html).not.toContain('示例1');
    expect(html).not.toContain('锁住');
  });

  it('uses a fixed portrait slot for option covers, not the activity cover', () => {
    const empty = renderToStaticMarkup(<VoteV2PhonePreview {...base} />);
    expect(empty).toContain('vote-v2-phone-cover is-empty');
    expect(empty).not.toContain('vote-v2-phone-cover is-portrait');
    expect(empty).toContain('vote-v2-phone-card-img is-portrait');

    const html = renderToStaticMarkup(<VoteV2PhonePreview {...base} coverUrl="/cover-banner.jpg" />);
    expect(html).toContain('src="/cover-banner.jpg"');
    expect(html).not.toContain('vote-v2-phone-cover is-portrait');
  });

  it('renders stats and info cards above intro', () => {
    const html = renderToStaticMarkup(<VoteV2PhonePreview {...base} />);
    const statsAt = html.indexOf('vote-v2-phone-stats');
    const infoAt = html.indexOf('vote-v2-phone-info');
    const introCardAt = html.indexOf('vote-v2-phone-intro-card');
    const labelAt = html.indexOf('点赞介绍：');
    const introWrapAt = html.indexOf('vote-v2-phone-info-intro');
    const introAt = html.indexOf('介绍正文');
    const listAt = html.indexOf('vote-v2-phone-list');
    expect(statsAt).toBeGreaterThan(0);
    expect(infoAt).toBeGreaterThan(statsAt);
    expect(introCardAt).toBeGreaterThan(infoAt);
    expect(labelAt).toBeGreaterThan(introCardAt);
    expect(introWrapAt).toBeGreaterThan(labelAt);
    expect(introAt).toBeGreaterThan(introWrapAt);
    expect(listAt).toBeGreaterThan(introAt);
    expect(html.slice(infoAt, introCardAt)).not.toContain('点赞介绍：');
    expect(html).toContain('选手数');
    expect(html).toContain('总赞数');
    expect(html).toContain('浏览量');
    expect(html).toContain('>0</strong>');

    const withViews = renderToStaticMarkup(<VoteV2PhonePreview {...base} viewCount={1280} />);
    expect(withViews).toContain('>1280</strong>');
    expect(withViews).toContain('浏览量');
    expect(html).toContain('活动倒计时');
    expect(html).toContain('点赞开始：2026-08-27 17:07:33');
    expect(html).toContain('点赞结束：2026-09-06 23:59:59');
    expect(html).toContain('点赞规则：每人每天可投2票');
    expect(html).toContain('点赞介绍：');
    expect(html).not.toContain('投票时间未设置');
    expect(html).not.toContain('vote-v2-phone-nav');
    expect(html).not.toContain('排行榜');
    expect(html).not.toContain('vote-v2-phone-bg');
    expect(html.split('vote-v2-phone-card"').length - 1).toBe(8);
    expect(html).toContain('vote-v2-phone-card-body');
    expect(html).toContain('vote-v2-phone-card-media');
    expect(html.split('vote-v2-phone-card-detail').length - 1).toBe(8);
    expect(html).toContain('详情');
    expect(html.indexOf('vote-v2-phone-card-vote')).toBeLessThan(html.indexOf('vote-v2-phone-card-detail'));
    expect(html).toContain('vote-v2-phone-card-no');
    expect(html).toContain('vote-v2-phone-card-no">01<');
    expect(html).toContain('vote-v2-phone-card-no">08<');
    expect(html).toContain('示例1');
    expect(html).toContain('示例8');
    expect(html).toContain('data-cols="2"');
    expect(html).toContain('vote-v2-phone-card-actions is-stack');
    expect(html).toContain('赞');
    expect(html).toContain('vote-v2-phone-search');
    expect(html).toContain('vote-v2-phone-search-btn');
    expect(html).toContain('请输入选手名称、编号');
    expect(html).toContain('vote-v2-phone-group-tabs');
    expect(html).toContain('全部分组');
    expect(html).toContain('分组1');
    expect(html).toContain('分组2');
    expect(html).not.toContain('data-group-cols');
    expect(html.indexOf('vote-v2-phone-search-btn')).toBeLessThan(html.indexOf('vote-v2-phone-group-tabs'));
    expect(html).toContain('>点赞<');
    expect(html).not.toContain('>选择<');
    expect(html).not.toContain('vote-v2-phone-select-bar');
  });

  it('shows page background only when enabled with an image', () => {
    const off = renderToStaticMarkup(
      <VoteV2PhonePreview {...base} backgroundEnabled={false} backgroundUrl="data:image/png;base64,xx" />,
    );
    expect(off).not.toContain('vote-v2-phone-bg');

    const on = renderToStaticMarkup(
      <VoteV2PhonePreview {...base} backgroundEnabled backgroundUrl="https://example.com/bg.png" />,
    );
    expect(on).toContain('vote-v2-phone-bg');
    expect(on).toContain('https://example.com/bg.png');
  });

  it('clamps homeColumns above 3 to two columns', () => {
    const html = renderToStaticMarkup(<VoteV2PhonePreview {...base} homeColumns={4} />);
    expect(html).toContain('data-cols="2"');
    expect(html).not.toContain('data-cols="4"');
  });

  it('uses three columns when homeColumns is 3, including form string values', () => {
    expect(renderToStaticMarkup(<VoteV2PhonePreview {...base} homeColumns={3} />)).toContain('data-cols="3"');
    expect(renderToStaticMarkup(<VoteV2PhonePreview {...base} homeColumns={'3' as unknown as number} />)).toContain(
      'data-cols="3"',
    );
  });

  it('uses five PC columns when surface is pc', () => {
    const html = renderToStaticMarkup(<VoteV2PhonePreview {...base} surface="pc" homeColumns={5} />);
    expect(html).toContain('data-cols="5"');
    expect(html).toContain('vote-v2-phone-card-actions is-stack');
  });

  it('uses a single-column card layout when homeColumns is 1', () => {
    const html = renderToStaticMarkup(<VoteV2PhonePreview {...base} homeColumns={1} />);
    expect(html).toContain('data-cols="1"');
    expect(html).toContain('vote-v2-phone-card-media');
    expect(html).not.toContain('vote-v2-phone-card-actions is-stack');
  });

  it('filters sample cards by name or number', () => {
    const byName = renderToStaticMarkup(<VoteV2PhonePreview {...base} searchQuery="示例8" />);
    expect(byName.split('vote-v2-phone-card"').length - 1).toBe(1);
    expect(byName).toContain('示例8');
    expect(byName).not.toContain('示例1');

    const byNo = renderToStaticMarkup(<VoteV2PhonePreview {...base} searchQuery="08" />);
    expect(byNo.split('vote-v2-phone-card"').length - 1).toBe(1);
    expect(byNo).toContain('示例8');
  });

  it('hides preview blocks when page display flags are off', () => {
    const html = renderToStaticMarkup(
      <VoteV2PhonePreview
        {...base}
        groupingEnabled
        groups={[{ id: 1, name: '生产组' }]}
        pageDisplay={{
          ...{
            activityName: false,
            activityStats: true,
            totalVotes: false,
            countdown: false,
            voteTime: false,
            voteRules: false,
            intro: false,
            search: false,
            groups: false,
            contestantNo: false,
            contestantCover: true,
            contestantName: true,
            contestantSubtitle: false,
            contestantVotes: false,
            voteButton: false,
            detailButton: false,
          },
        }}
      />,
    );
    expect(html).not.toContain('vote-v2-phone-title');
    expect(html).not.toContain('vote-v2-phone-search');
    expect(html).not.toContain('vote-v2-phone-group-tabs');
    expect(html).not.toContain('全部分组');
    expect(html).not.toContain('vote-v2-phone-card-detail');
    expect(html).not.toContain('vote-v2-phone-card-vote');
    expect(html).not.toContain('vote-v2-phone-card-no');
    expect(html).not.toContain('vote-v2-phone-card-sub');
    expect(html).toContain('vote-v2-phone-stats');
    expect(html).toContain('data-stat-cols="2"');
    expect(html).not.toContain('总赞数');
    expect(html).not.toContain('vote-v2-phone-intro-card');
  });

  it('hides option counts on group tabs', () => {
    const html = renderToStaticMarkup(
      <VoteV2PhonePreview
        {...base}
        groupingEnabled
        groups={[
          { id: 1, name: '生产组超长名称用来确认列宽不跟着字数变', optionCount: 2 },
          { id: 2, name: '职能组', optionCount: 1 },
          { id: 3, name: '后勤组' },
          { id: 4, name: '营销组' },
          { id: 5, name: '质量组' },
        ]}
      />,
    );
    expect(html).toContain('生产组超长名称用来确认列宽不跟着字数变');
    expect(html).toContain('职能组');
    expect(html).toContain('后勤组');
    expect(html).toContain('营销组');
    expect(html).toContain('质量组');
    expect(html).not.toContain('生产组（2）');
    expect(html).not.toContain('职能组（1）');
    expect(html).not.toContain('data-group-cols');
    expect(html).toContain('vote-v2-phone-group-tab');
  });

  it('hides all-groups tab when showAllGroups is off', () => {
    const html = renderToStaticMarkup(
      <VoteV2PhonePreview
        {...base}
        groupingEnabled
        showAllGroups={false}
        groups={[
          { id: 1, name: '生产组' },
          { id: 2, name: '职能组' },
        ]}
      />,
    );
    expect(html).not.toContain('全部分组');
    expect(html).toContain('生产组');
    expect(html).toContain('职能组');
  });

  it('disables vote on locked contestants', () => {
    const html = renderToStaticMarkup(
      <VoteV2PhonePreview
        {...base}
        contestants={[
          {
            id: 1,
            campaignId: 1,
            optionNo: 1,
            name: '锁住',
            subtitle: '',
            imageUrl: '',
            videoUrl: '',
            audioUrl: '',
            description: '',
            phone: '',
            voteCount: 1,
            locked: true,
          },
        ]}
      />,
    );
    expect(html).toContain('锁住');
    expect(html).toMatch(/vote-v2-phone-card-vote[^>]*disabled/);
  });
});
