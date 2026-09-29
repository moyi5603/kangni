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

  it('兴趣圈、即时激励、勋章排行省略跳转链接; 活动/精彩瞬间均有', () => {
    expect(html).toMatch(/const hideJump = id === "groups" \|\| id === "incentive" \|\| id === "medalRank"/);
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
    expect(html).toMatch(/const pickRowHtml = \(id === "vote" \|\| id === "groups" \|\| id === "incentive" \|\| id === "medalRank" \|\| id === "forum" \|\| id === "mailbox"\) \? "" :/);
    expect(html).not.toContain('选择内容');
    expect(html).not.toContain('mountIncentiveSourceDrop');
    expect(html).toMatch(/if \(id === "vote"\) \{\s*votePicker\.open\(\);\s*return;\s*\}/);
    expect(html).toContain('const votePicker = mountVotePicker({');
    expect(html).toContain('appState.vote.picked');
  });

  it('兴趣圈 inspector omits 跳转链接 and 选择兴趣圈; 添加兴趣圈 opens group list modal', () => {
    expect(html).toMatch(/const hideJump = id === "groups" \|\| id === "incentive" \|\| id === "medalRank"/);
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

  it('adds 关怀 即时激励 论坛 信箱 after 投票 with list defaults', () => {
    expect(html).toMatch(/items:\s*\[.*"文章".*"调查问卷".*"课程".*"活动".*"精彩瞬间".*"兴趣圈".*"投票".*"关怀".*"即时激励".*"勋章排行".*"论坛".*"信箱".*\]/);
    expect(html).toMatch(/id:\s*"care"[\s\S]*?lib:\s*"关怀"[\s\S]*?title:\s*"关怀"[\s\S]*?more:\s*"查看全部"[\s\S]*?style:\s*"left"[\s\S]*?count:\s*3[\s\S]*?max:\s*20/);
    expect(html).toMatch(/id:\s*"incentive"[\s\S]*?title:\s*"认可动态"[\s\S]*?style:\s*"left"[\s\S]*?count:\s*5[\s\S]*?max:\s*20/);
    expect(html).toMatch(/id:\s*"medalRank"[\s\S]*?lib:\s*"勋章排行"[\s\S]*?title:\s*"勋章排行"[\s\S]*?style:\s*"left"[\s\S]*?count:\s*5/);
    expect(html).toMatch(/id:\s*"forum"[\s\S]*?title:\s*"论坛"[\s\S]*?style:\s*"left"[\s\S]*?count:\s*5/);
    expect(html).toMatch(/id:\s*"mailbox"[\s\S]*?title:\s*"信箱"[\s\S]*?style:\s*"left"[\s\S]*?count:\s*5/);
    for (const id of ['care', 'incentive', 'medalRank', 'forum', 'mailbox']) {
      expect(html).toContain(`id="${id}Wrap"`);
      expect(html).toContain(`id="${id}Preview"`);
    }
  });

  it('keeps 封面 and 头像 out of field settings and shows them from style', () => {
    const care = html.slice(html.indexOf('id: "care"'), html.indexOf('id: "incentive"'));
    const incentive = html.slice(html.indexOf('id: "incentive"'), html.indexOf('id: "forum"'));
    const forum = html.slice(html.indexOf('id: "forum"'), html.indexOf('id: "mailbox"'));
    const mailbox = html.slice(html.indexOf('id: "mailbox"'), html.indexOf('];', html.indexOf('id: "mailbox"')));
    expect(care).toContain('["showType","类型"]');
    expect(care).toContain('["showBlessing","祝福"]');
    expect(care).toContain('["showDate","日期"]');
    expect(care).not.toContain('发送人');
    expect(care).not.toContain('时间');
    expect(incentive).toContain('["showMedal","勋章"]');
    expect(incentive).toContain('["showReceiver","被认可人"]');
    expect(forum).toContain('["showPostTitle","帖子名称"],["showDesc","描述"],["showAuthor","发帖人"],["showTime","时间"],["showCommentCount","评论数"],["showLikeCount","点赞数"],["showFavoriteCount","收藏数"],["showViewCount","浏览数"]');
    expect(forum).not.toContain('帖子数');
    expect(forum).not.toContain('简介');
    expect(mailbox).toContain('["showHandler","负责人"]');
    for (const block of [care, incentive, forum, mailbox]) {
      expect(block).not.toContain('头像');
      expect(block).not.toContain('封面');
      expect(block).not.toContain('图标');
    }
    expect(html).toContain('function appMedia');
    expect(html).toMatch(/if \(style === "title"\) return ""/);
    expect(html).toContain('ph-avatar');
    expect(html).toContain('ph-icon');
    expect(html).toMatch(/id === "forum"[\s\S]{0,80}ph-icon/);
  });

  it('关怀 picker only lists the three personal care types', () => {
    const picker = readFileSync(join(dir, '../../../../public/decoration/activity-picker.js'), 'utf8');
    const care = picker.slice(picker.indexOf('const CARE_CATALOG'), picker.indexOf('const INCENTIVE_CATALOG'));
    expect(care).toContain('生日关怀');
    expect(care).toContain('周年关怀');
    expect(care).not.toContain('周年庆关怀');
    expect(care).toContain('入党关怀');
    expect(care).not.toContain('节日关怀');
    expect(care).not.toContain('节气关怀');
    expect(care).not.toContain('天气关怀');
    expect(care).toContain('date: "2026-08-26"');
    expect(care).not.toMatch(/\d{2}:\d{2}/);
    const carePicker = picker.slice(picker.indexOf('function mountCarePicker'), picker.indexOf('function mountIncentivePicker'));
    expect(carePicker).toContain('{ key: "date", label: "日期" }');
    expect(carePicker).not.toContain('发送人');
    expect(carePicker).not.toContain('时间');
    const forumPicker = picker.slice(picker.indexOf('function mountForumPicker'), picker.indexOf('function mountMailboxPicker'));
    expect(forumPicker).toContain('{ key: "postTitle", label: "帖子名称" }');
    expect(forumPicker).toContain('{ key: "desc", label: "描述" }');
    expect(forumPicker).toContain('{ key: "author", label: "发帖人" }');
    expect(forumPicker).toContain('{ key: "time", label: "时间" }');
    expect(forumPicker).toContain('{ key: "commentCount", label: "评论数" }');
    expect(forumPicker).toContain('{ key: "likeCount", label: "点赞数" }');
    expect(forumPicker).toContain('{ key: "favoriteCount", label: "收藏数" }');
    expect(forumPicker).toContain('{ key: "viewCount", label: "浏览数" }');
    expect(forumPicker).not.toContain('帖子数');
    expect(picker).toContain('function mountCarePicker');
    expect(picker).toContain('global.mountCarePicker = mountCarePicker');
    expect(html).toContain('carePicker.open()');
    expect(html).toContain('function mountCareSourceDrop');
    expect(html).toMatch(/mountCareSourceDrop\(document\.getElementById\("appPickChain"\), st\)/);
    expect(html).toMatch(/label: "生日关怀", value: "生日关怀"/);
    expect(html).toMatch(/label: "周年关怀", value: "周年关怀"/);
    expect(html).toMatch(/label: "入党关怀", value: "入党关怀"/);
    const incentiveCatalog = picker.slice(picker.indexOf('const INCENTIVE_CATALOG'), picker.indexOf('const MEDAL_RANK_CATALOG'));
    expect(incentiveCatalog).not.toContain('勋章排行');
    const rankCatalog = picker.slice(picker.indexOf('const MEDAL_RANK_CATALOG'), picker.indexOf('const FORUM_CATALOG'));
    expect(rankCatalog).toContain('rank: "1"');
    expect(rankCatalog).toContain('medal: "协作之星"');
    expect(rankCatalog).toContain('person: "陈晨"');
    expect(rankCatalog).toContain('count: "12"');
    const rankPicker = picker.slice(picker.indexOf('function mountMedalRankPicker'), picker.indexOf('function mountForumPicker'));
    expect(rankPicker).toContain('{ key: "rank", label: "排名" }');
    expect(rankPicker).toContain('{ key: "medal", label: "勋章" }');
    expect(rankPicker).toContain('{ key: "person", label: "姓名" }');
    expect(rankPicker).toContain('{ key: "count", label: "获得次数" }');
    expect(html).toContain('medalRankPicker.open()');
    const rankBlock = html.slice(html.indexOf('id: "medalRank"'), html.indexOf('id: "forum"'));
    expect(rankBlock).toContain('["showRank","排名"],["showMedal","勋章"],["showName","姓名"],["showGainCount","获得次数"]');
    expect(html).toContain('incentivePicker.open()');
    expect(html).toContain('forumPicker.open()');
    expect(html).toContain('mailboxPicker.open()');
  });
});
