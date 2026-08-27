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
