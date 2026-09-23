import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettings';
import { saveInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { patchDecoBlock } from '../../../../shared/decoration/decoTypes';
import { getIgDecoration, resetIgDecoration, saveIgDecoration } from '../../../interest-groups/model/igDecorationStore';
import {
  toggleInterestGroupActivityPin,
  toggleInterestGroupPin,
  __resetInterestGroupStoreForTest,
} from '../../../interest-groups/model/interestGroupStore';
import { resetInterestGroupActivityRatings, setInterestGroupActivityRating } from '../../../interest-groups/model/interestGroupActivityRating';
import { ME } from './igShared';
import { H5InterestGroupHome, IgScreenPreview } from './H5InterestGroupHome';

describe('H5 interest group home', () => {
  beforeEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
    resetIgDecoration();
    resetInterestGroupActivityRatings();
  });
  afterEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
    resetIgDecoration();
    resetInterestGroupActivityRatings();
  });

  it('matches admin-published home copy', () => {
    const html = renderToStaticMarkup(<H5InterestGroupHome />);

    expect(html).toContain('兴趣圈');
    expect(html).toContain('aria-label="快捷入口"');
    expect(html).not.toContain('aria-label="更多"');
    expect(html).not.toContain('c-ig-shortcuts');
    expect(html.indexOf('aria-label="返回"')).toBeLessThan(html.indexOf('c-ig-title'));
    expect(html.indexOf('c-ig-title')).toBeLessThan(html.indexOf('搜索活动或兴趣圈名称'));
    expect(html).not.toContain('aria-label="轮播图"');
    expect(html.indexOf('搜索活动或兴趣圈名称')).toBeLessThan(html.indexOf('aria-label="快捷入口"'));
    expect(html.indexOf('aria-label="快捷入口"')).toBeLessThan(html.indexOf('创建兴趣圈'));
    expect(html).toContain('c-ig-apps');
    expect(html).toContain('创建兴趣圈');
    expect(html).toContain('创建活动');
    expect(html).toContain('我的活动');
    expect(html).toContain('我的兴趣圈');
    expect(html).toContain('搜索活动或兴趣圈名称');
    expect(html).not.toContain('type="search"');
    expect(html).not.toContain('推荐兴趣圈、查询活动...');
    expect(html).not.toContain('和AI助手聊聊，找到适合你的活动');
    expect(html).not.toContain('c-ig-ai-entry');
    expect(html).not.toContain('c-ig-ai-ask');
    expect((html.match(/aria-label="快捷入口"/g) ?? []).length).toBe(1);
    expect(html).toContain('活动');
    expect(html).toContain('全部');
    expect(html).toContain('推荐');
    expect(html).toContain('最新');
    expect(html).toContain('热门');
    expect(html).toContain('运动健身');
    expect(html).toContain('周期活动');
    expect(html).toContain('周末连营徒步');
    expect(html).toContain('近郊 · 云栖谷营地');
    expect(html).toContain('已报名2/24');
    expect(html).toContain('余22位');
    expect(html).toContain('立即报名');
    expect(html).not.toContain('报名+入组');
    expect(html).not.toContain('已报名 2/24');
    expect(html).not.toContain('余 22 位');
    expect(html).not.toContain('>周期性<');
    expect(html).toContain('c-h5-list is-large-image');
    expect(html).toContain('c-h5-card-button is-large-image');
    expect(html).toContain('c-cover-title');
    expect(html).toContain('c-home-quota');
    expect(html).toContain('热门兴趣圈');
    expect(html.indexOf('热门兴趣圈')).toBeLessThan(html.indexOf('>活动<'));
    expect(html).toContain('桌游电竞局');
    expect(html).toContain('城市夜跑团');
    const hot = html.slice(html.indexOf('aria-label="热门兴趣圈"'), html.indexOf('>活动<'));
    expect(hot.indexOf('城市夜跑团')).toBeGreaterThan(hot.indexOf('桌游电竞局'));
    const homeActs = html.slice(html.indexOf('>活动<'), html.indexOf('往期精彩回顾'));
    expect(homeActs).toContain('周末连营徒步');
    expect(html).not.toContain('总部 · 滨江园区');
    expect(html).not.toContain('近郊 · 多线路');
    expect(html).not.toContain('活动区域');
    expect(html).not.toContain('暖心公益志愿队');
    expect(html).not.toContain('午休飞盘局');
    expect(html).toContain('已加入');
    expect(html).toContain('c-cover-16x9');
    expect(html).toContain('c-list-copy');
    expect(html).toMatch(/128人 · 活动 \d+/);
    expect(html).toContain('c-pill is-category');
    expect(html).not.toContain('c-ig-cat');
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('查看全部');
    expect(html).not.toContain('已结束活动 · 看大家分享的精彩瞬间');
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect(past).toContain('初夏城市漫步');
    expect(past).toContain('已结束');
    expect(past).toContain('c-past-act');
    expect(past).toContain('c-past-rail');
    expect(past).not.toContain('c-ig-ended');
    expect(past).not.toContain('配速组第一次破五，全员击掌。');
    expect(past).not.toContain('c-past-card');
    expect(past).not.toContain('c-ig-hl');
    expect(past).not.toContain('c-ig-past');
  });

  it('hides configured 兴趣圈 card fields', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', {
        showTitle: false,
        showCategoryTag: false,
        showIntro: false,
        showMembers: false,
        showJoinButton: false,
      }),
    );
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    const groups = html.slice(html.indexOf('aria-label="热门兴趣圈"'), html.indexOf('>活动<'));
    expect(groups).not.toContain('城市夜跑团');
    expect(groups).not.toContain('运动健身');
    expect(groups).not.toContain('下班后甩开屏幕');
    expect(groups).not.toContain('成员');
    expect(groups).not.toContain('已加入');
    expect(groups).not.toContain('c-card-action');
  });

  it('hides H5 activity sort tabs when Tab标签页 is off', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', { showActivityTabs: false }),
    );
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(html).not.toContain('aria-label="活动排序"');
    expect(html).toContain('aria-label="活动列表"');
  });

  it('shows only enabled H5 activity tabs', () => {
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', {
        showTabRecommend: false,
        showTabLatest: true,
        showTabHot: true,
      }),
    );
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    const tabs = html.slice(html.indexOf('aria-label="活动排序"'), html.indexOf('aria-label="活动列表"'));
    expect(tabs).not.toContain('>推荐<');
    expect(tabs).toContain('最新');
    expect(tabs).toContain('热门');
  });

  it('searches activities and groups on a secondary page', () => {
    const home = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(home).toContain('搜索活动或兴趣圈名称');
    expect(home).not.toContain('type="search"');
    expect(home).toContain('往期精彩回顾');
    expect(home).toContain('周末连营徒步');

    const html = renderToStaticMarkup(<IgScreenPreview name="search" params={{ q: '夜跑' }} />);
    expect(html).toContain('搜索');
    expect(html).toContain('type="search"');
    expect(html).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(html).toContain('城市夜跑团');
    expect(html).not.toContain('周末连营徒步');
    expect(html).not.toContain('桌游电竞局');
    expect(html).not.toContain('往期精彩回顾');
    expect(html).not.toContain('is-wide');
    expect(html).not.toContain('c-ig-group-cover');
    expect((html.match(/class="c-ig-row"/g) ?? []).length).toBe(2);
    expect((html.match(/c-ig-row-list/g) ?? []).length).toBe(2);
    expect(html).not.toContain('is-pc-2');
    expect(html).toContain('未开始');

    const hike = renderToStaticMarkup(<IgScreenPreview name="search" params={{ q: '徒步' }} />);
    expect(hike).toContain('周末连营徒步');
    expect(hike).toContain('进行中');
  });

  it('uses H5 shell with back and no home FAB', () => {
    const html = renderToStaticMarkup(<H5InterestGroupHome />);

    expect(html).toContain('class="c-h5-shell is-ig"');
    expect(html).toContain('aria-label="返回"');
    expect(html).not.toContain('c-h5-detail-fab');
    expect(html).not.toContain('回主页');
    expect(html).not.toContain('9:41');
  });

  it('is mounted from CEndApp interest-groups route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="interest-groups" />);

    expect(html).toContain('周末连营徒步');
    expect(html).toContain('class="c-h5-shell is-ig"');
    expect(html).toContain('创建兴趣圈');
    expect(html).toContain('aria-label="快捷入口"');
    expect(html).not.toContain('c-ig-shortcuts');
  });

  it('hides create shortcuts when admin rules disallow them', () => {
    saveInterestGroupSettings({
      ...defaultInterestGroupSettings,
      allowEmployeeCreateGroup: false,
    });
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(html).toContain('aria-label="快捷入口"');
    expect(html).not.toContain('创建兴趣圈');
    expect(html).toContain('创建活动');
    expect(html).toContain('我的活动');
    expect(html).toContain('我的兴趣圈');
  });

  it('limits create-activity groups to leads when rules say 仅负责人可创建', () => {
    saveInterestGroupSettings({ ...defaultInterestGroupSettings, activityCreator: 'lead' });
    const html = renderToStaticMarkup(<IgScreenPreview name="createAct" />);
    expect(html).toContain('午休飞盘局');
    expect(html).not.toContain('深夜读书会');
    expect(html).not.toContain('桌游电竞局');
  });

  it('renders reachable inner screens instead of coming-soon toasts', () => {
    const myActs = renderToStaticMarkup(<IgScreenPreview name="myActivities" />);
    expect(myActs).toContain('我的活动');
    expect(myActs).toContain('aria-label="我的活动分类"');
    expect(myActs).toContain('我创建的');
    expect(myActs).toContain('我报名的');
    expect(myActs).toContain('午间拉伸十分钟');
    expect(myActs).toContain('周末胶片冲洗局');
    expect(myActs).toContain('c-h5-list is-left-image');
    expect(myActs).toContain('c-h5-card-button is-left-image');
    expect(myActs).toContain('c-list-cover is-side');
    expect(myActs).not.toContain('is-large-image');
    expect(myActs).not.toContain('is-left-text');
    expect(myActs).not.toContain('还没有创建活动');
    expect(myActs).not.toContain('即将开放');

    const myGroups = renderToStaticMarkup(<IgScreenPreview name="myGroups" />);
    expect(myGroups).toContain('我的兴趣圈');
    expect(myGroups).toContain('aria-label="我的兴趣圈分类"');
    expect(myGroups).toContain('我创建的');
    expect(myGroups).toContain('我加入的');
    expect(myGroups).toContain('午休飞盘局');
    expect(myGroups).toContain('午间拉伸站');
    expect(myGroups).toContain('周末胶片社');
    expect(myGroups).toContain('c-ig-group is-left-image');
    expect(myGroups).toContain('c-list-cover is-side');
    expect(myGroups).not.toContain('is-large-image');
    expect(myGroups).not.toContain('is-left-text');
    expect(myGroups).not.toContain('c-ig-chip is-brand');
    expect(myGroups).not.toContain('城市夜跑团');

    const allActs = renderToStaticMarkup(<IgScreenPreview name="allActs" />);
    expect(allActs).toContain('全部活动');
    expect(allActs).toContain('搜索活动名称、兴趣圈');
    expect(allActs).not.toContain('搜索活动名称、兴趣圈、标签');
    expect(allActs).toContain('初夏城市漫步');
    expect(allActs).not.toContain('周一晚共读');
    expect(allActs).not.toContain('本周');
    expect(allActs).not.toContain('本月');
    expect(allActs).toContain('c-h5-list is-large-image');
    expect(allActs).toContain('c-h5-card-button is-large-image');

    const allGroups = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(allGroups).toContain('全部兴趣圈');
    expect(allGroups).toContain('深夜读书会');
    expect(allGroups).not.toContain('总部 · 三楼书吧');
    expect(allGroups).not.toContain('活动区域');
    expect(allGroups).not.toContain('职场成长营');
    expect(allGroups).not.toContain('午休飞盘局');
    expect(allGroups).not.toContain('is-wide');
    expect(allGroups).toContain('c-ig-group-grid is-large-image');
    expect(allGroups).toContain('c-ig-group is-large-image');
    expect(allGroups).not.toContain('c-ig-hscroll');

    const act = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(act).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(act).toContain('活动简介');
    expect(act).toContain('立即报名');
    expect(act).toContain('说点什么');
    const commentBlock = act.slice(act.indexOf('id="ig-activity-social"'));
    expect(commentBlock).toContain('张悦 回复 周棠');
    expect(commentBlock).toContain('c-comment-reply');
    expect(commentBlock).toContain('aria-label="点赞"');
    expect(commentBlock).toContain('c-activity-comment-replies');
    const actBar = act.slice(act.indexOf('c-ig-detail-actions'));
    const likeAt = actBar.indexOf('aria-label="点赞"');
    const likeOff = actBar.indexOf('aria-label="取消点赞"');
    const like = likeAt >= 0 ? likeAt : likeOff;
    const share = actBar.indexOf('aria-label="分享"');
    const cta = actBar.indexOf('c-ig-cta');
    expect(like).toBeGreaterThan(-1);
    expect(share).toBeGreaterThan(like);
    expect(cta).toBeGreaterThan(share);

    const group = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: '1' }} />);
    expect(group).toContain('城市夜跑团');
    expect(group).toContain('加入兴趣圈');
    expect(group).toContain('圈子');
    const joinRow = group.slice(group.indexOf('c-ig-group-join-row'));
    expect(joinRow.indexOf('aria-label="分享"')).toBeGreaterThan(-1);
    expect(joinRow.indexOf('aria-label="分享"')).toBeLessThan(joinRow.indexOf('加入兴趣圈') >= 0 ? joinRow.indexOf('加入兴趣圈') : joinRow.indexOf('退出兴趣圈'));
    expect(group).not.toContain('总部 · 滨江园区');
    expect(group).not.toContain('活动区域');

    const longIntro = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: '4' }} />);
    expect(longIntro).toContain('桌游电竞局');
    expect(longIntro).toContain('c-ig-intro is-clamp');
    expect(longIntro).toContain('c-ig-intro-expand');
    expect(longIntro).toContain('展开');
    expect(longIntro).not.toContain('c-ig-desc is-clamp');
    expect(longIntro).not.toContain('收起');
    const introBlock = longIntro.slice(longIntro.indexOf('c-ig-intro is-clamp'), longIntro.indexOf('c-ig-chip-row'));
    expect(introBlock.indexOf('c-ig-desc')).toBeLessThan(introBlock.indexOf('c-ig-intro-expand'));

    const shortIntro = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: '6' }} />);
    expect(shortIntro).toContain('工位边拉伸，员工创建后已通过审核。');
    expect(shortIntro).not.toContain('c-ig-intro-expand');
    expect(shortIntro).not.toContain('c-ig-intro is-clamp');

    const pcIntro = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: '4' }} surface="pc" />);
    expect(pcIntro).not.toContain('c-ig-intro is-clamp');
    expect(pcIntro).not.toContain('c-ig-intro-expand');

    const moments = renderToStaticMarkup(<IgScreenPreview name="moments" />);
    expect(moments).toContain('往期精彩回顾');
    expect(moments).toContain('c-ig-stack-title');
    expect(moments).toContain('初夏城市漫步');
    expect(moments).toContain('已结束');
    expect(moments).toContain('c-h5-list is-two-col');
    expect(moments).toContain('c-past-act');
    expect(moments).not.toContain('c-past-rail');
    expect(moments).not.toContain('c-ig-act');
    expect(moments).not.toContain('c-moment-card');
    expect(moments).not.toContain('滨江 8K 夜跑 · 江风配速团');
    expect(moments).not.toContain('本周高光');
    expect(moments).not.toContain('c-ig-mom');

    const chat = renderToStaticMarkup(<IgScreenPreview name="aichat" />);
    expect(chat).toContain('你的兴趣助手');
    expect(chat).toContain('和小趣说点什么');

    const createGroup = renderToStaticMarkup(<IgScreenPreview name="createGroup" />);
    expect(createGroup).toContain('兴趣圈名称');
    expect(createGroup).not.toContain('加入方式');
    expect(createGroup).not.toContain('自由加入');
    expect(createGroup).not.toContain('需审核');
    expect(createGroup).not.toContain('活动区域');
    expect(createGroup).not.toContain('标签');
    expect(createGroup).toContain('c-ig-form-bar');
    expect(createGroup.indexOf('c-ig-form')).toBeLessThan(createGroup.indexOf('c-ig-form-bar'));
    expect(createGroup).toMatch(/c-ig-form-bar[\s\S]*创建/);

    const createGroupPc = renderToStaticMarkup(<IgScreenPreview name="createGroup" surface="pc" />);
    for (const html of [createGroup, createGroupPc]) {
      expect(html).toContain('兴趣圈负责人');
      expect(html).toContain('c-ig-lead-field');
      expect(html).toContain('c-ig-lead-tag-item');
      expect(html).toContain('林浅');
      expect(html).not.toContain('c-ig-lead-tree');
      expect(html).not.toContain('已选：');
      expect(html).not.toContain('c-ig-lead-trigger');
      expect(html).not.toContain('c-ig-lead-panel');
      expect(html).toContain('c-ig-cover-drop');
      expect(html).not.toContain('c-ig-cover-btn');
    }

    const createAct = renderToStaticMarkup(<IgScreenPreview name="createAct" />);
    expect(createAct).toContain('创建活动');
    expect(createAct).toContain('封面图片');
    expect(createAct).toContain('活动标题');
    expect(createAct).toContain('分类');
    expect(createAct).toContain('活动地点');
    expect(createAct).toContain('所属兴趣圈');
    expect(createAct).toContain('午休飞盘局');
    expect(createAct).toContain('举办方式');
    expect(createAct).toContain('单次活动');
    expect(createAct).toContain('周期活动');
    expect(createAct).toContain('系列活动');
    expect(createAct).toContain('活动时间');
    expect(createAct).toContain('报名时间');
    expect(createAct).toContain('报名总人数');
    expect(createAct).toContain('活动介绍');
    expect(createAct).toContain('活动安排、注意事项');
    expect(createAct).toContain('c-ig-desc-preview');
    expect(createAct).toContain('c-ig-form-bar');
    expect(createAct).not.toContain('活动名称');
    expect(createAct).not.toContain('需要先加入兴趣圈才能创建活动');
    expect(createAct).not.toContain('可见范围');
    expect(createAct).toContain('发送消息通知');
    expect(createAct).toContain('仅通知兴趣圈成员');
    expect(createAct).not.toContain('通知对象');
    expect(createAct).not.toContain('可选通知全员');
    expect(createAct).toContain('扫码签到');
    expect(createAct).not.toContain('活动积分');
    expect(createAct).not.toContain('报名信息收集');
    expect(createAct).not.toContain('aria-label="活动详情"');
    const cover = createAct.indexOf('封面图片');
    const title = createAct.indexOf('活动标题');
    const category = createAct.indexOf('分类');
    const location = createAct.indexOf('活动地点');
    const groupField = createAct.indexOf('所属兴趣圈');
    const schedule = createAct.indexOf('举办方式');
    const activityTime = createAct.indexOf('活动时间');
    const signup = createAct.indexOf('报名时间');
    const quota = createAct.indexOf('报名总人数');
    const detail = createAct.indexOf('aria-label="活动介绍"');
    expect(title).toBeGreaterThan(cover);
    expect(category).toBeGreaterThan(title);
    expect(location).toBeGreaterThan(category);
    expect(groupField).toBeGreaterThan(location);
    expect(activityTime).toBeGreaterThan(groupField);
    expect(schedule).toBeGreaterThan(activityTime);
    expect(signup).toBeGreaterThan(schedule);
    expect(quota).toBeGreaterThan(signup);
    expect(detail).toBeGreaterThan(quota);
    expect(createAct.indexOf('c-ig-form')).toBeLessThan(createAct.indexOf('c-ig-form-bar'));
    expect(createAct).toMatch(/c-ig-form-bar[\s\S]*创建/);
  });

  it('mirrors activity-app info card on activity detail', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '201' }} />);
    const start = html.indexOf('c-ig-info-card');
    const card = html.slice(start, html.indexOf('活动简介'));

    expect(start).toBeGreaterThan(-1);
    expect(card).toContain('地点：近郊 · 云栖谷营地');
    expect(card).toContain('发起人：陈产品');
    expect(card).toContain('每场名额：24 人');
    expect(card).toContain('最近场次');
    expect(card).toContain('已报1场');
    expect(card).toContain('已报名');
    expect(card).toContain('已报名人员（2）');
    expect(card.indexOf('每场名额')).toBeLessThan(card.indexOf('最近场次'));
    expect(card.indexOf('最近场次')).toBeLessThan(card.indexOf('已报名人员'));
    expect(card).not.toContain('c-ig-meta-ico');
    expect(html.split('c-ig-info-card').length - 1).toBe(1);

    const nightRun = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    const nightCard = nightRun.slice(nightRun.indexOf('c-ig-info-card'), nightRun.indexOf('活动简介'));
    expect(nightCard).toContain('已报0场');
    expect(nightCard).toContain('每场名额：40 人');
    expect(nightCard).toContain('发起人：张悦');

    const once = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} />);
    const onceCard = once.slice(once.indexOf('c-ig-info-card'), once.indexOf('活动简介'));
    expect(onceCard).toContain('总名额：30 人');
    expect(onceCard).toContain('已报名人员（1）');
    expect(onceCard).not.toContain('最近场次');
    expect(onceCard).not.toContain('每场名额');
  });

  it('mirrors activity-app signup, people list and social tabs', () => {
    const open = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(open).toContain('立即报名');
    expect(open).not.toContain('调整报名场次');
    expect(open).toMatch(/aria-label="(?:取消)?点赞"/);
    expect(open).toContain('aria-label="分享"');
    expect(open).toContain('查看名单');
    expect(open).toContain('说点什么');
    expect(open).not.toContain('写评论');
    expect(open).not.toContain('role="tablist"');
    expect(open).toContain('这周四能安排配速 6 分组的陪跑吗？');

    const form = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101', pickEnroll: true }} />);
    expect(form).toContain('参加场次');
    expect(form).toContain('确认报名');
    expect(form).not.toContain('13800138000');
    expect(form).toContain('展开全部场次');

    const hike = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '201' }} />);
    expect(hike).toContain('立即报名');
    expect(hike).toContain('连营徒步需要自备睡袋吗？');

    const stretch = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '601' }} />);
    expect(stretch).toContain('签到二维码');
    expect(stretch).toContain('c-org-qr');
    expect(stretch).toContain('ig-act-601/checkin');

    const series = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '604' }} />);
    expect(series).toContain('签到二维码');
    expect(series).toContain('aria-label="签到场次"');
    expect(series).toContain('ig-act-604/checkin');

    const nightRunQr = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(nightRunQr).not.toContain('签到二维码');
    expect(nightRunQr).not.toContain('c-org-qr');

    const ended = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} />);
    expect(ended).toContain('报名已结束');
    expect(ended).toContain('role="tablist"');

    const hikeMoments = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '201' }} />);
    expect(hikeMoments).toContain('role="tablist"');
    expect(hikeMoments).toContain('精彩瞬间');
    expect(ended).toContain('aria-label="评论和精彩瞬间"');
    expect(ended).toContain('评论 0');
    expect(ended).toContain('精彩瞬间 3');
    expect(ended).not.toContain('写评论');
  });

  it('shows activity rating between intro and social panel for ended and ongoing activities', () => {
    const ended = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} />);
    expect(ended).toContain('c-activity-rating');
    expect(ended).toContain('活动评分');
    expect(ended).toContain('4.3');
    expect(ended).toContain('3 人评分');
    expect(ended.indexOf('活动简介')).toBeLessThan(ended.indexOf('c-activity-rating'));
    expect(ended.indexOf('c-activity-rating')).toBeLessThan(ended.indexOf('id="ig-activity-social"'));

    const ongoing = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '201' }} />);
    expect(ongoing).toContain('c-activity-rating');
    expect(ongoing).toContain('活动评分');
    expect(ongoing).toContain('确认评分');

    const upcoming = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(upcoming).not.toContain('c-activity-rating');
  });

  it('requires confirm to rate once on an ended activity', () => {
    const ended = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} />);
    expect(ended).toContain('确认评分');
    const starsRow = ended.slice(ended.indexOf('c-activity-rating-stars'), ended.indexOf('</div>', ended.indexOf('c-activity-rating-stars')));
    expect(starsRow).toContain('确认评分');

    setInterestGroupActivityRating(102, ME, 5);
    const rated = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} />);
    expect(rated).toContain('4 人评分');
    expect(rated).not.toContain('确认评分');
  });

  it('matches home group card layout on 全部兴趣圈', () => {
    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'large-image' }));
    const home = renderToStaticMarkup(<H5InterestGroupHome />);
    const all = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(home).toContain('c-ig-group-grid is-large-image');
    expect(all).toContain('c-ig-group-grid is-large-image');
    expect(all).toContain('c-ig-group is-large-image');
    expect(all).not.toContain('is-wide');
    expect(all).not.toContain('c-ig-hscroll');

    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'left-image' }));
    const allLeft = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(allLeft).toContain('c-ig-group-grid is-left-image');
    expect(allLeft).toContain('c-ig-group is-left-image');
  });

  it('shows 活动数 on group cards without duplicate 成员 text row', () => {
    const all = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(all).toMatch(/\d+人 · 活动 \d+/);
    expect(all).not.toContain('成员128');
    expect(all).not.toContain('成员142');
    expect(all).not.toMatch(/>成员\d+</);
    expect(all).toContain('c-home-quota-people');

    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'left-image' }));
    const allLeft = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(allLeft).toMatch(/\d+人 · 活动 \d+/);
    expect(allLeft).not.toMatch(/>成员\d+</);
  });

  it('lists 全部兴趣圈 / 全部活动 in admin pin then sortIndex order', () => {
    toggleInterestGroupPin(3);
    toggleInterestGroupActivityPin(101);
    const groups = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    const groupSlice = groups.slice(groups.indexOf('aria-label="全部兴趣圈"'));
    expect(groupSlice.indexOf('深夜读书会')).toBeLessThan(groupSlice.indexOf('城市夜跑团'));
    const acts = renderToStaticMarkup(<IgScreenPreview name="allActs" />);
    const actSlice = acts.slice(acts.indexOf('aria-label="全部活动"'));
    expect(actSlice.indexOf('滨江 8K 夜跑')).toBeLessThan(actSlice.indexOf('周末连营徒步'));
  });

  it('renders groups 大图模式 as a stacked grid', () => {
    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'large-image' }));
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(html).toContain('c-ig-group-grid is-large-image');
    expect(html).not.toContain('c-ig-hscroll" aria-label="热门兴趣圈"');
  });

  it('renders groups 左图右文 and 左文右图', () => {
    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'left-image' }));
    const left = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(left).toContain('c-ig-group-grid is-left-image');
    expect(left).toContain('c-ig-group is-left-image');
    expect(left).toContain('c-cover c-list-cover is-side is-contain');
    const card = left.slice(left.indexOf('c-ig-group is-left-image'));
    const body = card.indexOf('c-list-copy');
    expect(card.slice(0, body)).not.toContain('c-card-title');
    expect(card.slice(body).indexOf('c-card-title')).toBeLessThan(card.slice(body).indexOf('is-category'));

    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'left-text' }));
    const flipped = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(flipped).toContain('c-ig-group-grid is-left-text');
    expect(flipped).toContain('c-ig-group is-left-text');
    expect(flipped).toContain('c-cover c-list-cover is-side is-contain');
  });

  it('renders activity 左图右文 and 左文右图 like activity C-end', () => {
    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', { listStyle: 'left-image' }));
    const left = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(left).toContain('c-h5-list is-left-image');
    expect(left).toContain('c-h5-card-button is-left-image');
    expect(left).toContain('c-card-title');

    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', { listStyle: 'left-text' }));
    const flipped = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(flipped).toContain('c-h5-list is-left-text');
    expect(flipped).toContain('c-h5-card-button is-left-text');
  });

  it('renders moments list styles instead of always scrolling', () => {
    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-moments', { listStyle: 'left-image' }));
    const left = renderToStaticMarkup(<H5InterestGroupHome />);
    const past = left.slice(left.indexOf('往期精彩回顾'));
    expect(past).toContain('c-h5-list is-left-image');
    expect(past).toContain('c-past-act is-left-image');
    expect(past).not.toContain('c-ig-hscroll');
    expect(past).not.toContain('c-past-rail');

    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-moments', { listStyle: 'two-col' }));
    const two = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(two.slice(two.indexOf('往期精彩回顾'))).toContain('c-h5-list is-two-col');
  });

  it('mirrors home activity style on 全部活动', () => {
    saveIgDecoration('mobile', patchDecoBlock(getIgDecoration('mobile'), 'deco-activity', { listStyle: 'left-image' }));
    const all = renderToStaticMarkup(<IgScreenPreview name="allActs" />);
    expect(all).toContain('c-h5-list is-left-image');
    expect(all).toContain('c-h5-card-button is-left-image');
  });

  it('requires interest group and activity when posting a moment', () => {
    const html = renderToStaticMarkup(<IgScreenPreview name="post" />);
    expect(html).toContain('所属兴趣圈');
    expect(html).toContain('关联活动');
    expect(html).toContain('请选择所属兴趣圈');
    expect(html).not.toContain('已结束活动');
    expect(html).not.toContain('活动结束后才可以发布');

    const fromGroup = renderToStaticMarkup(<IgScreenPreview name="post" params={{ gid: '1' }} />);
    expect(fromGroup).toContain('城市夜跑团');
    expect(fromGroup).toContain('初夏城市漫步');
    expect(fromGroup).not.toContain('周末连营徒步');
    expect(fromGroup).not.toContain('午间拉伸十分钟');
  });

  it('turns home scroll past highlights into a two-col all list', () => {
    const home = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(home.slice(home.indexOf('往期精彩回顾'))).toContain('c-past-rail');
    saveIgDecoration(
      'mobile',
      patchDecoBlock(getIgDecoration('mobile'), 'deco-moments', { listStyle: 'left-image' }),
    );
    const all = renderToStaticMarkup(<IgScreenPreview name="moments" />);
    expect(all).toContain('c-h5-list is-left-image');
    expect(all).toContain('c-past-act is-left-image');
    expect(all).not.toContain('c-past-rail');
  });

  it('insets 往期大图 like activity large-image cards', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'groupHome.css'), 'utf8');
    const rule = (selector: string) => {
      const idx = css.indexOf(selector);
      expect(idx, selector).toBeGreaterThan(-1);
      return css.slice(css.indexOf('{', idx), css.indexOf('}', css.indexOf('{', idx)));
    };
    expect(rule('.c-h5-shell.is-ig .c-ig-block.is-ended .c-h5-list.is-large-image')).toContain('padding: 0 16px');
    expect(rule('.c-pc-shell.is-ig .c-ig-block.is-ended .c-pc-grid.is-large-image')).toContain('padding: 0 16px');
  });

  it('matches activity side-cover stretch on interest-group cards', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'groupHome.css'), 'utf8');
    const idx = css.indexOf('.c-ig-group-grid.is-left-image .c-ig-group-cover,');
    expect(idx).toBeGreaterThan(-1);
    const block = css.slice(css.indexOf('{', idx), css.indexOf('}', css.indexOf('{', idx)));
    expect(block).toContain('align-items: center');
    expect(block).toContain('align-self: stretch');
    expect(block).toContain('width: 108px');
    expect(block).toContain('min-height: 96px');
    expect(block).not.toContain('align-self: center');
    const photo = css.indexOf('.c-ig-group-grid.is-left-image .c-ig-group-cover .c-ig-photo,');
    expect(photo).toBeGreaterThan(-1);
    const photoBlock = css.slice(css.indexOf('{', photo), css.indexOf('}', css.indexOf('{', photo)));
    expect(photoBlock).toContain('aspect-ratio: 4 / 3');
    expect(photoBlock).toContain('object-fit: contain');
    expect(photoBlock).not.toContain('inset: 0');
  });

  it('shows 负责人 tags, departments and two members per row', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const html = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: '4', tab: 'members' }} />);
    expect(html).toContain('桌游电竞局');
    expect(html).toContain('>负责人<');
    expect(html).not.toContain('>组长<');
    expect(html.split('c-ig-lead-tag').length - 1).toBe(2);
    expect(html).toContain('黄码');
    expect(html).toContain('吴检');
    expect(html).toContain('c-ig-member-dept');
    expect(html).toContain('后端组');
    expect(html).toContain('质检部');
    expect(html).toContain('财务');
    expect(html).toContain('前端组');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'groupHome.css'), 'utf8');
    const members = css.indexOf('.c-ig-members {');
    expect(members).toBeGreaterThan(-1);
    expect(css.slice(css.indexOf('{', members), css.indexOf('}', css.indexOf('{', members)))).toContain(
      'grid-template-columns: repeat(2, 1fr)',
    );
  });

  it('applies published home title from 版面设置', () => {
    saveIgDecoration('mobile', { ...getIgDecoration('mobile'), pageTitle: '同好圈子' });
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(html).toContain('同好圈子');
  });
});
