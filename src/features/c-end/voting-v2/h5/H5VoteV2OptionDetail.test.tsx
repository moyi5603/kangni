import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { CEndToastProvider } from '../../activities/components/CEndToast';
import { __resetVoteV2SelectionStoreForTests } from '../../../voting-v2/model/voteV2SelectionStore';
import { defaultVoteV2Campaign } from '../../../voting-v2/model/voteV2';
import { __resetVoteV2StoreForTests, getVoteV2, getVoteV2Casts, upsertVoteV2 } from '../../../voting-v2/model/voteV2Store';
import { H5VoteV2OptionDetail } from './H5VoteV2OptionDetail';

beforeEach(() => {
  __resetVoteV2StoreForTests();
  __resetVoteV2SelectionStoreForTests();
});

describe('H5VoteV2OptionDetail', () => {
  it('shows campaign cover, then stats, then full option image and description', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2OptionDetail campaignId={2} optionId={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('c-vote-v2-option-banner');
    expect(html).toContain('/activities/share.jpg');
    expect(html).toContain('c-vote-v2-option-hero');
    expect(html).toContain('/activities/onboarding.jpg');
    expect(html).toContain('c-vote-v2-option-head');
    expect(html).toContain('c-vote-v2-option-stats');
    expect(html).toContain('01');
    expect(html).toContain('张工');
    expect(html).toContain('第1名');
    expect(html).toContain('当前128票');
    expect(html).toContain('差0票');
    expect(html).not.toContain('距离前一名');
    expect(html.indexOf('c-vote-v2-option-banner')).toBeLessThan(html.indexOf('c-vote-v2-option-meta'));
    expect(html.indexOf('c-vote-v2-option-meta')).toBeLessThan(html.indexOf('c-vote-v2-option-hero'));
    expect(html.indexOf('c-vote-v2-option-hero')).toBeLessThan(html.indexOf('c-vote-v2-option-desc'));
    expect(html).toContain('c-vote-v2-option-inset');
    const hero = html.slice(html.indexOf('c-vote-v2-option-hero'), html.indexOf('c-vote-v2-option-desc'));
    const body = html.slice(html.indexOf('c-vote-v2-option-body'), html.indexOf('c-h5-cta-bar'));
    expect(hero).toContain('c-vote-v2-option-inset');
    expect(body).toContain('c-vote-v2-option-inset');
    expect(html).toContain('连续三年零事故');
    expect(html).toContain('c-h5-cta-bar');
    expect(html.indexOf('c-vote-v2-option-body')).toBeLessThan(html.indexOf('c-h5-cta-bar'));
    expect(html.slice(html.indexOf('c-vote-v2-option-body'), html.indexOf('c-h5-cta-bar'))).not.toContain('c-cta');
    expect(html.slice(html.indexOf('c-h5-cta-bar'))).toContain('投票');
    expect(html).not.toContain('aria-label="分享"');
  });

  it('shows gap to previous on a lower ranked option', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2OptionDetail campaignId={2} optionId={2} />
      </CEndToastProvider>,
    );
    expect(html).toContain('李班');
    expect(html).toContain('第2名');
    expect(html).toContain('当前96票');
    expect(html).toContain('差32票');
  });

  it('is mounted from CEndApp', () => {
    const html = renderToStaticMarkup(
      <CEndApp surface="h5" h5Page="vote-v2-option" voteV2Id={2} voteV2OptionId={1} />,
    );
    expect(html).toContain('张工');
  });

  it('opens an option by optionNo when store id is not in the hash', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2OptionDetail campaignId={4} optionId={2} />
      </CEndToastProvider>,
    );
    expect(html).toContain('清炒时蔬');
    expect(html).not.toContain('选项不存在');
  });

  it('uses single-select CTA without a multi-select bar', () => {
    const castsBefore = getVoteV2Casts().length;
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2OptionDetail campaignId={2} optionId={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('投票');
    expect(html).not.toContain('vote-v2-phone-select-bar');
    expect(html).not.toContain('已选1票');
    expect(getVoteV2Casts()).toHaveLength(castsBefore);
  });

  it('keeps single-select detail casting CTA as vote noun', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2OptionDetail campaignId={4} optionId={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('投票');
    expect(html).not.toContain('选择');
    expect(html).not.toContain('vote-v2-phone-select-bar');
  });

  it('applies admin campaign theme and vote noun after upsert', () => {
    upsertVoteV2(
      defaultVoteV2Campaign({
        ...getVoteV2(2)!,
        themeColor: '#abcdef',
        voteButtonNoun: '加油',
      }),
    );
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2OptionDetail campaignId={2} optionId={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('#abcdef');
    expect(html).toContain('加油');
  });
});
