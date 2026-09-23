import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettings';
import { saveInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { patchDecoBlock } from '../../../../shared/decoration/decoTypes';
import { getIgDecoration, resetIgDecoration, saveIgDecoration } from '../../../interest-groups/model/igDecorationStore';
import {
  toggleInterestGroupActivityPin,
  toggleInterestGroupPin,
  __resetInterestGroupStoreForTest,
} from '../../../interest-groups/model/interestGroupStore';
import { resetInterestGroupActivityRatings } from '../../../interest-groups/model/interestGroupActivityRating';
import { IgScreenPreview } from '../h5/H5InterestGroupHome';
import { PcInterestGroupHome } from './PcInterestGroupHome';

describe('PC interest group home', () => {
  beforeEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
    resetIgDecoration();
    resetInterestGroupActivityRatings();
  });
  afterEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
    resetIgDecoration();
    resetInterestGroupActivityRatings();
  });

  it('uses the PC shell and employee home copy', () => {
    const html = renderToStaticMarkup(<PcInterestGroupHome />);

    expect(html).toContain('class="c-pc-shell is-ig"');
    expect(html).toContain('c-pc-ig-stage');
    expect(html).toContain('c-pc-ig-home');
    expect(html).toContain('兴趣圈');
    expect(html).not.toContain('aria-label="轮播图"');
    expect(html).toContain('aria-label="快捷入口"');
    expect(html).toContain('c-ig-apps');
    expect(html).toContain('创建活动');
    expect(html).toContain('创建兴趣圈');
    expect(html).not.toContain('c-ig-shortcuts');
    expect(html).not.toContain('aria-label="更多"');
    expect(html).toContain('热门兴趣圈');
    expect(html).not.toContain('总部 · 滨江园区');
    expect(html).not.toContain('近郊 · 多线路');
    expect(html).not.toContain('活动区域');
    expect(html).toContain('周末连营徒步');
    expect(html).not.toContain('c-h5-shell');
    expect(html).not.toContain('回主页');
    expect(html).not.toContain('c-ig-ai-entry');
    expect(html).not.toContain('和AI助手聊聊，找到适合你的活动');
    expect((html.match(/aria-label="快捷入口"/g) ?? []).length).toBe(1);
  });

  it('shows three activity cards per row, live acts on home, and past highlights', () => {
    const html = renderToStaticMarkup(<PcInterestGroupHome />);
    const acts = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect((acts.match(/c-pc-card c-card-btn is-large-image/g) ?? []).length).toBe(6);
    expect(acts).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(acts).toContain('周五开黑体验局');
    expect(acts).toContain('午间拉伸跟练三期');
    expect(acts).not.toContain('夏季共读三期');
    expect(html).toContain('c-pc-grid is-large-image is-cols-3');

    const groups = html.slice(html.indexOf('c-ig-block is-groups'), html.indexOf('>活动<'));
    expect(groups).toContain('c-ig-group-grid');
    expect(groups).toContain('is-cols-3');
    expect(groups).not.toContain('c-ig-hscroll');
    expect((groups.match(/class="c-ig-group(?:\s|")/g) ?? []).length).toBe(3);
    expect(groups.indexOf('桌游电竞局')).toBeLessThan(groups.indexOf('城市夜跑团'));

    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect(past).toContain('初夏城市漫步');
    expect(past).toContain('夏季共读三期');
    expect(past).toContain('已结束');
    expect(past).toContain('c-past-act');
    expect(past).toContain('is-cols-4');
    expect(past).not.toContain('c-ig-ended');
    expect(past).not.toContain('配速组第一次破五，全员击掌。');
    expect(past).not.toContain('c-past-card');
  });

  it('applies PC 4-column layout to 兴趣圈 cards', async () => {
    saveIgDecoration(
      'pc',
      patchDecoBlock(getIgDecoration('pc'), 'deco-groups', { listStyle: 'large-image', columnCount: 4, latestCount: 8 }),
    );
    const html = renderToStaticMarkup(<PcInterestGroupHome />);
    expect(html).toContain('c-ig-group-grid is-large-image is-cols-4');
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../h5/groupHome.css'), 'utf8');
    expect(css).toContain('.c-pc-shell.is-ig .c-ig-group-grid.is-large-image.is-cols-4');
    expect(css).toContain('repeat(4, minmax(0, 1fr))');
  });

  it('hides configured 兴趣圈 card fields', () => {
    saveIgDecoration(
      'pc',
      patchDecoBlock(getIgDecoration('pc'), 'deco-groups', {
        showTitle: false,
        showCategoryTag: false,
        showIntro: false,
        showMembers: false,
        showJoinButton: false,
      }),
    );
    const html = renderToStaticMarkup(<PcInterestGroupHome />);
    const groups = html.slice(html.indexOf('c-ig-block is-groups'), html.indexOf('>活动<'));
    expect(groups).not.toContain('城市夜跑团');
    expect(groups).not.toContain('运动健身');
    expect(groups).not.toContain('下班后甩开屏幕');
    expect(groups).not.toContain('成员');
    expect(groups).not.toContain('已加入');
    expect(groups).not.toContain('c-card-action');
  });

  it('keeps 全部兴趣圈 cards on the home group grid', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="allGroups" surface="pc" />);
    expect(html).toContain('全部兴趣圈');
    expect(html).toContain('c-ig-group-grid is-large-image');
    expect(html).not.toContain('is-wide');
    expect(html).not.toContain('c-ig-hscroll');
  });

  it('lists PC 全部兴趣圈 / 全部活动 in admin pin then sortIndex order', () => {
    toggleInterestGroupPin(3);
    toggleInterestGroupActivityPin(101);
    const groups = renderToStaticMarkup(<IgScreenPreview name="allGroups" surface="pc" />);
    const groupSlice = groups.slice(groups.indexOf('aria-label="全部兴趣圈"'));
    expect(groupSlice.indexOf('深夜读书会')).toBeLessThan(groupSlice.indexOf('城市夜跑团'));
    const acts = renderToStaticMarkup(<IgScreenPreview name="allActs" surface="pc" />);
    const actSlice = acts.slice(acts.indexOf('aria-label="全部活动"'));
    expect(actSlice.indexOf('滨江 8K 夜跑')).toBeLessThan(actSlice.indexOf('周末连营徒步'));
  });

  it('opens PC 往期精彩回顾 as a full catalog', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="moments" surface="pc" />);
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('c-back-link');
    expect(html).toContain('← 返回首页');
    expect(html).toContain('c-pc-grid is-large-image');
    expect(html).toContain('c-past-act');
    expect(html).toContain('初夏城市漫步');
    expect(html).toContain('已结束');
    expect(html).not.toContain('c-ig-stack-title');
    expect(html).not.toContain('c-past-rail');
    expect(html).not.toContain('c-moment-card');
    expect((html.match(/c-past-act"/g) ?? []).length).toBeGreaterThan(1);
  });

  it('mounts 往期精彩回顾 as a real CEndApp page, not the IG home overlay', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="ig-past-moments" />);

    expect(html).toContain('<h1 class="c-pc-header-title">往期精彩回顾</h1>');
    expect(html).toContain('c-back-link');
    expect(html).toContain('← 返回首页');
    expect(html).toContain('初夏城市漫步');
    expect(html).toContain('夏季共读三期');
    expect(html).toContain('c-past-act');
    expect(html).not.toContain('aria-label="快捷入口"');
    expect(html).not.toContain('创建活动');
    expect(html).not.toContain('c-ig-apps');
    expect(html).not.toContain('员工活动');
  });

  it('is mounted from CEndApp interest-groups PC route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="interest-groups" />);

    expect(html).toContain('class="c-pc-shell is-ig"');
    expect(html).toContain('创建活动');
    expect(html).not.toContain('员工活动');
  });

  it('shows check-in QR on C-end activity detail for the host', () => {
    const stretch = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '601' }} />);
    expect(stretch).toContain('签到二维码');
    expect(stretch).toContain('c-org-qr');

    const nightRun = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(nightRun).not.toContain('签到二维码');
  });

  it('threads PC activity comments with reply and like affordances', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} surface="pc" />);
    const block = html.slice(html.indexOf('id="ig-activity-social"'));
    expect(block).toContain('张悦 回复 周棠');
    expect(block).toContain('c-comment-reply');
    expect(block).toContain('aria-label="点赞"');
    expect(block).toContain('c-activity-comment-replies');
  });

  it('shows activity rating on ended PC activity detail', () => {
    const ended = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} surface="pc" />);
    expect(ended).toContain('class="c-pc-shell is-ig"');
    expect(ended).toContain('c-activity-rating');
    expect(ended).toContain('活动评分');
    expect(ended).toContain('确认评分');
    expect(ended.indexOf('活动简介')).toBeLessThan(ended.indexOf('c-activity-rating'));
    expect(ended.indexOf('c-activity-rating')).toBeLessThan(ended.indexOf('id="ig-activity-social"'));

    const ongoing = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} surface="pc" />);
    expect(ongoing).not.toContain('c-activity-rating');
  });

  it('shows two search results per row', () => {
    const html = renderToStaticMarkup(
      <IgScreenPreview name="search" params={{ q: '夜跑' }} surface="pc" />,
    );
    expect(html).toContain('class="c-pc-shell is-ig"');
    expect((html.match(/c-ig-row-list is-pc-2/g) ?? []).length).toBe(2);
    expect(html).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(html).toContain('城市夜跑团');
  });

  it('keeps the mobile-style activity intro composer on create', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="createAct" />);
    expect(html).toContain('活动介绍');
    expect(html).toContain('c-ig-desc-preview');
    expect(html).toContain('活动安排、注意事项');
  });
});
