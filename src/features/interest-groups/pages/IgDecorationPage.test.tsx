import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { patchDecoBlock } from '../../../shared/decoration/decoTypes';
import { createIgDecoBlock, defaultIgDecoPageFor, igDecoStylesForType } from '../model/igDecoration';
import { getIgDecoration, resetIgDecoration, saveIgDecoration } from '../model/igDecorationStore';
import { IgDecorationPage } from './IgDecorationPage';

afterEach(() => {
  resetIgDecoration();
});

describe('IgDecorationPage', () => {
  it('defaults mobile 活动/精彩瞬间/兴趣圈 counts', () => {
    const mobile = defaultIgDecoPageFor('mobile');
    expect(mobile.blocks.find((item) => item.type === 'activity')?.latestCount).toBe(3);
    expect(mobile.blocks.find((item) => item.type === 'moments')?.latestCount).toBe(5);
    expect(mobile.blocks.find((item) => item.type === 'groups')?.latestCount).toBe(5);
    const pc = defaultIgDecoPageFor('pc');
    expect(pc.blocks.find((item) => item.type === 'activity')?.latestCount).toBe(6);
    expect(pc.blocks.find((item) => item.type === 'moments')?.latestCount).toBe(4);
    expect(pc.blocks.find((item) => item.type === 'groups')?.latestCount).toBe(3);
  });
  it('shows mobile library for search, banner, AI assistant, groups, activity and moments', () => {
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('兴趣圈装修');
    expect(html).toContain('仅方便演示使用，实际无此装修页面，统一在H5/PC装修中实现');
    expect(html).not.toContain('移动端版面设置');
    expect(html).toContain('组件库');
    expect(html).toContain('data-palette="search"');
    expect(html).toContain('data-palette="ai"');
    expect(html).toContain('data-palette="banner"');
    expect(html).not.toContain('data-palette="shortcuts"');
    expect(html).not.toContain('data-block-type="shortcuts"');
    expect(html).toContain('data-palette="groups"');
    expect(html).toContain('data-palette="activity"');
    expect(html).toContain('data-palette="moments"');
    expect(html).not.toContain('data-block-type="banner"');
    expect(html.indexOf('data-block-type="search"')).toBeLessThan(html.indexOf('data-block-type="groups"'));
    expect(html).not.toContain('data-block-type="ai"');
    expect(html).not.toContain('和AI助手聊聊，找到适合你的活动');
    expect(html).toContain('兴趣圈');
    expect(html).toContain('热门兴趣圈');
    expect(html).toContain('aria-label="活动排序"');
    expect(html).toContain('推荐');
    expect(html).not.toContain('悬浮按钮');
    expect(html).toContain('aria-label="保存"');
    expect(html.indexOf('页面设置')).toBeLessThan(html.indexOf('aria-label="保存"'));
    expect(html).toContain('字段设置');
    expect(html).toContain('报名按钮');
    expect(html).toContain('data-field="showPinned"');
    expect(html).toContain('Tab标签页');
    expect(html).toContain('data-field="showActivityTabs"');
    expect(html).toContain('data-field="showTabRecommend"');
    expect(html).toContain('data-field="showTabLatest"');
    expect(html).toContain('data-field="showTabHot"');
    expect(html).toContain('最热');
    expect(html.indexOf('Tab标签页')).toBeLessThan(html.indexOf('字段设置'));
  });

  it('shows a wider PC canvas', () => {
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="pc" />
      </App>,
    );
    expect(html).toContain('兴趣圈装修');
    expect(html).toContain('activity-deco-canvas is-pc');
    expect(html).toContain('我的兴趣圈');
  });

  it('uses PC 一行多列 with column picker for activity and moments', () => {
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="pc" />
      </App>,
    );
    expect(html).toContain('一行多列');
    expect(html).not.toContain('一行多列（大图）');
    expect(html).toContain('aria-label="列数"');
    const groups = html.slice(html.indexOf('data-block-type="groups"'), html.indexOf('data-block-type="activity"'));
    expect(groups).toContain('activity-deco-cols');
    expect(groups).not.toContain('activity-deco-rail');
    const activity = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
    expect(activity).not.toContain('一行多列（小图）');
    expect(igDecoStylesForType('groups', 'pc')).toEqual(['large-image', 'left-image', 'left-text']);
    expect(igDecoStylesForType('activity', 'pc')).toEqual(['large-image', 'left-image', 'left-text']);
    expect(igDecoStylesForType('groups', 'mobile')).toEqual(['large-image', 'two-col', 'left-image', 'left-text', 'scroll']);
    expect(igDecoStylesForType('activity', 'mobile')).toEqual(['large-image', 'two-col', 'left-image', 'left-text', 'scroll']);
  });

  it('switches activity list style in inspector', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', { listStyle: 'left-text' }),
    );
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    const activity = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
    expect(activity).toContain('activity-deco-row is-flip');
  });

  it('offers 大图模式 for the groups block', () => {
    saveIgDecoration('mobile', {
      pageTitle: '兴趣圈',
      blocks: [createIgDecoBlock('groups', 'deco-groups')],
    });
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('data-style="large-image"');
    expect(html).toContain('大图模式');
    expect(html).toContain('data-style="scroll"');
    expect(html).toContain('data-style="two-col"');
    expect(html).toContain('一行两列');
    expect(html).toContain('横向滑动');
    expect(html).toContain('data-style="left-image"');
    expect(html).toContain('data-style="left-text"');
  });

  it('previews groups 大图模式 as stacked covers', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'large-image' }),
    );
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    const groups = html.slice(html.indexOf('data-block-type="groups"'), html.indexOf('data-block-type="activity"'));
    expect(groups).toContain('activity-deco-swatch is-wide');
  });

  it('configures 轮播图 inspector and flush canvas', () => {
    saveIgDecoration('mobile', {
      pageTitle: '兴趣圈',
      blocks: [createIgDecoBlock('banner', 'deco-banner')],
    });
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
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

  it('offers 标题 and 状态 field toggles for moments', () => {
    saveIgDecoration('mobile', {
      pageTitle: '兴趣圈',
      blocks: [createIgDecoBlock('moments', 'deco-moments')],
    });
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('字段设置');
    expect(html).toContain('data-field="showTitle"');
    expect(html).toContain('data-field="showStatusTag"');
    expect(html).not.toContain('data-field="showSignupButton"');
    expect(html).not.toContain('Tab标签页');
  });

  it('offers 兴趣圈 card field toggles on H5 and PC', () => {
    saveIgDecoration('mobile', {
      pageTitle: '兴趣圈',
      blocks: [createIgDecoBlock('groups', 'deco-groups')],
    });
    const mobile = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    expect(mobile).toContain('字段设置');
    expect(mobile).toContain('data-field="showTitle"');
    expect(mobile).toContain('data-field="showCategoryTag"');
    expect(mobile).toContain('data-field="showIntro"');
    expect(mobile).toContain('data-field="showMembers"');
    expect(mobile).toContain('data-field="showJoinButton"');
    expect(mobile).toContain('入组按钮');
    expect(mobile).not.toContain('data-field="showSignupButton"');
    expect(mobile.indexOf('标题')).toBeLessThan(mobile.indexOf('分类'));
    expect(mobile.indexOf('分类')).toBeLessThan(mobile.indexOf('描述'));
    expect(mobile.indexOf('描述')).toBeLessThan(mobile.indexOf('成员'));
    expect(mobile.indexOf('成员')).toBeLessThan(mobile.indexOf('入组按钮'));

    saveIgDecoration('pc', {
      pageTitle: '兴趣圈',
      blocks: [createIgDecoBlock('groups', 'deco-groups')],
    });
    const pc = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="pc" />
      </App>,
    );
    expect(pc).toContain('data-field="showJoinButton"');
    expect(pc).toContain('入组按钮');
  });

  it('hides Tab标签页 on PC activity inspector', () => {
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="pc" />
      </App>,
    );
    expect(html).not.toContain('Tab标签页');
    expect(html).not.toContain('data-field="showActivityTabs"');
  });

  it('hides canvas activity tabs when Tab标签页 is off', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', { showActivityTabs: false }),
    );
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    const activity = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
    expect(activity).not.toContain('aria-label="活动排序"');
  });

  it('previews only enabled activity tabs', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', {
        showTabRecommend: false,
        showTabLatest: true,
        showTabHot: true,
      }),
    );
    const html = renderToStaticMarkup(
      <App>
        <IgDecorationPage surface="mobile" />
      </App>,
    );
    const activity = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
    expect(activity).toContain('aria-label="活动排序"');
    expect(activity).not.toContain('>推荐<');
    expect(activity).toContain('最新');
    expect(activity).toContain('热门');
  });
});
