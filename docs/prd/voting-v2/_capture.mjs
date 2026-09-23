import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, 'screenshots');
const BASE = 'http://localhost:5173';

async function shot(page, name, locator) {
  const path = join(out, `${name}.png`);
  try {
    if (locator) {
      const el = locator.first();
      if (await el.isVisible({ timeout: 2500 })) {
        await el.screenshot({ path, timeout: 8000 });
        console.log('ok', name);
        return;
      }
    }
  } catch (err) {
    console.warn('fallback-full', name, String(err.message || err).slice(0, 120));
  }
  await page.screenshot({ path, fullPage: true });
  console.log('page', name);
}

async function gotoHash(page, hash, waitText) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle' });
  if (waitText) {
    await page.getByText(waitText).first().waitFor({ timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
await mkdir(out, { recursive: true });

const admin = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const ap = await admin.newPage();
ap.setDefaultTimeout(20000);

await gotoHash(ap, '#/voting-v2/vote-v2-overview', '概览');
await shot(ap, '投票概览-页面整体');
await shot(ap, '投票应用-左侧菜单', ap.locator('.ant-layout-sider').first());
await shot(ap, '投票概览-KPI指标卡', ap.locator('.overview-kpi-grid').first());
await shot(ap, '投票概览-进行中表格', ap.locator('.ant-card').filter({ hasText: '进行中的投票' }).first());

await gotoHash(ap, '#/voting-v2/vote-v2-layout', '装修');
await shot(ap, '投票装修-移动端工作台');
await shot(ap, '投票装修-组件面板', ap.locator('.deco-palette, [class*="palette"]').first());

await gotoHash(ap, '#/voting-v2/vote-v2-layout-pc', '装修');
await shot(ap, '投票装修-PC工作台');

await gotoHash(ap, '#/voting-v2/vote-v2-list', '投票管理');
await shot(ap, '投票管理-页面整体');
await shot(ap, '投票管理-查询筛选', ap.locator('.search-card').first());
await shot(ap, '投票管理-查询筛选区', ap.locator('.search-card').first());
await shot(ap, '投票管理-列表表格', ap.locator('.ant-table').first());
await shot(ap, '投票管理-工具栏新增', ap.getByRole('button', { name: '新增' }).first());

async function openRowMore(page, campaignName) {
  await page.getByRole('button', { name: new RegExp(`更多操作 ${campaignName}`) }).click({ force: true });
  await page.waitForTimeout(250);
}

try {
  await openRowMore(ap, '部门十佳员工评选');
  await ap.getByRole('menuitem', { name: '分享' }).click({ force: true });
  await ap.getByRole('dialog').waitFor({ timeout: 8000 });
  await shot(ap, '投票管理-分享弹窗', ap.getByRole('dialog'));
  await ap.keyboard.press('Escape');
  await ap.getByRole('dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
} catch (err) {
  console.warn('share-modal', err.message);
  await shot(ap, '投票管理-分享弹窗');
}

try {
  await openRowMore(ap, '车间安全之星');
  await ap.getByRole('menuitem', { name: '删除' }).hover();
  await ap.waitForTimeout(500);
  await shot(ap, '投票管理-进行中删除禁用Tooltip', ap.locator('.ant-tooltip:visible').first());
  await ap.keyboard.press('Escape');
  await ap.mouse.move(0, 0);
} catch (err) {
  console.warn('delete-tooltip', err.message);
  await shot(ap, '投票管理-进行中删除禁用Tooltip');
}

try {
  await openRowMore(ap, '部门十佳员工评选');
  await ap.getByRole('menuitem', { name: '删除' }).click({ force: true });
  await ap.getByRole('dialog').waitFor({ timeout: 8000 });
  await shot(ap, '投票管理-删除确认弹窗', ap.getByRole('dialog').last());
  await ap.keyboard.press('Escape');
  await ap.getByRole('dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
} catch (err) {
  console.warn('delete-confirm', err.message);
  await shot(ap, '投票管理-删除确认弹窗');
}

await ap.locator('.ant-table-tbody .ant-table-row').first().getByRole('checkbox').check({ force: true });
await ap.waitForTimeout(300);
await shot(ap, '投票管理-批量操作条', ap.locator('.batch-toolbar, .ant-flex').filter({ hasText: '已选择' }).first());
const clearSel = ap.getByRole('button', { name: '取消选择' });
if (await clearSel.count()) await clearSel.click({ force: true });

await gotoHash(ap, '#/voting-v2/vote-v2-create', '新建活动');
await shot(ap, '新建活动-页面整体');
await shot(ap, '新建活动-手机预览', ap.locator('.vote-v2-phone, [class*="vote-v2-phone"]').first());
await shot(ap, '新建活动-基本设置', ap.locator('.ant-card').filter({ hasText: '1、基本设置' }).first());
await shot(ap, '新建活动-底部操作', ap.locator('.vote-v2-form-actions').first());

await ap.getByRole('tab', { name: '样式设置' }).click();
await ap.waitForTimeout(300);
await shot(ap, '新建活动-样式设置', ap.locator('.ant-card').filter({ hasText: '2、样式设置' }).first());

await ap.getByRole('tab', { name: '功能设置' }).click();
await ap.waitForTimeout(300);
await shot(ap, '新建活动-功能设置-分组', ap.locator('.ant-card').filter({ hasText: '投票分组' }).first());
await shot(ap, '新建活动-功能设置-参与范围', ap.locator('.ant-card').filter({ hasText: '参与范围' }).first());
await shot(ap, '新建活动-功能设置-投票规则', ap.locator('.ant-card').filter({ hasText: '投票规则设置' }).first());
await ap.getByText('按部门').click();
await ap.waitForTimeout(200);
await shot(ap, '新建活动-按部门选择', ap.locator('.ant-card').filter({ hasText: '参与范围' }).first());
await ap.getByText('全员').click();

await ap.getByRole('button', { name: '保存并发布' }).click();
await ap.waitForTimeout(400);
await ap.getByRole('tab', { name: '基本设置' }).click();
await ap.waitForTimeout(300);
await shot(ap, '新建活动-校验失败');

await gotoHash(ap, '#/voting-v2/vote-v2-edit/2', '编辑活动');
await shot(ap, '编辑活动-进行中页面', ap.locator('.page-stack').first());
await shot(ap, '编辑活动-进行中名称锁定', ap.locator('.ant-form-item').filter({ hasText: '活动名称' }).first());

await gotoHash(ap, '#/voting-v2/vote-v2-detail/2', '活动详情');
await shot(ap, '活动详情-页面整体');
await shot(ap, '活动详情-去编辑返回', ap.locator('.ant-space').filter({ hasText: '去编辑' }).first());
await shot(ap, '活动详情-页签', ap.locator('.ant-tabs-nav').first());

await gotoHash(ap, '#/voting-v2/vote-v2-detail/2/results', '投票结果');
await shot(ap, '活动详情-投票结果Tab');
await shot(ap, '活动详情-投票结果表格', ap.locator('.ant-table').first());

await gotoHash(ap, '#/voting-v2/vote-v2-detail/3/records', '投票记录');
await shot(ap, '活动详情-投票记录Tab');
await shot(ap, '活动详情-投票记录导出', ap.locator('.table-toolbar').first());

await gotoHash(ap, '#/voting-v2/vote-v2-edit/3', '编辑活动');
await shot(ap, '编辑活动-已结束只读', ap.locator('.vote-v2-form-actions').first());

await gotoHash(ap, '#/voting-v2/vote-v2-players/2', '选项管理');
await shot(ap, '选项管理-页面整体');
await shot(ap, '选项管理-查询筛选', ap.locator('.page-stack > *').filter({ hasText: '关键词' }).first());
await shot(ap, '选项管理-列表表格', ap.locator('.ant-table').first());
await shot(ap, '选项管理-工具栏', ap.locator('.list-table-card, .page-stack').locator('.ant-space').filter({ hasText: '添加选项' }).first());

await ap.getByRole('button', { name: '添加选项' }).click({ force: true });
try {
  await ap.locator('.ant-drawer').filter({ hasText: '选项标题' }).waitFor({ timeout: 8000 });
  await shot(ap, '选项管理-添加选项抽屉', ap.locator('.ant-drawer').filter({ hasText: '选项标题' }).last());
  await ap.keyboard.press('Escape');
  await ap.locator('.ant-drawer').filter({ hasText: '选项标题' }).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
} catch (err) {
  console.warn('add-drawer', err.message);
  await shot(ap, '选项管理-添加选项抽屉');
}

try {
  await ap.getByRole('button', { name: '详情 张工' }).first().click({ force: true });
  await ap.locator('.ant-drawer').waitFor({ timeout: 8000 });
  await shot(ap, '选项管理-选项详情抽屉', ap.locator('.ant-drawer').last());
  await ap.locator('.ant-drawer-extra, .ant-drawer-header').getByRole('button', { name: '编辑' }).click({ force: true });
  await ap.waitForTimeout(300);
  await shot(ap, '选项管理-编辑选项抽屉', ap.locator('.ant-drawer').last());
  await ap.keyboard.press('Escape');
  await ap.waitForTimeout(300);
} catch (err) {
  console.warn('player-drawer', err.message);
  await shot(ap, '选项管理-选项详情抽屉');
  await shot(ap, '选项管理-编辑选项抽屉');
}

try {
  await ap.getByRole('button', { name: '删除 张工' }).first().click({ force: true });
  await ap.getByText('删除选项').first().waitFor({ timeout: 5000 });
  await shot(ap, '选项管理-删除确认弹窗', ap.getByRole('dialog').last());
  await ap.keyboard.press('Escape');
} catch (err) {
  console.warn('player-delete', err.message);
  await shot(ap, '选项管理-删除确认弹窗');
}

try {
  await ap.getByRole('button', { name: '批量导入' }).click({ force: true });
  await ap.getByRole('dialog').waitFor({ timeout: 8000 });
  await shot(ap, '选项管理-批量导入弹窗', ap.getByRole('dialog').last());
  await shot(ap, '选项管理-批量导入表格', ap.getByRole('dialog').last());
  await ap.keyboard.press('Escape');
} catch (err) {
  console.warn('player-import', err.message);
  await shot(ap, '选项管理-批量导入弹窗');
  await shot(ap, '选项管理-批量导入表格');
}

await gotoHash(ap, '#/voting-v2/vote-v2-players/6', '选项管理');
await shot(ap, '选项管理-空状态', ap.locator('.ant-empty').first());

await ap.close();
await admin.close();

const h5 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const hp = await h5.newPage();
hp.setDefaultTimeout(20000);

await gotoHash(hp, '#/c/h5/votes-v2', '投票');
await shot(hp, 'H5投票列表-进行中');
await shot(hp, 'H5投票列表-顶栏', hp.locator('.c-h5-top, .c-h5-header').first());
await shot(hp, 'H5投票列表-轮播', hp.locator('.c-home-banner, .home-banner, [class*="banner"]').first());
await shot(hp, 'H5投票列表-状态Tab', hp.locator('.c-tabs, .c-catalog-toolbar').first());
await shot(hp, 'H5投票列表-卡片', hp.locator('.c-h5-list, .c-h5-vote-card').first());

await hp.getByRole('button', { name: '未开始' }).click();
await hp.waitForTimeout(200);
await shot(hp, 'H5投票列表-未开始');

await hp.getByRole('button', { name: '已结束' }).click();
await hp.waitForTimeout(200);
await shot(hp, 'H5投票列表-已结束');

await gotoHash(hp, '#/c/h5/vote-v2-4', '食堂本周菜品');
await shot(hp, 'H5投票首页-单选进行中');
await shot(hp, 'H5投票首页-选手卡片', hp.locator('.vote-v2-phone-card, [class*="contestant"], .vote-v2-phone-grid').first());

try {
  await hp.getByRole('button', { name: '投票' }).first().tap();
  await hp.getByText('投票成功').waitFor({ timeout: 5000 });
  await shot(hp, 'H5投票成功弹窗', hp.locator('.c-vote-v2-success, [role="dialog"]').first());
  await hp.getByRole('button', { name: '确定' }).click({ force: true }).catch(() => {});
} catch (err) {
  console.warn('vote-success-miss', err.message);
  await shot(hp, 'H5投票成功弹窗');
}

await gotoHash(hp, '#/c/h5/vote-v2-2', '车间安全之星');
await shot(hp, 'H5投票首页-多选进行中');
await shot(hp, 'H5投票首页-多选已选底栏');

await gotoHash(hp, '#/c/h5/vote-v2-2/option-1', '张工');
await shot(hp, 'H5选项详情-页面整体');
await shot(hp, 'H5选项详情-底部投票', hp.locator('.c-h5-cta-bar').first());

await gotoHash(hp, '#/c/h5/vote-v2-3', '年度优秀作品展');
await shot(hp, 'H5投票首页-已结束');

await gotoHash(hp, '#/c/h5/vote-v2-1', '部门十佳员工评选');
await shot(hp, 'H5投票首页-未开始');

await gotoHash(hp, '#/c/h5/vote-v2-5', '评选活动');
await shot(hp, 'H5投票首页-不在范围内');

await gotoHash(hp, '#/c/h5/vote-v2-7', '静默结果页');
await shot(hp, 'H5投票首页-页面显示关闭');

await gotoHash(hp, '#/c/h5/votes-v2/mine', '我的投票记录');
await shot(hp, 'H5我的记录-列表');

await hp.close();
await h5.close();

const pc = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
const pp = await pc.newPage();
pp.setDefaultTimeout(20000);

await gotoHash(pp, '#/c/pc/votes-v2', '投票');
await shot(pp, 'PC投票列表-页面整体');
await shot(pp, 'PC投票列表-轮播', pp.locator('.c-home-banner, .home-banner, [class*="banner"]').first());
await shot(pp, 'PC投票列表-状态Tab', pp.locator('.c-catalog-toolbar, .c-tabs').first());
await shot(pp, 'PC投票列表-卡片网格', pp.locator('.c-pc-vote-grid').first());

await gotoHash(pp, '#/c/pc/vote-v2-4', '食堂本周菜品');
await shot(pp, 'PC投票首页-进行中');

await gotoHash(pp, '#/c/pc/vote-v2-2/option-1', '张工');
await shot(pp, 'PC选项详情-侧栏投票');
await shot(pp, 'PC选项详情-侧栏', pp.locator('.c-pc-side').first());

await gotoHash(pp, '#/c/pc/votes-v2/mine', '我的投票记录');
await shot(pp, 'PC我的记录-列表');

await gotoHash(pp, '#/c', 'C 端预览');
await shot(pp, 'C端门户-投票入口', pp.locator('.c-portal-main').first());

await pp.close();
await pc.close();
await browser.close();
console.log('done');
