import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetForumStoreForTests } from '../../../forum/model/forumStore';
import { PcForumBoard } from './PcForumBoard';
import { PcForumTopic } from './PcForumTopic';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('forum PC', () => {
  it('opens the first board from the portal route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="forum" />);
    expect(html).toContain('c-pc-shell is-forum');
    expect(html).toContain('二手论坛');
    expect(html).not.toContain('c-h5-shell');
    const hero = html.slice(html.indexOf('c-forum-pc-hero'), html.indexOf('c-forum-pc-card'));
    expect(hero).toContain('>二手论坛<span');
    expect(hero).not.toContain('>建议论坛<');
  });

  it('opens my posts from a dedicated portal route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="forum-mine" />);
    expect(html).toContain('c-pc-shell is-forum');
    expect(html).toContain('>我的帖子<');
    expect(html).toContain('人体工学椅');
    expect(html).toContain('低糖早餐');
    expect(html).not.toContain('显示器转让');
    expect(html).toContain('href="#/c/pc/forum-topic/1"');
    expect(html).toContain('aria-label="更多操作"');
    expect(html).not.toContain('c-forum-pc-hero');
    expect(html).not.toContain('立即发布');
    expect(html).not.toContain('>置顶<');
    expect(html).not.toContain('c-forum-user');
    expect(html).not.toContain('需要你回复');
    expect(html).toContain('c-forum-mine-post');
    expect(html.indexOf('人体工学椅')).toBeLessThan(html.indexOf('低糖早餐'));
    expect(html.indexOf('低糖早餐')).toBeLessThan(html.indexOf('晚班通勤'));
  });

  it('renders a wide board with search, posts and publish', () => {
    const html = renderToStaticMarkup(<PcForumBoard id={1} />);
    expect(html).toContain('c-pc-shell is-forum');
    expect(html).toContain('c-forum-pc-layout is-board');
    expect(html).toContain('c-forum-pc-side');
    expect(html.indexOf('c-forum-pc-feed')).toBeLessThan(html.indexOf('c-forum-pc-hero'));
    expect(html.indexOf('c-forum-pc-hero')).toBeLessThan(html.indexOf('c-forum-pc-card'));
    expect(html.indexOf('c-forum-pc-feed')).toBeLessThan(html.indexOf('c-forum-pc-side'));
    expect(html.indexOf('c-forum-pc-card')).toBeLessThan(html.indexOf('c-forum-pc-side'));
    expect(html).not.toContain('版块简介');
    expect(html).toContain('c-forum-pc-hero-desc');
    expect(html).toContain('园区内可自提');
    expect(html.indexOf('c-forum-pc-hero')).toBeLessThan(html.indexOf('园区内可自提'));
    expect(html.indexOf('园区内可自提')).toBeLessThan(html.indexOf('aria-label="搜索帖子"'));
    expect(html).toContain('aria-label="搜索帖子"');
    expect(html).toContain('立即发布');
    expect(html).not.toContain('c-pc-header-actions');
    expect(html).not.toContain('返回预览');
    const hero = html.slice(html.indexOf('c-forum-pc-hero'), html.indexOf('c-forum-pc-card'));
    expect(hero).not.toContain('立即发布');
    expect(hero).toContain('c-forum-pc-hero-copy');
    expect(hero).toMatch(/>二手论坛<span[^>]*>\d+帖子<\/span><\/h2>/);
    expect(hero).not.toContain('评论');
    expect(html.indexOf('aria-label="搜索帖子"')).toBeLessThan(html.indexOf('立即发布'));
    expect(html).toContain('九成新人体工学椅转让，可自提');
    expect(html).toContain('href="#/c/pc/forum-topic/1"');
    expect(html).toContain('需要你回复');
    expect(html).toContain('c-forum-need-reply-banner');
    expect(html).toContain('闲置27英寸显示器转让');
    expect(html).toContain('【匿名用户】');
    expect(html).toContain('c-forum-stats is-list');
    expect(html).toContain('aria-label="更多操作"');
    expect(html).toContain('aria-label="删除帖子"');
    expect(html).toContain('aria-label="编辑帖子"');
    expect(html).toContain('class="c-forum-post-excerpt"');
    expect(html).toContain('椅子使用约一年');
    expect(html.indexOf('class="c-forum-thumbs"')).toBeLessThan(html.indexOf('class="c-forum-post-excerpt"'));
    expect(html).toContain('+2张');
    expect(html).toContain('>管理员<');
    expect(html).not.toContain('>版主<');
    expect(html).toContain('王涛');
    expect(html).toContain('唐宇');
    expect(html).toContain('社区运营');
    expect(html).toContain('class="c-avatar c-avatar-sm"');
    expect(html).toContain('c-forum-pc-side-block');
    expect(html).not.toContain('c-forum-pc-side-mine');
    expect(html).not.toContain('发帖须知');
    expect(html).not.toContain('发帖设置');
    expect(html).toContain('c-forum-pc-side-rank');
    expect(html).toContain('>热门帖子<');
    expect(html).not.toContain('href="#/c/pc/forum-mine"');
    expect(html).toContain('>其他论坛<');
    const side = html.slice(html.indexOf('c-forum-pc-side'));
    expect(side).not.toContain('c-forum-pc-hero');
    expect(side).toContain('c-forum-pc-qualify');
    expect(side).toContain('>周敏<');
    expect(side).toContain('市场品牌部');
    expect(side).not.toContain('允许匿名');
    expect(side).not.toContain('园区自提');
    expect(side).not.toContain('今日新帖');
    expect(side).toContain('立即发布');
    expect(side).toContain('c-forum-pc-publish');
    expect(side.indexOf('c-forum-pc-qualify')).toBeLessThan(side.indexOf('立即发布'));
    expect(side).toContain('王涛');
  });

  it('keeps the PC board cover above the list and extras on the right', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toMatch(/\.c-forum-pc-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) 280px/s);
    expect(css).not.toMatch(
      /\.c-forum-pc-layout\.is-board[^{]*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    );
    expect(css).not.toMatch(
      /\.c-forum-pc-layout\.is-topic,\s*\.c-forum-pc-layout\.is-mine\s*\{[^}]*minmax\(0,\s*1fr\)/s,
    );
    expect(css).toMatch(/\.c-forum-pc-qualify-user\s*\{[^}]*grid-template-columns:\s*56px minmax\(0,\s*1fr\)/s);
    expect(css).toMatch(/\.c-forum-pc-qualify-user strong\s*\{[^}]*font-size:\s*16px/s);
    expect(css).toMatch(/\.c-forum-pc-qualify-user \.c-avatar\s*\{[^}]*width:\s*56px/s);
    expect(css).toMatch(/\.c-forum-pc-layout\.is-board \.c-forum-thumbs\s*\{[^}]*repeat\(5/s);
  });

  it('renders topic detail with inline composer', () => {
    const html = renderToStaticMarkup(<PcForumTopic id={1} />);
    expect(html).toContain('c-pc-shell is-forum');
    expect(html).toContain('九成新人体工学椅转让，可自提');
    expect(html).toContain('工作日下班后在园区北门自提');
    expect(html).toContain('aria-label="写评论"');
    expect(html).toContain('c-forum-pc-composer is-collapsed');
    expect(html).toContain('aria-label="删除帖子"');
    expect(html).not.toContain('c-pc-header-actions');
    expect(html.indexOf('c-forum-stats is-pc')).toBeLessThan(html.indexOf('aria-label="编辑帖子"'));
    expect(html.indexOf('aria-label="编辑帖子"')).toBeLessThan(html.indexOf('c-forum-topic-comments'));
    expect(html).toContain('c-forum-pc-composer-box');
    expect(html).toContain('c-forum-pc-composer-avatar');
    expect(html).toContain('参与讨论');
    expect(html).not.toContain('>发布<');
    expect(html).not.toContain('aria-label="表情"');
    expect(html).not.toContain('c-forum-pc-composer-thumbs');
    expect(html).not.toContain('aria-label="提及"');
    expect(html).not.toContain('aria-label="话题"');
    expect(html).not.toContain('aria-label="定时"');
    expect(html).toContain('c-forum-stats is-pc');
    const stats = html.slice(html.indexOf('c-forum-stats is-pc'), html.indexOf('c-forum-topic-comments'));
    expect(stats.indexOf('aria-label="点赞"')).toBeLessThan(stats.indexOf('aria-label="收藏"'));
    expect(stats.indexOf('aria-label="收藏"')).toBeLessThan(stats.indexOf('aria-label="评论 '));
    expect(stats.indexOf('aria-label="评论 ')).toBeLessThan(stats.indexOf('aria-label="浏览 '));
    expect(stats).toContain('aria-label="更多操作"');
    expect(stats.indexOf('aria-label="浏览 ')).toBeLessThan(stats.indexOf('aria-label="更多操作"'));
    expect(html).not.toContain('class="c-forum-topic-dock"');
    expect(html).toContain('href="#/c/pc/forum/1"');
    expect(html).toContain('aria-label="回复排序"');
    expect(html.indexOf('aria-label="回复排序"')).toBeLessThan(html.indexOf('c-forum-pc-composer'));
    expect(html).toContain('c-forum-pc-layout is-topic');
    expect(html).toContain('c-forum-pc-side');
    expect(html).toContain('c-forum-pc-qualify');
    expect(html).toContain('立即发布');
    expect(html).toContain('>管理员<');
    expect(html).toContain('>热门帖子<');
    expect(html).toContain('>其他论坛<');
    expect(html.indexOf('c-forum-topic')).toBeLessThan(html.indexOf('c-forum-pc-side'));
    expect(html).toContain('c-forum-topic-photos is-pc-3');
    expect(html.indexOf('c-forum-pc-composer is-collapsed')).toBeLessThan(html.indexOf('c-forum-comment-thread'));
  });

  it('opens a reply composer under the target comment, not at the top', () => {
    const html = renderToStaticMarkup(
      <PcForumTopic id={1} composeReply={{ commentId: 1, name: '周敏' }} />,
    );
    expect(html).toContain('c-forum-pc-composer is-collapsed');
    expect(html).toContain('c-forum-pc-composer is-inline');
    expect(html.indexOf('还在吗？工作日晚上七点后可以去北门看一下吗？')).toBeLessThan(html.indexOf('c-forum-pc-composer is-inline'));
    expect(html.indexOf('c-forum-pc-composer is-collapsed')).toBeLessThan(html.indexOf('c-forum-pc-composer is-inline'));
    expect(html.indexOf('c-forum-pc-composer is-inline')).toBeLessThan(html.indexOf('在的，今晚七点半方便'));
    const inline = html.slice(html.indexOf('c-forum-pc-composer is-inline'));
    expect(inline).toContain('placeholder="回复 周敏"');
    expect(inline).toContain('>发布<');
    expect(inline).not.toContain('c-forum-topic-dock-hint');
    expect(inline).not.toContain('>取消<');
  });

  it('masks anonymous authors on the display topic', () => {
    const html = renderToStaticMarkup(<PcForumTopic id={4} />);
    const article = html.slice(html.indexOf('c-forum-topic'), html.indexOf('c-forum-pc-side'));
    expect(article).toContain('【匿名用户】');
    expect(article).toContain('aria-label="匿名评论"');
    expect(article).toMatch(/aria-label="回复 【匿名用户】\d{4}"/);
    expect(article).not.toContain('>方圆<');
    expect(article).not.toContain('>唐宇<');
  });
});
