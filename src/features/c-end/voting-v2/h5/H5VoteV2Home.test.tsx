import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { CEndToastProvider } from '../../activities/components/CEndToast';
import { defaultVoteV2Campaign } from '../../../voting-v2/model/voteV2';
import { __resetVoteV2StoreForTests, getVoteV2, upsertVoteV2 } from '../../../voting-v2/model/voteV2Store';
import { H5VoteV2Home } from './H5VoteV2Home';

beforeEach(() => {
  __resetVoteV2StoreForTests();
});

describe('H5VoteV2Home', () => {
  it('renders the v2 phone home without the device chrome', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2Home id={2} />
      </CEndToastProvider>,
    );
    expect(html).toContain('c-vote-v2-h5');
    expect(html).not.toContain('vote-v2-phone ');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('张工');
    expect(html).toContain('vote-v2-phone-intro-card');
    expect(html).toContain('href="#/c/h5/vote-v2-2/option-1"');
    expect(html).toContain('>3560</strong>');
    expect(html).toContain('浏览量');
    expect(html).toContain('>投票<');
    expect(html).not.toContain('aria-label="分享"');
    expect(html).toContain('data-cols="2"');
  });

  it('renders the one-column mock campaign on C-end home', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2Home id={8} />
      </CEndToastProvider>,
    );
    expect(html).toContain('一线匠心人物');
    expect(html).toContain('data-cols="1"');
    expect(html).toContain('刘师傅');
    expect(html).toContain('何姐');
    expect(html).toContain('孙师傅');
    expect(html).toContain('href="#/c/h5/vote-v2-8/option-21"');
  });

  it('keeps cafeteria mock at three mobile columns', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2Home id={4} />
      </CEndToastProvider>,
    );
    expect(html).toContain('食堂本周菜品');
    expect(html).toContain('data-cols="3"');
    expect(html).toContain('红烧排骨');
    expect(html).toContain('黄焖鸡米饭');
    expect(html).toContain('红油抄手');
  });

  it('renders admin store settings after upsert', () => {
    upsertVoteV2(
      defaultVoteV2Campaign({
        ...getVoteV2(2)!,
        name: '后台改名安全之星',
        intro: '<p>后台改过的介绍</p>',
        themeColor: '#112233',
        pageDisplay: {
          ...getVoteV2(2)!.pageDisplay,
          intro: true,
          voteButton: true,
        },
      }),
    );
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2Home id={2} />
      </CEndToastProvider>,
    );
    expect(html).toContain('后台改名安全之星');
    expect(html).toContain('后台改过的介绍');
    expect(html).toContain('#112233');
    expect(html).toContain('张工');
  });
});
