import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { CEndToastProvider } from '../../activities/components/CEndToast';
import { __resetContestStoreForTests } from '../../../skills-contest/model/contestStore';
import { H5ContestHome } from './H5ContestHome';
import { H5ContestDetail } from './H5ContestDetail';
import { H5ContestSignup } from './H5ContestSignup';
import { H5ContestChallenge } from './H5ContestChallenge';
import { H5ContestRank } from './H5ContestRank';
import { H5ContestMine } from './H5ContestMine';
import { H5ContestEvents } from './H5ContestEvents';

describe('skills contest H5', () => {
  beforeEach(() => {
    __resetContestStoreForTests();
  });

  it('home follows contest portal screenshot', () => {
    const html = renderToStaticMarkup(<H5ContestHome />);
    expect(html).toContain('class="c-h5-shell is-contest');
    expect(html).toContain('aria-label="搜索"');
    expect(html).toContain('课程中心');
    expect(html).toContain('闯关地图');
    expect(html).toContain('练习宝典');
    expect(html).toContain('积分排行');
    expect(html).toContain('抽奖');
    expect(html).toContain('href="#/c/h5/lottery/1"');
    expect(html).toContain('href="#/c/h5/courses"');
    expect(html).toContain('href="#/c/h5/practice"');
    expect(html).toContain('href="#/c/h5/exams"');
    expect(html).toContain('href="#/c/h5/contest-1/challenge"');
    expect(html).toContain('href="#/c/h5/contest-1/rank"');
    expect(html).toContain('课程');
    expect(html).toContain('更多');
    expect(html).toContain('线上竞赛');
    expect(html).toContain('竞赛文档');
    expect(html).toContain('我的竞赛');
    expect(html).toContain('href="#/c/h5/skills-contest/events"');
    expect(html).toContain('href="#/c/h5/skills-contest/docs"');
    expect(html).toContain('aria-label="技能大赛导航"');
    expect(html).not.toContain('每日闯关');
    expect(html).not.toContain('全部赛事');
    expect(html).toContain('c-contest-banner-dots');
    expect(html).toContain('距复赛开始');
    expect(html).toContain('查看考试');
    expect(html).toContain('正在直播');
    expect(html).toContain('LIVE');
    expect(html).toContain('进入直播');
    expect(html).toContain('今日签到领积分');
    expect(html).toContain('去签到');
    expect(html).toContain('href="#/c/h5/daily-checkin"');
    const entriesAt = html.indexOf('aria-label="快捷入口"');
    expect(entriesAt).toBeGreaterThan(-1);
    expect(html.indexOf('距复赛开始')).toBeGreaterThan(entriesAt);
    expect(html.indexOf('正在直播')).toBeGreaterThan(entriesAt);
    expect(html.indexOf('今日签到领积分')).toBeLessThan(entriesAt);
  });

  it('events hub follows online contest screenshot', () => {
    const html = renderToStaticMarkup(<H5ContestEvents />);
    expect(html).toContain('class="c-h5-shell is-contest is-contest-hub"');
    expect(html).not.toContain('c-h5-top');
    expect(html).not.toContain('c-contest-card');
    expect(html).toContain('学习计划');
    expect(html).toContain('课程库');
    expect(html).toContain('练习库');
    expect(html).toContain('考试任务');
    expect(html).toContain('href="#/c/h5/learning-plans"');
    expect(html).toContain('href="#/c/h5/courses"');
    expect(html).toContain('href="#/c/h5/practice"');
    expect(html).toContain('href="#/c/h5/exams"');
    expect(html).not.toContain('href="#/c/h5/contest-1/challenge"');
    expect(html.indexOf('学习计划')).toBeLessThan(html.indexOf('课程库'));
    expect(html.indexOf('课程库')).toBeLessThan(html.indexOf('练习库'));
    expect(html.indexOf('练习库')).toBeLessThan(html.indexOf('考试任务'));
    expect(html).toContain('aria-label="技能大赛导航"');
    expect(html).toContain('is-on');
  });

  it('detail shows signup CTA for unsigned contest', () => {
    const html = renderToStaticMarkup(<H5ContestDetail id={2} />);
    expect(html).toContain('秋季班组长挑战赛');
    expect(html).toContain('立即报名');
    expect(html).toContain('href="#/c/h5/contest-2/signup"');
  });

  it('detail shows challenge CTA when already signed', () => {
    const html = renderToStaticMarkup(<H5ContestDetail id={1} />);
    expect(html).toContain('去闯关');
    expect(html).toContain('href="#/c/h5/contest-1/challenge"');
  });

  it('signup for signed user shows already signed', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5ContestSignup id={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('你已报名');
    expect(html).toContain('去闯关');
  });

  it('challenge lists daily gates', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5ContestChallenge id={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('第1关');
    expect(html).toContain('第2关');
    expect(html).toContain('第3关');
    expect(html).toContain('c-trail-map');
    expect(html).toContain('已完成');
    expect(html).toContain('未解锁');
    expect(html).toContain('已答');
    expect(html).toMatch(/已答\s*0\s*\/\s*5/);
    expect(html).toContain('c-trail-gate-card');
    expect(html).toContain('去闯关');
    expect(html).not.toContain('c-trail-dock');
    expect(html).not.toContain('必做');
    expect(html).not.toContain('你在这');
    expect(html).not.toContain('开始闯关');
    expect(html).not.toContain('查看大图');
  });

  it('rank lists 王磊 as me', () => {
    const html = renderToStaticMarkup(<H5ContestRank id={1} />);
    expect(html).toContain('积分排行榜');
    expect(html).toContain('王磊');
    expect(html).toContain('陈芳');
    expect(html).toContain('积分');
    expect(html).toContain('学分');
    expect(html).toContain('暂无更多');
    expect(html).toContain('2026 技能公开赛');
    expect(html).toContain('class="c-h5-shell is-contest is-rank');
  });

  it('mine follows profile screenshot', () => {
    const html = renderToStaticMarkup(<H5ContestMine />);
    expect(html).toContain('class="c-h5-shell is-contest is-contest-mine');
    expect(html).not.toContain('c-h5-top');
    expect(html).toContain('王磊');
    expect(html).toContain('2026 技能公开赛');
    expect(html).not.toContain('我的工作台');
    expect(html).toContain('我的学习');
    expect(html).toContain('学习记录');
    expect(html).toContain('收藏');
    expect(html).toContain('笔记');
    expect(html).toContain('错题本');
    expect(html).toContain('学习成就');
    expect(html).toContain('证书');
    expect(html).toContain('档案');
    expect(html).toContain('建议反馈');
    expect(html).toContain('设置');
    expect(html).toContain('学分');
    expect(html).toContain('学习时长');
    expect(html).toContain('积分');
    expect(html).toContain('href="#/c/h5/skills-contest/notes"');
    expect(html).toContain('href="#/c/h5/skills-contest/wrong"');
    expect(html).toContain('href="#/c/h5/courses"');
    expect(html).toContain('href="#/c/h5/favorites"');
    expect(html).toContain('href="#/c/h5/honor"');
    expect(html).not.toContain('去打卡领积分');
    expect(html).not.toContain('已报名');
  });

  it('wrong book hub shows stats and practice entries', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="contest-wrong" />);
    expect(html).toContain('错题本');
    expect(html).toContain('累计');
    expect(html).toContain('已练习');
    expect(html).toContain('剩余');
    expect(html).toContain('练习剩余错题');
    expect(html).toContain('练习易错题');
    expect(html).toContain('练习所有错题');
    expect(html).toContain('查看所有错题');
    expect(html).not.toContain('知识点练习');
  });

  it('mounts from CEndApp', () => {
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="contest-home" />)).toContain('课程中心');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="contest-events" />)).toContain('课程库');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="learning-plans" />)).toContain('安全日练');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="contest-docs" />)).toContain('竞赛文档');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="contest-detail" contestId={1} />)).toContain('赛事详情');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="contest-mine" />)).toContain('href="#/c/h5/skills-contest/notes"');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="course-notes" />)).toContain('结构化表达三步');
  });
});
