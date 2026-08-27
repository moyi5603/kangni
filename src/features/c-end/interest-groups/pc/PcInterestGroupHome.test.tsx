import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettings';
import { saveInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { __resetInterestGroupStoreForTest } from '../../../interest-groups/model/interestGroupStore';
import { IgScreenPreview } from '../h5/H5InterestGroupHome';
import { PcInterestGroupHome } from './PcInterestGroupHome';

describe('PC interest group home', () => {
  beforeEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
  });
  afterEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
  });

  it('uses the PC shell and employee home copy', () => {
    const html = renderToStaticMarkup(<PcInterestGroupHome />);

    expect(html).toContain('class="c-pc-shell is-ig"');
    expect(html).toContain('c-pc-ig-stage');
    expect(html).toContain('兴趣小组');
    expect(html).toContain('创建活动');
    expect(html).toContain('创建小组');
    expect(html).toContain('热门小组');
    expect(html).toContain('周末连营徒步');
    expect(html).not.toContain('c-h5-shell');
    expect(html).not.toContain('回主页');
  });

  it('shows three activity cards per row, six on home, and five past highlights', () => {
    const html = renderToStaticMarkup(<PcInterestGroupHome />);
    const acts = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect((acts.match(/c-ig-act"/g) ?? []).length).toBe(4);
    expect(acts).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(html).toContain('c-ig-acts is-pc-3');

    const groups = html.slice(html.indexOf('aria-label="热门小组"'), html.indexOf('>活动<'));
    expect((groups.match(/c-ig-group/g) ?? []).length).toBeGreaterThanOrEqual(5);

    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect((past.match(/c-past-card/g) ?? []).length).toBe(5);
    expect(past).toContain('配速组第一次破五，全员击掌。');
    expect(past).toContain('夜跑收工，江风把汗吹干。');
    expect(past).toContain('书吧灯还亮着，围读散场合影。');
    expect(past).toContain('五黑翻盘，这把要回看十遍。');
    expect(past).toContain('连营第二天，溪边煮面最香。');
    expect(past).not.toContain('初夏漫步打卡，夕阳刚好。');
  });

  it('is mounted from CEndApp interest-groups PC route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="interest-groups" />);

    expect(html).toContain('class="c-pc-shell is-ig"');
    expect(html).toContain('创建活动');
    expect(html).not.toContain('员工活动');
  });

  it('keeps the mobile-style activity intro composer on create', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="createAct" />);
    expect(html).toContain('活动介绍');
    expect(html).toContain('c-ig-desc-preview');
    expect(html).toContain('活动安排、注意事项');
  });
});
