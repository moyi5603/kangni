import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { restoreRelatedComments } from '../../../activities/model/related';
import { submitActivityComment } from '../model/activityComments';
import { resetEngagement } from '../model/engagementStore';
import { H5ActivityDetail } from './H5ActivityDetail';

describe('H5 activity detail engage', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('puts social actions left of signup CTA and shows comment tabs', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const bar = html.slice(html.indexOf('c-h5-cta-bar'));
    const like = bar.indexOf('aria-label="点赞"');
    const fav = bar.indexOf('aria-label="收藏"');
    const comment = bar.indexOf('aria-label="评论"');
    const cta = bar.indexOf('class="c-cta"');

    expect(like).toBeGreaterThan(-1);
    expect(fav).toBeGreaterThan(like);
    expect(comment).toBeGreaterThan(fav);
    expect(bar).toContain('aria-label="分享"');
    expect(cta).toBeGreaterThan(comment);
    expect(html).toContain('id="activity-social"');
    expect(html).toContain('评论 26');
    expect(html).toContain('精彩瞬间 5');
    expect(html).toContain('纪念品柜台要排队。');
    expect(html).not.toContain('开场致辞很有感染力');
    expect(html).toContain('活动评分');
    expect(html).toContain('4.3');
    const cover = html.slice(html.indexOf('c-detail-cover'), html.indexOf('c-h5-detail'));
    expect(cover).toContain('c-cover-badges');
    expect(cover).toContain('c-cover-title');
    expect(cover).toContain('员工开放日');
    expect(cover.indexOf('c-cover-badges')).toBeLessThan(cover.indexOf('c-cover-title'));
    expect(cover.indexOf('已结束')).toBeLessThan(cover.indexOf('单次活动'));
    expect(cover.indexOf('单次活动')).toBeLessThan(cover.indexOf('文化'));
    expect(cover).toContain('c-pill is-category');
    expect(cover).toContain('c-pill is-format');
    expect(html).not.toContain('分类：文化');
    expect(html).not.toContain('c-detail-heading');
    expect(html.indexOf('h5-activity-intro')).toBeLessThan(html.indexOf('c-activity-rating'));
    expect(html.indexOf('c-activity-rating')).toBeLessThan(html.indexOf('id="activity-social"'));
  });

  it('shows category, times, quota and occupied seats on the info card', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={2} />);
    const card = html.slice(html.indexOf('c-detail-info-card'));
    expect(card).not.toContain('分类：培训');
    const cover = html.slice(html.indexOf('c-detail-cover'), html.indexOf('c-h5-detail'));
    expect(cover.indexOf('进行中')).toBeLessThan(cover.indexOf('置顶'));
    expect(cover.indexOf('置顶')).toBeLessThan(cover.indexOf('系列活动'));
    expect(cover.indexOf('系列活动')).toBeLessThan(cover.indexOf('培训'));
    expect(cover).toContain('c-cover-title');
    expect(cover).toContain('c-pill is-category');
    expect(cover).toContain('c-pill is-format');
    expect(card).toContain('活动时间：首场 08-18 09:30 ~ 08-18 17:30 · 共 3 场');
    expect(card).toContain('报名时间：08-01 09:00 起，每场开场时截止');
    expect(card).toContain('每场名额：60 人');
    expect(card).not.toContain('已报名 54 人');
    expect(card).not.toContain('联系电话');
    expect(card).not.toContain('href="tel:');
    expect(html).not.toContain('活动评分');
    expect(html).toContain('aria-label="分享"');
    const start = html.indexOf('c-detail-info-card');
    const infoCard = html.slice(start, html.indexOf('</section>', start));
    expect(infoCard).not.toContain('c-quota-card');
    expect(infoCard).toContain('每场名额：60 人');
    expect(infoCard).toContain('c-signup-people');
    expect(infoCard.indexOf('每场名额：60 人')).toBeLessThan(infoCard.indexOf('c-signup-people'));
    expect(html.indexOf('</section>', start)).toBeLessThan(html.indexOf('h5-activity-intro'));
  });

  it('shows recent unfinished sessions on multi-session details after quota', () => {
    const basketball = renderToStaticMarkup(<H5ActivityDetail id={26} />);
    const card = basketball.slice(basketball.indexOf('c-detail-info-card'), basketball.indexOf('h5-activity-intro'));
    expect(card).toContain('最近场次');
    expect(card).toContain('已报1场');
    expect(card.indexOf('每场名额')).toBeLessThan(card.indexOf('最近场次'));
    expect(card.indexOf('最近场次')).toBeLessThan(card.indexOf('c-signup-people'));

    const once = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    expect(once.slice(once.indexOf('c-detail-info-card'), once.indexOf('h5-activity-intro'))).not.toContain('最近场次');
  });

  it('lists all open-day threads on detail without view-all', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'));
    expect(block).not.toContain('查看全部');
    expect(block).toContain('说点什么…');
    expect(block).not.toContain('写评论');
    expect(block).toContain('纪念品柜台要排队。');
    expect(block).toContain('馆内WIFI稳。');
    expect(block).not.toContain('洗手间指示不够。');
    expect(block).not.toContain('王芳 回复 张悦');
    expect(block).not.toContain('希望增加名额');
    expect(block).toContain('回复');
    expect(block).toContain('c-avatar');
    expect(html).toContain('c-social-tab');
  });

  it('shows delete for own comments with confirm closed', () => {
    expect(submitActivityComment(1, '我的楼')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'));
    expect(block).toContain('删除');
    expect(block).not.toContain('确认删除');
  });

  it('lists camp threads including two-layer replies on detail', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={2} />);
    expect(html).toContain('评论 6');
    expect(html).not.toContain('查看全部');
    expect(html).toContain('食堂窗口排队有点长。');
    expect(html).toContain('结业证书什么时候发？');
    expect(html).toContain('实操课节奏合适');
    expect(html).toContain('王芳 回复 苏然');
    expect(html).toContain('陈产品 回复 王芳');
  });

  it('lets a signed-up user cancel a one-off activity before the deadline', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={9} />);
    expect(html).toContain('取消报名');
    expect(html).not.toMatch(/class="c-cta"[^>]*>已报名</);
  });

  it('lets a signed-up user adjust remaining sessions instead of cancel', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={26} />);
    expect(html).toContain('调整报名');
    expect(html).not.toContain('取消报名');
  });

  it('opens the session list to add or remove remaining sessions', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" activityId={26} h5Page="signup" />);
    expect(html).toContain('调整报名');
    expect(html).toContain('参加场次');
    expect(html).toContain('保存场次');
    expect(html).toContain('余49位');
    expect(html).toContain('余50位');
    expect(html).toMatch(/value="s-0-202608271400"[^>]*checked|checked[^>]*value="s-0-202608271400"/);
  });

  it('shows full comments when CEndApp opens an activity', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" activityId={1} />);
    expect(html).toContain('纪念品柜台要排队。');
  });

  it('shows floating back and home buttons', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    expect(html).toContain('c-h5-detail-fab');
    expect(html).toContain('返回上一页');
    expect(html).toContain('回主页');
  });

  it('summarizes approved signup people instead of tiling them', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={2} />);
    const block = html.slice(html.indexOf('c-signup-people'), html.indexOf('id="activity-social"'));
    expect(block).toContain('已报名人员（50）');
    expect(block).toContain('+45');
    expect(block).toContain('查看名单');
    expect(block).toContain('c-avatar');
    expect(block).not.toContain('前端组');
    expect(block).not.toContain('王芳');
  });
});
