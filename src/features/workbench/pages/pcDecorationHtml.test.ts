import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const html = readFileSync(join(__dirname, '../../../../public/decoration/pc.html'), 'utf8');

describe('PC 装修工作台应用组件', () => {
  it('应用组件库包含 活动/兴趣圈/精彩瞬间/投票', () => {
    expect(html).toContain('{ name: "活动"');
    expect(html).toContain('{ name: "兴趣圈"');
    expect(html).toContain('{ name: "精彩瞬间"');
    expect(html).toContain('{ name: "投票"');
    expect(html).not.toContain('兴趣小组');
  });

  it('引入 activity-picker.js 提供选择弹窗', () => {
    expect(html).toContain('<script src="activity-picker.js"></script>');
  });

  it('画布包含四个组件的挂载位', () => {
    ['activity', 'moments', 'groups', 'vote'].forEach((id) => {
      expect(html).toContain(`id="${id}Wrap"`);
      expect(html).toContain(`id="${id}Preview"`);
    });
  });

  it('APP_BLOCKS 定义四个组件的默认配置', () => {
    expect(html).toContain('id="paneApp"');
    expect(html).toMatch(/id: "activity", lib: "活动"/);
    expect(html).toMatch(/id: "moments", lib: "精彩瞬间"/);
    expect(html).toMatch(/id: "groups", lib: "兴趣圈"/);
    expect(html).toMatch(/id: "vote", lib: "投票"/);
  });

  it('仅兴趣圈省略跳转链接；活动/精彩瞬间跳转链接为固定下拉', () => {
    expect(html).toMatch(/const hideJump = id === "groups"/);
    expect(html).toContain('function mountMomentsJumpDrop');
    expect(html).toContain('活动-精彩瞬间');
    expect(html).toContain('兴趣圈-精彩瞬间');
  });

  it('活动跳转链接下拉参考 H5：活动 / 兴趣圈活动', () => {
    expect(html).toContain('function mountActivityJumpDrop');
    expect(html).toMatch(/mountActivityJumpDrop[\s\S]{0,300}?\{ label: "活动", value: "activity" \}/);
    expect(html).toMatch(/mountActivityJumpDrop[\s\S]{0,300}?\{ label: "兴趣圈活动", value: "ig" \}/);
    expect(html).toMatch(/if \(id === "activity"\) mountActivityJumpDrop/);
  });

  it('跳转链接与查看更多在同一卡片区域（blk-item 而非独立 blk）', () => {
    expect(html).toMatch(/jumpRowHtml = hideJump \? "" : `<div class="blk-item" data-app-jump-row>/);
    const paneStart = html.indexOf('paneApp.innerHTML');
    const paneEnd = html.indexOf('展示样式', paneStart);
    const seg = html.slice(paneStart, paneEnd);
    const moreIdx = seg.indexOf('data-app-more-row');
    const jumpIdx = seg.indexOf('${jumpRowHtml}');
    expect(moreIdx).toBeGreaterThan(-1);
    expect(jumpIdx).toBeGreaterThan(moreIdx);
    const between = seg.slice(moreIdx, jumpIdx);
    expect(between.match(/<\/div>/g)).toHaveLength(2); // 仅关闭 inline 与 more-row blk-item，无独立 blk 边界
  });

  it('投票/兴趣圈省略选择xx行；活动/精彩瞬间使用来源下拉', () => {
    expect(html).toMatch(/const pickRowHtml = \(id === "vote" \|\| id === "groups"\) \? "" :/);
    expect(html).toContain('function mountActivitySourceDrop');
    expect(html).toContain('兴趣圈活动');
  });

  it('添加按钮打开对应选择弹窗', () => {
    expect(html).toMatch(/if \(id === "activity"\) \{\s*activityPicker\.open\(\);/);
    expect(html).toMatch(/if \(id === "moments"\) \{\s*momentPicker\.open\(\);/);
    expect(html).toMatch(/if \(id === "vote"\) \{\s*votePicker\.open\(\);/);
    expect(html).toMatch(/if \(id === "groups"\) \{\s*groupPicker\.open\(\);/);
  });

  it('实例化四个 picker 并绑定各自 state', () => {
    expect(html).toContain('const activityPicker = mountActivityPicker({');
    expect(html).toMatch(/const momentPicker = mountActivityPicker\(\{\s*kind: "moments"/);
    expect(html).toContain('const votePicker = mountVotePicker({');
    expect(html).toContain('const groupPicker = mountGroupPicker({');
    ['activity', 'moments', 'vote', 'groups'].forEach((id) => {
      expect(html).toContain(`appState.${id}.picked`);
    });
  });

  it('提供 picker 弹窗所需样式', () => {
    expect(html).toContain('.pick-mask{');
    expect(html).toContain('.pick-body.is-flat');
    expect(html).toContain('.pick-sel-list');
  });
});
