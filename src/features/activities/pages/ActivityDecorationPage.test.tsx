import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { initialActivities } from '../model/activity';
import { createDecoBlock, createDecoSlide, patchDecoBlock } from '../model/activityDecoration';
import { getActivityDecoration, resetActivityDecoration, saveActivityDecoration } from '../model/activityDecorationStore';
import { ActivityBannerLinkPickerBody } from './ActivityDecoBannerPanel';
import { ActivityDecorationPage } from './ActivityDecorationPage';

afterEach(() => {
  resetActivityDecoration();
});

describe('ActivityDecorationPage', () => {
  it('shows mobile library with search, activity and moments', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('活动装修');
    expect(html).toContain('仅方便演示使用，实际无此装修页面，统一在H5/PC装修中实现');
    expect(html).not.toContain('移动端版面设置');
    expect(html).toContain('组件库');
    expect(html).not.toContain('基础组件');
    expect(html).not.toContain('用户组件');
    expect(html).not.toContain('应用组件');
    expect(html).toContain('搜索');
    expect(html).not.toContain('悬浮按钮');
    expect(html).toContain('页面设置');
    expect(html).toContain('data-palette="search"');
    expect(html).toContain('data-palette="banner"');
    expect(html).toContain('data-palette="activity"');
    expect(html).toContain('data-palette="moments"');
    expect(html).toContain('员工活动');
    expect(html).toContain('data-block-type="search"');
    expect(html).not.toContain('data-block-type="banner"');
    expect(html).toContain('data-block-type="activity"');
    expect(html.indexOf('data-block-type="search"')).toBeLessThan(html.indexOf('data-block-type="activity"'));
    expect(html).toContain('aria-label="活动分类"');
    expect(html.indexOf('data-block-type="activity"')).toBeLessThan(html.indexOf('aria-label="活动分类"'));
    expect(html.indexOf('activity-deco-head')).toBeLessThan(html.indexOf('aria-label="活动分类"'));
    expect(html.indexOf('aria-label="活动分类"')).toBeLessThan(html.indexOf('查看全部'));
    expect(html).toContain('查看全部');
    expect(html).not.toContain('查看更多');
    expect(html).toContain('data-block-type="moments"');
    expect(html).toContain('标题栏');
    expect(html).toContain('展示样式');
    expect(html).toContain('aria-label="保存"');
    expect(html.indexOf('页面设置')).toBeLessThan(html.indexOf('aria-label="保存"'));
    expect(html).toContain('大图模式');
    expect(html).toContain('一行两列');
    expect(html).toContain('左图右文');
    expect(html).toContain('左文右图');
    expect(html).toContain('横向滑动');
    expect(html).toContain('个活动');
    expect(html).not.toContain('个瞬间');
    expect(html).not.toContain('选择活动');
    expect(html).not.toContain('自定义');
    expect(html).not.toContain('阅读量');
    expect(html).not.toContain('互动数');
    expect(html).not.toContain('创建时间');
    expect(html).toContain('字段设置');
    expect(html).toContain('报名按钮');
    expect(html).toContain('data-field="showPinned"');
    expect(html).toContain('data-field="showSignupButton"');
    expect(html).toContain('data-style="two-col"');
    expect(html).toContain('data-style="scroll"');
    expect(html).toContain('activity-deco-rail');
    const moments = html.slice(html.indexOf('data-block-type="moments"'));
    expect(moments).not.toContain('activity-deco-meta');
    expect(moments).not.toContain('activity-deco-line');
    const activity = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
    expect(activity).toContain('activity-deco-meta');
    expect(html).not.toContain('activity-deco-placeholder');
    expect(html).not.toContain('activity-deco-progress');
    expect(html).not.toContain('activity-deco-mini-btn');
    expect(html).not.toContain('♡ 12');
    expect(html).not.toMatch(/activity-deco-swatch[\s\S]*?<img /);
    expect(html).not.toContain('activity-deco-cover-tags');
    expect(html).not.toContain('activity-deco-meta-tags');
    expect(activity).not.toContain('报名中');
    expect(activity).not.toContain('置顶');
  });

  it('keeps wireframe covers without tags for every list style', () => {
    for (const style of ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'] as const) {
      saveActivityDecoration(
        'mobile',
        patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: style }),
      );
      const html = renderToStaticMarkup(
        <App>
          <ActivityDecorationPage surface="mobile" />
        </App>,
      );
      const block = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
      expect(block, style).not.toContain('<img');
      expect(block, style).not.toContain('activity-deco-cover-tags');
      expect(block, style).not.toContain('activity-deco-meta-tags');
      expect(block, style).not.toContain('报名中');
      expect(block, style).not.toContain('置顶');
      expect(block, style).not.toContain('线上');
    }
  });

  it('shows a wider PC canvas', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="pc" />
      </App>,
    );
    expect(html).toContain('活动装修');
    expect(html).toContain('activity-deco-canvas is-pc');
    expect(html).toContain('组件库');
    expect(html).toContain('data-palette="search"');
    expect(html).not.toContain('data-block-type="banner"');
  });

  it('previews PC chrome and three-column large-image layout', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="pc" />
      </App>,
    );
    expect(html).toContain('activity-deco-pc-header');
    expect(html).toContain('activity-deco-pc-mark');
    expect(html).not.toContain('>我的活动</span>');
    const search = html.slice(html.indexOf('data-block-type="search"'), html.indexOf('data-block-type="activity"'));
    expect(search).toContain('activity-deco-search is-pc');
    expect(search).toContain('activity-deco-mine');
    expect(html).not.toContain('activity-deco-statusbar');
    expect(html).not.toContain('9:41');
    expect(html).not.toContain('activity-deco-back');
    const activity = html.slice(html.indexOf('data-block-type="activity"'), html.indexOf('data-block-type="moments"'));
    expect(activity).toContain('data-cols="3"');
    expect(activity).toContain('is-cols-3');
    expect(activity).not.toContain('activity-deco-stack');
    expect(html).toContain('activity-deco-glyph is-large-image is-pc');
    expect(html).toContain('一行多列');
    expect(html).not.toContain('一行多列（大图）');
    expect(html).not.toContain('一行多列（小图）');
    expect(html).toContain('aria-label="列数"');
    expect(html).not.toContain('大图模式');
    expect(html).not.toContain('一行两列');
  });

  it('uses PC moments styles without two-col or swipe', () => {
    saveActivityDecoration('pc', getActivityDecoration('pc'));
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="pc" />
      </App>,
    );
    const moments = html.slice(html.indexOf('data-block-type="moments"'));
    expect(moments).not.toContain('activity-deco-rail');
    expect(moments).not.toContain('activity-deco-grid-sm');
    expect(moments).toContain('activity-deco-cols');
    expect(moments).toContain('data-cols="4"');
  });

  it('keeps moment side-card text lines and lays them in two columns on PC', () => {
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-moments', { listStyle: 'left-image' }),
    );
    const mobile = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="mobile" />
      </App>,
    );
    const mobileMoments = mobile.slice(mobile.indexOf('data-block-type="moments"'));
    expect(mobileMoments).toContain('activity-deco-row');
    expect(mobileMoments).toContain('activity-deco-meta');
    expect(mobileMoments).toContain('activity-deco-line');
    expect(mobileMoments).not.toContain('activity-deco-grid2');

    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-moments', { listStyle: 'left-text', columnCount: 2 }),
    );
    const pc = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="pc" />
      </App>,
    );
    const pcMoments = pc.slice(pc.indexOf('data-block-type="moments"'));
    expect(pcMoments).toContain('activity-deco-cols');
    expect(pcMoments).toContain('data-cols="2"');
    expect(pcMoments).toContain('activity-deco-row is-flip');
    expect(pcMoments).toContain('activity-deco-meta');
    expect(pcMoments).toContain('activity-deco-line');
    const pcActivity = pc.slice(pc.indexOf('data-block-type="activity"'), pc.indexOf('data-block-type="moments"'));
    expect(pcActivity).toContain('data-cols="3"');
    expect(pcActivity).toContain('activity-deco-cols');
  });

  it('configures 轮播图 with screenshot fields and canvas preview', () => {
    saveActivityDecoration('mobile', {
      pageTitle: '员工活动',
      blocks: [
        createDecoBlock('banner', 'deco-banner'),
      ],
    });
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('轮播图');
    expect(html).toContain('组件类型');
    expect(html).toContain('使用模板');
    expect(html).toContain('自定义');
    expect(html).toContain('样式设置');
    expect(html).toContain('内容设置');
    expect(html).toContain('拖动左上角的小圆点可对其排序');
    expect(html).toContain('高度');
    expect(html).toContain('px');
    expect(html).toContain('指示器');
    expect(html).toContain('小圆点');
    expect(html).toContain('数字');
    expect(html).toContain('沉浸式');
    expect(html).toContain('是否轮播');
    expect(html).toContain('播放间隔');
    expect(html).toContain('单位：秒');
    expect(html).toContain('上层图片');
    expect(html).toContain('轮播主图');
    expect(html).toContain('链接');
    expect(html).toContain('选择');
    expect(html).toContain('添加轮播项');
    expect(html).toContain('data-banner-style="split"');
    expect(html).toContain('data-block-type="banner"');
    expect(html).toContain('activity-deco-block is-selected is-flush');
    expect(html).toContain('activity-deco-banner is-split is-immersive');
    expect(html).toContain('src="/activities/share.jpg"');
  });

  it('stacks overlay on the main image for the third banner style', () => {
    saveActivityDecoration('mobile', {
      pageTitle: '员工活动',
      blocks: [
        {
          ...createDecoBlock('banner', 'deco-banner'),
          bannerStyle: 'split',
          slides: [
            createDecoSlide({
              overlayUrl: '/activities/open-day.jpg',
              imageUrl: '/activities/share.jpg',
            }),
          ],
        },
      ],
    });
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="mobile" />
      </App>,
    );
    const banner = html.slice(html.indexOf('activity-deco-banner is-split'), html.indexOf('activity-deco-banner-dots'));
    expect(banner).toContain('data-stack="overlay"');
    expect(banner).toContain('activity-deco-banner-overlay');
    expect(banner).toContain('src="/activities/share.jpg"');
    expect(banner).toContain('src="/activities/open-day.jpg"');
    expect(banner).not.toContain('grid-template-columns');
  });

  it('hides overlay image fields for bleed and inset banner styles', () => {
    saveActivityDecoration('mobile', {
      pageTitle: '员工活动',
      blocks: [
        {
          ...createDecoBlock('banner', 'deco-banner'),
          bannerStyle: 'bleed',
          slides: [
            createDecoSlide({
              overlayUrl: '/activities/share.jpg',
              imageUrl: '/activities/open-day.jpg',
            }),
          ],
        },
      ],
    });
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('轮播主图');
    expect(html).not.toContain('上层图片');
    expect(html).not.toContain('activity-deco-banner-overlay');
  });

  it('shows activity list table in the banner link picker', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityBannerLinkPickerBody value="" onPick={() => undefined} />
      </App>,
    );
    expect(html).toContain('活动标题');
    expect(html).toContain('分类');
    expect(html).toContain('活动时间');
    expect(html).toContain('状态');
    expect(html).toContain('查询');
    expect(html).toContain('重置');
    expect(html).toContain('共');
    expect(html).toContain(initialActivities[0].title);
    expect(html).toContain(initialActivities[0].category);
  });

  it('offers 标题 and 状态 field toggles for moments', () => {
    saveActivityDecoration('mobile', {
      pageTitle: '员工活动',
      blocks: [createDecoBlock('moments', 'deco-moments')],
    });
    const html = renderToStaticMarkup(
      <App>
        <ActivityDecorationPage surface="mobile" />
      </App>,
    );
    expect(html).toContain('字段设置');
    expect(html).toContain('data-field="showTitle"');
    expect(html).toContain('data-field="showStatusTag"');
    expect(html).not.toContain('data-field="showSignupButton"');
  });
});
