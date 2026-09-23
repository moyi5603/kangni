import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formatInterestGroupActivityTime, initialInterestGroupActivities } from '../../interest-groups/model/interestGroupActivity';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, '../../../../public/decoration/h5.html'), 'utf8');

describe('workbench H5 装修 应用组件', () => {
  it('replaces 活动 with mobile activity-app block and adds 精彩瞬间/兴趣圈/投票', () => {
    expect(html).toContain('name: "应用组件"');
    expect(html).toContain('"活动"');
    expect(html).toContain('"精彩瞬间"');
    expect(html).toContain('"兴趣圈"');
    expect(html).toContain('"投票"');
    expect(html).not.toContain('"兴趣小组"');
    expect(html).toMatch(/items:\s*\[.*"文章".*"调查问卷".*"课程".*"活动".*"精彩瞬间".*"兴趣圈".*"投票".*\]/);
  });

  it('uses activity-app H5 活动 defaults: 大图模式 and 3 items', () => {
    expect(html).toContain('id: "activity"');
    expect(html).toMatch(/id:\s*"activity"[\s\S]*?style:\s*"big"/);
    expect(html).toMatch(/id:\s*"activity"[\s\S]*?count:\s*3/);
    expect(html).toContain('置顶');
    expect(html).toContain('报名按钮');
  });

  it('defaults 精彩瞬间 to 横向滑动 5, 兴趣圈 to 横向滑动 5, 投票 to 左图右文 99', () => {
    expect(html).toMatch(/id:\s*"moments"[\s\S]*?style:\s*"slide"/);
    expect(html).toMatch(/id:\s*"moments"[\s\S]*?count:\s*5/);
    expect(html).toMatch(/id:\s*"groups"[\s\S]*?style:\s*"slide"/);
    expect(html).toMatch(/id:\s*"groups"[\s\S]*?count:\s*5/);
    expect(html).toMatch(/id:\s*"vote"[\s\S]*?style:\s*"left"/);
    expect(html).toMatch(/id:\s*"vote"[\s\S]*?count:\s*99/);
    expect(html).toContain('入组按钮');
    expect(html).toContain('投票时间');
  });

  it('lays out 应用组件 展示样式 in a horizontal picker, not a stacked right-col', () => {
    expect(html).toContain('data-app-styles');
    expect(html).not.toContain('right-col style-pick');
    expect(html).toMatch(/class="style-pick" data-app-styles/);
    expect(html).toMatch(/\.style-pick\{[^}]*display:\s*flex/);
    expect(html).toMatch(/\.style-pick\{[^}]*overflow-x:\s*auto/);
    expect(html).toMatch(/\.style-pick\{[^}]*flex-wrap:\s*nowrap/);
    expect(html).not.toMatch(/\.style-pick\{[^}]*flex-wrap:\s*wrap/);
    expect(html).not.toMatch(/\.right-col\.style-pick/);
  });

  it('aligns 活动/瞬间/兴趣圈/投票 inspector with 文章: jump, pick source, pick mode', () => {
    expect(html).toMatch(/function fillAppPane\([\s\S]*跳转链接/);
    expect(html).toMatch(/function fillAppPane\([\s\S]*选择\$\{noun\}/);
    expect(html).toMatch(/function fillAppPane\([\s\S]*选择方式/);
    expect(html).toMatch(/function fillAppPane\([\s\S]*展示最新/);
    expect(html).toMatch(/function fillAppPane\([\s\S]*自定义/);
    expect(html).toMatch(/function fillAppPane\([\s\S]*添加\$\{noun\}/);
    expect(html).not.toMatch(/function fillAppPane\([\s\S]*activity-deco-count/);
  });

  it('仅兴趣圈 omits 跳转链接; 活动/精彩瞬间均有', () => {
    expect(html).toMatch(/const hideJump = id === "groups"/);
    expect(html).not.toMatch(/hideJump = id === "activity"/);
    expect(html).toMatch(/const jumpRowHtml = hideJump \? "" :[\s\S]{0,220}跳转链接/);
    expect(html).toMatch(/if \(jumpRowEl\) \{\s*if \(id === "moments"\) mountMomentsJumpDrop/);
    expect(html).toMatch(/else if \(id === "activity"\) mountActivityJumpDrop/);
    expect(html).toMatch(/else mountCatColChain\(document\.getElementById\("appJumpChain"\)\)/);
  });

  it('活动 跳转链接 dropdown offers 活动 and 兴趣圈活动', () => {
    expect(html).toMatch(/function mountActivityJumpDrop\(parent, st\) \{\s*parent\.innerHTML = "";\s*const drop = mountDropdown/);
    expect(html).toMatch(/mountActivityJumpDrop[\s\S]{0,300}?\{ label: "活动", value: "activity" \}/);
    expect(html).toMatch(/mountActivityJumpDrop[\s\S]{0,300}?\{ label: "兴趣圈活动", value: "ig" \}/);
    expect(html).toMatch(/mountActivityJumpDrop[\s\S]{0,400}?st\.jumpLink = o\.value/);
  });

  it('精彩瞬间 跳转链接 dropdown offers 活动-精彩瞬间 and 兴趣圈-精彩瞬间', () => {
    expect(html).toContain('"活动-精彩瞬间"');
    expect(html).toContain('"兴趣圈-精彩瞬间"');
    expect(html).toMatch(/function mountMomentsJumpDrop\(parent, st\) \{\s*const drop = mountDropdown/);
    expect(html).toMatch(/mountMomentsJumpDrop[\s\S]{0,400}?st\.jumpLink = o\.value/);
    expect(html).toMatch(/appState[\s\S]*?jumpLink: ""/);
  });

  it('declares chainCloseFns before fillAppPane so 选择活动/选择方式 can mount', () => {
    const chainAt = html.indexOf('const chainCloseFns');
    const fillAt = html.indexOf('function fillAppPane');
    expect(chainAt).toBeGreaterThan(-1);
    expect(fillAt).toBeGreaterThan(-1);
    expect(chainAt).toBeLessThan(fillAt);
  });

  it('活动 选择活动 is 活动/兴趣圈活动, not 按分类/按专栏; custom add uses article-like picker', () => {
    expect(html).toContain('activity-picker.js');
    expect(html).toContain('mountActivityPicker');
    expect(html).toContain('mountActivitySourceDrop');
    expect(html).toContain('"活动"');
    expect(html).toContain('"兴趣圈活动"');
    expect(html).toMatch(/id === "activity" \|\| id === "moments"\) mountActivitySourceDrop/);
    expect(html).not.toMatch(/if \(id === "activity"\) mountCatColChain\(document\.getElementById\("appPickChain"\)\)/);
    expect(html).toMatch(/function fillAppPane\([\s\S]*activityPicker\.open/);
    expect(html).toMatch(/pickSource:\s*""/);
    expect(html).toContain('else drop.reset("请选择")');
  });

  it('精彩瞬间 选择来源 is 活动/兴趣圈活动; custom add uses activity-like picker', () => {
    expect(html).toMatch(/id === "activity" \|\| id === "moments"\) mountActivitySourceDrop/);
    expect(html).toContain('kind: "moments"');
    expect(html).toMatch(/function fillAppPane\([\s\S]*momentPicker\.open/);
  });

  it('activity picker catalog uses 活动应用 and 兴趣圈活动 mock titles', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    expect(picker).toContain('春季员工开放日');
    expect(picker).toContain('滨江 8K 夜跑');
    expect(picker).toContain('source: "活动"');
    expect(picker).toContain('source: "兴趣圈活动"');
    expect(picker).toContain('选择${noun}');
    expect(picker).toContain('name: "文化"');
    expect(picker).toContain('name: "体育"');
    expect(picker).toContain('name: "培训"');
    expect(picker).toContain('name: "公益"');
    expect(picker).toContain('name: "团建"');
    expect(picker).toContain('<th>发布状态</th>');
    expect(picker).toContain('<th>状态</th>');
    expect(picker).not.toContain('<th>来源</th>');
    expect(picker).toContain('2026-04-12 09:00');
    expect(picker).toContain('2026-04-12 17:00');
    expect(picker).toContain('已结束');
    expect(picker).toContain('未结束');
    expect(picker).toContain('data-el="life"');
    expect(picker).toContain('option value="未结束">未结束');
    expect(picker).toContain('if (life !== "all") rows = rows.filter((r) => r.life === life)');
    expect(picker).toContain('r.timeText');
    for (const act of initialInterestGroupActivities) {
      expect(picker).toContain(formatInterestGroupActivityTime(act));
    }
    expect(picker).toContain('const IG_TREE');
    expect(picker).toContain('name: "运动健身"');
    expect(picker).toContain('name: "学习充电"');
    expect(picker).toContain('name: "职场成长"');
    expect(picker).toContain('name: "公益志愿"');
    expect(picker).toContain('name: "桌游电竞"');
    expect(picker).toContain('categoryKey: "sport"');
    expect(picker).toContain('getSource() === "ig" ? IG_TREE : ACT_TREE');
    expect(picker).toContain('r.categoryKey === cat');
    expect(picker).toContain('所属小组');
    expect(picker).toContain('groupName: "城市夜跑团"');
    expect(picker).toContain('groupName: "周末徒步野行"');
    expect(picker).toContain('groupName: "深夜读书会"');
    expect(picker).toContain('groupName: "桌游电竞局"');
    expect(picker).toContain('groupName: "午间拉伸站"');
    expect(picker).toContain('groupName: "周末胶片社"');
    expect(picker).toContain('escapeHtml(r.groupName');
  });

  it('活动 source hides 所属小组 in custom picker; 兴趣圈活动 keeps it', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    expect(picker).toContain('function showBelongCol');
    expect(picker).toMatch(/function showBelongCol\(\) \{\s*if \(isMoments\) return true;/);
    expect(picker).toMatch(/getSource\(\) === "ig"/);
    expect(picker).toContain('belong.hidden = !showBelongCol()');
  });

  it('activity-picker.js parses so 添加活动 modal can mount', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    expect(() => new Function(picker)).not.toThrow();
  });

  it('投票 inspector omits 选择投票 row; 添加投票 opens vote list modal', () => {
    expect(html).toMatch(/const pickRowHtml = \(id === "vote" \|\| id === "groups"\) \? "" :/);
    expect(html).toMatch(/if \(id === "vote"\) \{\s*votePicker\.open\(\);\s*return;\s*\}/);
    expect(html).toContain('const votePicker = mountVotePicker({');
    expect(html).toContain('appState.vote.picked');
  });

  it('兴趣圈 inspector omits 跳转链接 and 选择兴趣圈; 添加兴趣圈 opens group list modal', () => {
    expect(html).toMatch(/const hideJump = id === "groups"/);
    expect(html).toMatch(/if \(id === "groups"\) \{\s*groupPicker\.open\(\);\s*return;\s*\}/);
    expect(html).toContain('const groupPicker = mountGroupPicker({');
    expect(html).toContain('appState.groups.picked');
  });

  it('group picker lists interest groups with 分类 and 成员', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    expect(picker).toContain('function mountGroupPicker(');
    expect(picker).toContain('const GROUP_CATALOG');
    expect(picker).toContain('城市夜跑团');
    expect(picker).toContain('周末徒步野行');
    expect(picker).toContain('深夜读书会');
    expect(picker).toContain('桌游电竞局');
    expect(picker).toContain('午间拉伸站');
    expect(picker).toContain('周末胶片社');
    expect(picker).toContain('选择兴趣圈');
    expect(picker).toContain('<th>分类</th>');
    expect(picker).toContain('<th>成员</th>');
    expect(picker).toContain('global.mountGroupPicker = mountGroupPicker');
  });

  it('vote picker lists votes with 投票时间 and 状态', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    expect(picker).toContain('function mountVotePicker(');
    expect(picker).toContain('const VOTE_CATALOG');
    expect(picker).toContain('部门十佳员工评选');
    expect(picker).toContain('车间安全之星');
    expect(picker).toContain('年度优秀作品展');
    expect(picker).toContain('食堂本周菜品');
    expect(picker).toContain('班组擂台赛');
    expect(picker).toContain('一线匠心人物');
    expect(picker).toContain('选择投票');
    expect(picker).toContain('<th>投票时间</th>');
    expect(picker).toContain('<th>状态</th>');
    expect(picker).toContain('is-flat');
    expect(picker).toContain('global.mountVotePicker = mountVotePicker');
  });

  it('精彩瞬间 picker uses 活动时间 and 发布状态+状态', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    expect(picker).not.toContain('提交时间');
    expect(picker).toContain('const timeLabel = "活动时间"');
    expect(picker).not.toMatch(/const pubFilter = isMoments/);
    expect(picker).not.toMatch(/const pubCol = isMoments/);
    expect(picker).toContain('<label class="fl">发布状态');
    expect(picker).toContain('<th>发布状态</th>');
    expect(picker).toContain('<th>状态</th>');
    expect(picker).toContain('if (status !== "all") rows = rows.filter((r) => r.status === status)');
    expect(picker).not.toContain('if (!isMoments && status !== "all")');
  });

  it('精彩瞬间 picker 活动时间 shows full start and end', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    const momentBlock = picker.slice(picker.indexOf('const MOMENT_CATALOG'), picker.indexOf('const ACT_TREE'));
    expect(momentBlock).toMatch(/id: "act-m-1"[\s\S]*?startAt: "2026-04-12 09:00"[\s\S]*?endAt: "2026-04-12 17:00"/);
    expect(momentBlock).toMatch(/id: "act-m-5"[\s\S]*?startAt: "2026-08-31 09:30"[\s\S]*?endAt: "2026-09-02 17:30"/);
    expect(momentBlock).toContain('timeText: "2026-06-01 17:00 ~ 2026-06-01 19:00"');
    expect(momentBlock).toContain('timeText: "2026-06-04 19:30 ~ 2026-09-24 21:00 · 共 17 场"');
    expect(momentBlock).toContain('timeText: "2026-08-31 09:00 ~ 2026-09-10 16:00 · 共 2 场"');
    expect(momentBlock).not.toContain('startAt: "2026-04-12 10:20:00"');
  });
});
