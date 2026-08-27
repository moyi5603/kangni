import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettings';
import { saveInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { __resetInterestGroupStoreForTest } from '../../../interest-groups/model/interestGroupStore';
import { H5InterestGroupHome, IgScreenPreview } from './H5InterestGroupHome';

describe('H5 interest group home', () => {
  beforeEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
  });
  afterEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
    __resetInterestGroupStoreForTest();
  });

  it('matches admin-published home copy', () => {
    const html = renderToStaticMarkup(<H5InterestGroupHome />);

    expect(html).toContain('兴趣小组');
    expect(html).toContain('创建小组');
    expect(html).toContain('创建活动');
    expect(html).toContain('我的活动');
    expect(html).toContain('我的小组');
    expect(html).toContain('推荐小组、查询活动...');
    expect(html).toContain('问');
    expect(html).toContain('职场成长的活动有什么');
    expect(html).toContain('适合新人的小组');
    expect(html).toContain('本月最热门的小组');
    expect(html).toContain('活动');
    expect(html).toContain('全部');
    expect(html).toContain('推荐');
    expect(html).toContain('最新');
    expect(html).toContain('热门');
    expect(html).toContain('运动健身');
    expect(html).toContain('周期性');
    expect(html).toContain('周末连营徒步');
    expect(html).toContain('共 3 天');
    expect(html).toContain('近郊 · 云栖谷营地');
    expect(html).toContain('已报名 19/24');
    expect(html).toContain('余 5 位');
    expect(html).toContain('跨 3 天连营');
    expect(html).toContain('报名+入组');
    expect(html).toContain('热门小组');
    expect(html.indexOf('热门小组')).toBeLessThan(html.indexOf('>活动<'));
    expect(html).toContain('桌游电竞局');
    expect(html).toContain('城市夜跑团');
    expect(html).not.toContain('暖心公益志愿队');
    expect(html).not.toContain('午休飞盘局');
    expect(html).toContain('已加入');
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('查看全部');
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect((past.match(/c-past-card/g) ?? []).length).toBe(3);
    expect(past).toContain('c-past-rail');
    expect(past).toContain('查看大图');
    expect(past).toContain('配速组第一次破五，全员击掌。');
    expect(past).toContain('夜跑收工，江风把汗吹干。');
    expect(past).toContain('书吧灯还亮着，围读散场合影。');
    expect(past).not.toContain('初夏漫步打卡，夕阳刚好。');
    expect(past).not.toContain('连营第二天，溪边煮面最香。');
    expect(past).not.toContain('五黑翻盘，这把要回看十遍。');
    expect(past).not.toContain('凌晨四点出发是值得的');
    expect(past).not.toContain('已结束活动 · 看大家分享的精彩瞬间');
    expect(past).not.toContain('c-ig-hl');
    expect(past).not.toContain('c-ig-past');
  });

  it('uses H5 shell with back and home FAB', () => {
    const html = renderToStaticMarkup(<H5InterestGroupHome />);

    expect(html).toContain('class="c-h5-shell is-ig"');
    expect(html).toContain('aria-label="返回"');
    expect(html).toContain('class="c-h5-detail-fab is-home"');
    expect(html).toContain('回主页');
    expect(html).not.toContain('9:41');
  });

  it('is mounted from CEndApp interest-groups route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="interest-groups" />);

    expect(html).toContain('周末连营徒步');
    expect(html).toContain('class="c-h5-shell is-ig"');
    expect(html).toContain('创建小组');
  });

  it('hides create shortcuts when admin rules disallow them', () => {
    saveInterestGroupSettings({
      ...defaultInterestGroupSettings,
      allowEmployeeCreateGroup: false,
    });
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(html).not.toContain('创建小组');
    expect(html).toContain('创建活动');
    expect(html).toContain('我的活动');
    expect(html).toContain('我的小组');
  });

  it('renders reachable inner screens instead of coming-soon toasts', () => {
    const myActs = renderToStaticMarkup(<IgScreenPreview name="myActivities" />);
    expect(myActs).toContain('我的活动');
    expect(myActs).toContain('aria-label="我的活动分类"');
    expect(myActs).toContain('我创建的');
    expect(myActs).toContain('我报名的');
    expect(myActs).toContain('午间拉伸十分钟');
    expect(myActs).toContain('周末胶片冲洗局');
    expect(myActs).not.toContain('还没有创建活动');
    expect(myActs).not.toContain('即将开放');

    const myGroups = renderToStaticMarkup(<IgScreenPreview name="myGroups" />);
    expect(myGroups).toContain('我的小组');
    expect(myGroups).toContain('aria-label="我的小组分类"');
    expect(myGroups).toContain('我创建的');
    expect(myGroups).toContain('我加入的');
    expect(myGroups).toContain('午休飞盘局');
    expect(myGroups).toContain('午间拉伸站');
    expect(myGroups).toContain('周末胶片社');
    expect(myGroups).not.toContain('c-ig-chip is-brand');
    expect(myGroups).not.toContain('城市夜跑团');

    const allActs = renderToStaticMarkup(<IgScreenPreview name="allActs" />);
    expect(allActs).toContain('全部活动');
    expect(allActs).toContain('搜索活动名称、小组、标签');
    expect(allActs).toContain('初夏城市漫步');
    expect(allActs).not.toContain('周一晚共读');

    const allGroups = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(allGroups).toContain('全部小组');
    expect(allGroups).toContain('深夜读书会');
    expect(allGroups).not.toContain('职场成长营');
    expect(allGroups).not.toContain('午休飞盘局');

    const act = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(act).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(act).toContain('活动简介');
    expect(act).toContain('立即报名');
    expect(act).toContain('说点什么');

    const group = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: '1' }} />);
    expect(group).toContain('城市夜跑团');
    expect(group).toContain('加入小组');
    expect(group).toContain('小组圈');

    const moments = renderToStaticMarkup(<IgScreenPreview name="moments" />);
    expect(moments).toContain('往期精彩回顾');
    expect(moments).toContain('c-moment-card');
    expect(moments).toContain('c-moment-more');
    expect(moments).toContain('初夏漫步打卡，夕阳刚好。');
    expect(moments).toContain('这张光线很好');
    expect(moments).toContain('江野回复周棠');
    expect(moments).not.toContain('本周高光');
    expect(moments).not.toContain('c-ig-mom');

    const chat = renderToStaticMarkup(<IgScreenPreview name="aichat" />);
    expect(chat).toContain('你的兴趣助手');
    expect(chat).toContain('和小趣说点什么');

    const createGroup = renderToStaticMarkup(<IgScreenPreview name="createGroup" />);
    expect(createGroup).toContain('小组名称');
    expect(createGroup).not.toContain('加入方式');
    expect(createGroup).not.toContain('自由加入');
    expect(createGroup).not.toContain('需审核');
    expect(createGroup).toContain('c-ig-form-bar');
    expect(createGroup.indexOf('c-ig-form')).toBeLessThan(createGroup.indexOf('c-ig-form-bar'));
    expect(createGroup).toMatch(/c-ig-form-bar[\s\S]*创建/);

    const createAct = renderToStaticMarkup(<IgScreenPreview name="createAct" />);
    expect(createAct).toContain('创建活动');
    expect(createAct).toContain('封面图片');
    expect(createAct).toContain('活动标题');
    expect(createAct).toContain('分类');
    expect(createAct).toContain('活动地点');
    expect(createAct).toContain('所属小组');
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
    expect(createAct).not.toContain('需要先加入小组才能创建活动');
    expect(createAct).not.toContain('可见范围');
    expect(createAct).not.toContain('aria-label="活动详情"');
    const cover = createAct.indexOf('封面图片');
    const title = createAct.indexOf('活动标题');
    const category = createAct.indexOf('分类');
    const location = createAct.indexOf('活动地点');
    const groupField = createAct.indexOf('所属小组');
    const schedule = createAct.indexOf('举办方式');
    const activityTime = createAct.indexOf('活动时间');
    const signup = createAct.indexOf('报名时间');
    const quota = createAct.indexOf('报名总人数');
    const detail = createAct.indexOf('aria-label="活动介绍"');
    expect(title).toBeGreaterThan(cover);
    expect(category).toBeGreaterThan(title);
    expect(location).toBeGreaterThan(category);
    expect(groupField).toBeGreaterThan(location);
    expect(schedule).toBeGreaterThan(groupField);
    expect(activityTime).toBeGreaterThan(schedule);
    expect(signup).toBeGreaterThan(activityTime);
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
    expect(card).toContain('余14位');
    expect(card).toContain('已报名人员（19）');
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
    expect(onceCard).toContain('已报名人员（29）');
    expect(onceCard).not.toContain('最近场次');
    expect(onceCard).not.toContain('每场名额');
  });

  it('mirrors activity-app signup, people list and social tabs', () => {
    const open = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101' }} />);
    expect(open).toContain('立即报名');
    expect(open).not.toContain('调整报名场次');
    expect(open).toMatch(/aria-label="(?:取消)?点赞"/);
    expect(open).toContain('aria-label="评论"');
    expect(open).toContain('查看名单');
    expect(open).toContain('说点什么');
    expect(open).not.toContain('写评论');
    expect(open).not.toContain('role="tablist"');
    expect(open).toContain('这周四能安排配速 6 分组的陪跑吗？');

    const form = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '101', pickEnroll: true }} />);
    expect(form).toContain('参加场次');
    expect(form).toContain('确认报名');
    expect(form).toContain('林浅');

    const hike = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '201' }} />);
    expect(hike).toContain('调整报名');
    expect(hike).toContain('连营徒步需要自备睡袋吗？');

    const ended = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: '102' }} />);
    expect(ended).toContain('报名已结束');
    expect(ended).toContain('role="tablist"');
    expect(ended).toContain('aria-label="评论和精彩瞬间"');
    expect(ended).toContain('评论 0');
    expect(ended).toContain('精彩瞬间 1');
    expect(ended).not.toContain('写评论');
  });
});
