import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { addDecoBlock } from '../../../shared/decoration/decoTypes';
import { createVoteDecoBlock, defaultVoteDecoPageFor } from '../model/voteV2Decoration';
import { getVoteV2Decoration, resetVoteV2Decoration, saveVoteV2Decoration } from '../model/voteV2DecorationStore';
import { VoteV2DecorationPage } from './VoteV2DecorationPage';

afterEach(() => {
  resetVoteV2Decoration();
});

describe('VoteV2DecorationPage', () => {
  it('defaults mobile 投票 count to 99', () => {
    expect(defaultVoteDecoPageFor('mobile').blocks.find((item) => item.type === 'vote')?.latestCount).toBe(99);
    expect(defaultVoteDecoPageFor('pc').blocks.find((item) => item.type === 'vote')?.latestCount).toBe(99);
  });
  it('shows mobile library with search and vote', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2DecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('投票装修');
    expect(html).toContain('仅方便演示使用，实际无此装修页面，统一在H5/PC装修中实现');
    expect(html).toContain('移动端');
    expect(html).toContain('PC端');
    expect(html).not.toContain('移动端版面设置');
    expect(html).toContain('data-palette="search"');
    expect(html).toContain('data-palette="banner"');
    expect(html).toContain('data-palette="vote"');
    expect(html).not.toContain('data-block-type="banner"');
    expect(html).toContain('data-block-type="vote"');
    expect(html).toContain('aria-label="活动状态"');
    expect(html).toContain('进行中');
    expect(html).not.toContain('data-block-type="search"');
    expect(html).not.toContain('悬浮按钮');
    expect(html).toContain('aria-label="保存"');
    expect(html.indexOf('页面设置')).toBeLessThan(html.indexOf('aria-label="保存"'));
    expect(html).toContain('一行两列');
    expect(html).toContain('横向滑动');
    expect(html).toContain('data-style="two-col"');
    expect(html).toContain('data-style="scroll"');
    expect(html).toContain('字段设置');
    expect(html).toContain('投票时间');
    expect(html).toContain('data-field="showTitle"');
    expect(html).toContain('data-field="showTime"');
    expect(html).toContain('data-field="showStatus"');
    expect(html.indexOf('data-field="showStatus"')).toBeLessThan(html.indexOf('data-field="showTime"'));
    expect(html).toContain('activity-deco-line is-tag');
    expect(html).not.toContain('activity-deco-status-chip');
  });

  it('shows PC header with 我的记录', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2DecorationPage surface="pc" />
      </App>,
    );
    expect(html).toContain('投票装修');
    expect(html).toContain('我的记录');
    expect(html).toContain('发现投票');
  });

  it('uses PC 一行多列 with column picker for vote cards', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2DecorationPage surface="pc" />
      </App>,
    );
    expect(html).toContain('一行多列');
    expect(html).not.toContain('一行多列（大图）');
    expect(html).not.toContain('一行两列');
    expect(html).not.toContain('横向滑动');
    expect(html).toContain('aria-label="列数"');
  });

  it('can add a search block to the canvas', () => {
    saveVoteV2Decoration('mobile', addDecoBlock(getVoteV2Decoration('mobile'), createVoteDecoBlock('search', 'deco-search')));
    const html = renderToStaticMarkup(
      <App>
        <VoteV2DecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('data-block-type="search"');
    expect(html).toContain('搜索投票名称');
  });

  it('configures 轮播图 inspector and flush canvas', () => {
    saveVoteV2Decoration('mobile', {
      pageTitle: '投票',
      blocks: [createVoteDecoBlock('banner', 'deco-banner')],
    });
    const html = renderToStaticMarkup(
      <App>
        <VoteV2DecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('轮播图');
    expect(html).toContain('组件类型');
    expect(html).toContain('样式设置');
    expect(html).toContain('内容设置');
    expect(html).toContain('上层图片');
    expect(html).toContain('activity-deco-block is-selected is-flush');
    expect(html).toContain('activity-deco-banner is-split is-immersive');
  });
});
