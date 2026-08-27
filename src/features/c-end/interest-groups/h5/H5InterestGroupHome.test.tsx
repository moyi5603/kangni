import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { defaultInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettings';
import { saveInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { H5InterestGroupHome, IgScreenPreview } from './H5InterestGroupHome';

describe('H5 interest group home', () => {
  afterEach(() => {
    saveInterestGroupSettings(defaultInterestGroupSettings);
  });
  it('matches embed=mobile HomeTab copy', () => {
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
    expect(html).toContain('跨 3 天连营 · 周期规则示例');
    expect(html).toContain('周末连营徒步 · 周二入营周四撤营');
    expect(html).toContain('6/2 18:00 → 6/4 16:00');
    expect(html).toContain('共 3 天');
    expect(html).toContain('近郊 · 云栖谷营地');
    expect(html).toContain('已报名 18/24');
    expect(html).toContain('余 6 位');
    expect(html).toContain('报名');
    expect(html).toContain('跨天通宵局 · 场次展示示例');
    expect(html).toContain('通宵桌游马拉松 · 周五不眠局');
    expect(html).toContain('6/6 22:00 → 6/7 02:00');
    expect(html).toContain('共 2 天');
    expect(html).toContain('总部 · 休闲区');
    expect(html).toContain('已报名 11/16');
    expect(html).toContain('因为你常参加「城市夜跑团」');
    expect(html).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(html).toContain('调整场次');
    expect(html).toContain('报名+入组');
    expect(html).toContain('热门小组');
    expect(html.indexOf('热门小组')).toBeLessThan(html.indexOf('>活动<'));
    expect(html).toContain('桌游电竞局');
    expect(html).toContain('城市夜跑团');
    expect(html).toContain('暖心公益志愿队');
    expect(html).toContain('已加入');
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('查看全部');
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect(past).toContain('凌晨四点出发是值得的');
    expect(past).toContain('全员登顶合影');
    expect(past).toContain('38 人!本团历史新高');
    expect(past).toContain('aria-label="共3张"');
    expect(past).toContain('c-ig-past');
    expect(past).toContain('c-ig-past-copy');
    expect(past).not.toContain('已结束活动 · 看大家分享的精彩瞬间');
    expect(past).not.toContain('c-ig-hl');
    expect(past).not.toContain('云栖谷溪行 · 看日出系列 ①');
    expect(past).not.toContain('滨江 8K 夜跑 · 第 23 期');
    expect(past).not.toContain('五黑上分之夜 · 第 12 期');
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

    expect(html).toContain('周末连营徒步 · 周二入营周四撤营');
    expect(html).toContain('class="c-h5-shell is-ig"');
    expect(html).toContain('创建小组');
  });

  it('hides create shortcuts when admin rules disallow them', () => {
    saveInterestGroupSettings({
      ...defaultInterestGroupSettings,
      allowEmployeeCreateGroup: false,
      allowMemberCreateActivity: false,
    });
    const html = renderToStaticMarkup(<H5InterestGroupHome />);
    expect(html).not.toContain('创建小组');
    expect(html).not.toContain('创建活动');
    expect(html).toContain('我的活动');
    expect(html).toContain('我的小组');
  });

  it('renders reachable inner screens instead of coming-soon toasts', () => {
    const myActs = renderToStaticMarkup(<IgScreenPreview name="myActivities" />);
    expect(myActs).toContain('我的活动');
    expect(myActs).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(myActs).toContain('通宵桌游马拉松 · 周五不眠局');
    expect(myActs).not.toContain('即将开放');

    const myGroups = renderToStaticMarkup(<IgScreenPreview name="myGroups" />);
    expect(myGroups).toContain('我的小组');
    expect(myGroups).toContain('城市夜跑团');
    expect(myGroups).toContain('桌游电竞局');

    const allActs = renderToStaticMarkup(<IgScreenPreview name="allActs" />);
    expect(allActs).toContain('全部活动');
    expect(allActs).toContain('搜索活动名称、小组、标签');
    expect(allActs).toContain('初夏滨江摄影 Walk · 试点场');

    const allGroups = renderToStaticMarkup(<IgScreenPreview name="allGroups" />);
    expect(allGroups).toContain('全部小组');
    expect(allGroups).toContain('职场成长营');
    expect(allGroups).toContain('视觉设计交流组');

    const act = renderToStaticMarkup(<IgScreenPreview name="activity" params={{ aid: 'a1' }} />);
    expect(act).toContain('滨江 8K 夜跑 · 江风配速团');
    expect(act).toContain('活动简介');
    expect(act).toContain('调整报名场次');
    expect(act).toContain('写评论');

    const group = renderToStaticMarkup(<IgScreenPreview name="group" params={{ gid: 'g1' }} />);
    expect(group).toContain('城市夜跑团');
    expect(group).toContain('退出小组');
    expect(group).toContain('小组圈');

    const moments = renderToStaticMarkup(<IgScreenPreview name="moments" />);
    expect(moments).toContain('小组圈');
    expect(moments).toContain('本周高光');
    expect(moments).toContain('凌晨四点出发是值得的');

    const chat = renderToStaticMarkup(<IgScreenPreview name="aichat" />);
    expect(chat).toContain('你的兴趣助手');
    expect(chat).toContain('和小趣说点什么');

    const createGroup = renderToStaticMarkup(<IgScreenPreview name="createGroup" />);
    expect(createGroup).toContain('小组名称');
    expect(createGroup).toContain('自由加入');
    expect(createGroup).toContain('c-ig-form-bar');
    expect(createGroup.indexOf('c-ig-form')).toBeLessThan(createGroup.indexOf('c-ig-form-bar'));
    expect(createGroup).toMatch(/c-ig-form-bar[\s\S]*创建/);

    const createAct = renderToStaticMarkup(<IgScreenPreview name="createAct" />);
    expect(createAct).toContain('创建活动');
    expect(createAct).toContain('所属小组');
  });
});
