import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { restoreRelatedComments } from '../../../activities/model/related';
import { resetEngagement } from '../model/engagementStore';
import { PcActivityDetail } from './PcActivityDetail';

describe('PC activity detail', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('keeps a two-column layout with CTA in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const article = html.indexOf('<article');
    const aside = html.indexOf('<aside class="c-pc-side">');
    const cta = html.indexOf('class="c-cta"');

    expect(html).toContain('c-pc-detail');
    expect(html).toContain('c-detail-info-card');
    expect(html).toContain('活动介绍');
    expect(html).toContain('发起人：');
    expect(html).toContain('每场名额：');
    expect(html).not.toContain('分类：培训');
    const cover = html.slice(html.indexOf('c-detail-cover'), html.indexOf('c-article-body'));
    expect(cover).toContain('c-cover-badges');
    expect(cover).toContain('c-cover-title');
    expect(cover).toContain('新员工入职训练营');
    expect(cover.indexOf('c-cover-badges')).toBeLessThan(cover.indexOf('c-cover-title'));
    expect(cover.indexOf('进行中')).toBeLessThan(cover.indexOf('置顶'));
    expect(cover.indexOf('置顶')).toBeLessThan(cover.indexOf('系列活动'));
    expect(cover.indexOf('系列活动')).toBeLessThan(cover.indexOf('培训'));
    expect(cover).toContain('c-pill is-category');
    expect(cover).toContain('c-pill is-format');
    expect(html).not.toContain('c-detail-heading');
    expect(html).toContain('活动时间：首场 08-18 09:30 ~ 08-18 17:30 · 共 3 场');
    expect(html).toContain('报名时间：08-01 09:00 起，每场开场时截止');
    expect(html).not.toContain('活动时间：2026-');
    expect(html).not.toContain('报名时间：2026-');
    expect(html).not.toContain('已报名 54 人');
    expect(html).not.toContain('联系电话');
    expect(html).not.toContain('href="tel:');
    expect(article).toBeGreaterThan(-1);
    expect(aside).toBeGreaterThan(article);
    expect(cta).toBeGreaterThan(aside);
    expect(html).toContain('aria-label="分享"');
    expect(html).not.toContain('活动评分');
  });

  it('shows the rating block above comments after the activity ends', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={1} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));
    expect(aside).not.toContain('活动评分');
    expect(html).toContain('活动评分');
    expect(html).toContain('aria-label="评 5 星"');
    expect(html.indexOf('pc-activity-intro')).toBeLessThan(html.indexOf('c-activity-rating'));
    expect(html.indexOf('c-activity-rating')).toBeLessThan(html.indexOf('id="activity-social"'));
  });

  it('does not keep core activity facts only in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));

    expect(aside).not.toContain('发起人：');
    expect(aside).not.toContain('联系电话：');
    expect(aside).not.toContain('分类：培训');
    expect(aside).not.toContain('c-pill is-category');
    expect(aside).not.toContain('进行中');
    expect(aside).toContain('class="c-cta"');
    expect(aside).toContain('每场名额：60 人');
    expect(aside).not.toContain('已报名 54 人');
    expect(aside).not.toContain('c-quota-card');
    expect(aside.indexOf('每场名额：60 人')).toBeLessThan(aside.indexOf('c-signup-people'));
    expect(aside.indexOf('c-signup-people')).toBeLessThan(aside.indexOf('c-engage'));
  });

  it('puts recent sessions under quota in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={26} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));
    const card = html.slice(html.indexOf('c-detail-info-card'), html.indexOf('c-detail-content-section'));
    expect(aside).toContain('最近场次');
    expect(aside).toContain('已报1场');
    expect(aside.indexOf('每场名额')).toBeLessThan(aside.indexOf('最近场次'));
    expect(aside.indexOf('最近场次')).toBeLessThan(aside.indexOf('c-signup-people'));
    expect(card).not.toContain('最近场次');
  });

  it('keeps quota out of the left info card', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const card = html.slice(html.indexOf('c-detail-info-card'), html.indexOf('c-detail-content-section'));
    expect(card).not.toContain('分类：培训');
    expect(card).not.toContain('总名额：');
    expect(card).not.toContain('已报名 54 人');
  });

  it('summarizes approved signup people instead of tiling them', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));
    expect(aside).toContain('已报名人员（50）');
    expect(aside).not.toContain('c-quota-card');
    expect(aside).toContain('+45');
    expect(aside).toContain('查看名单');
    expect(aside).toContain('c-avatar');
    expect(aside).not.toContain('前端组');
    expect(aside).not.toContain('王芳');
  });

  it('renders a missing activity as a recovery state', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={999999} />);

    expect(html).toContain('活动不存在');
    expect(html).toContain('返回列表');
    expect(html).not.toContain('c-pc-detail');
  });

  it('lets a signed-up user cancel a one-off activity before the deadline', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={9} />);
    expect(html).toContain('取消报名');
  });

  it('lets a signed-up user adjust remaining sessions instead of cancel', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={26} />);
    expect(html).toContain('调整报名');
    expect(html).not.toContain('取消报名');
  });

  it('puts social actions above the signup CTA and lists comments in the article', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));
    const like = aside.indexOf('aria-label="点赞"');
    const cta = aside.indexOf('class="c-cta"');

    expect(like).toBeGreaterThan(-1);
    expect(like).toBeLessThan(cta);
    expect(html).toContain('id="activity-comments"');
  });

  it('lists open-day threads on detail without view-all', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={1} />);
    expect(html).not.toContain('查看全部');
    expect(html).toContain('说点什么…');
    expect(html).not.toContain('写评论');
    expect(html).toContain('纪念品柜台要排队。');
    expect(html).not.toContain('王芳 回复 张悦');
    expect(html).not.toContain('希望增加名额');
  });

  it('shows social tabs on activities with moments', () => {
    expect(renderToStaticMarkup(<PcActivityDetail id={1} />)).toContain('c-social-tab');
    expect(renderToStaticMarkup(<PcActivityDetail id={2} />)).toContain('c-social-tab');
  });

  it('hides the moments tab when empty and not submittable', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={12} />);
    expect(html).not.toContain('c-social-tab');
    expect(html).not.toContain('精彩瞬间');
    expect(html).toContain('id="activity-comments"');
  });

  it('opens the existing session list when adjusting', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={26} signupOpen />);
    expect(html).toContain('调整报名');
    expect(html).toContain('参加场次');
    expect(html).toContain('保存场次');
  });

  it('collects signup info in a dialog on the detail page', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={21} signupOpen />);
    expect(html).toContain('c-pc-detail');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('填写报名信息');
    expect(html).toContain('c-signup-form');
    expect(html).toContain('黄山两日游');
    expect(html).not.toContain('← 返回活动详情');
  });

  it('does not show the signup dialog until opened', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={21} />);
    expect(html).toContain('立即报名');
    expect(html).not.toContain('填写报名信息');
    expect(html).not.toContain('c-signup-form');
  });

  it('opens the signup dialog from the PC signup hash', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" activityId={21} h5Page="signup" />);
    expect(html).toContain('c-pc-detail');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('填写报名信息');
    expect(html).toContain('黄山两日游');
  });
});
