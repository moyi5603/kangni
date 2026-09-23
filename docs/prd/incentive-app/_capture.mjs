import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'screenshots');
const BASE = 'http://127.0.0.1:5173/';

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const shots = [];

async function shot(page, name, locator) {
  const file = `${name}.png`;
  const path = join(OUT, file);
  try {
    if (locator) {
      const el = locator.first();
      if (await el.isVisible({ timeout: 2500 })) {
        await el.screenshot({ path, timeout: 8000 });
        shots.push(file);
        console.log('ok', file);
        return;
      }
    }
  } catch (err) {
    console.log('fallback', file, String(err.message || err).slice(0, 100));
  }
  await page.screenshot({ path, fullPage: false });
  shots.push(file);
  console.log('page', file);
}

async function goto(page, hash, waitMs = 900) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitMs);
}

const admin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const ap = await admin.newPage();

await goto(ap, '#/incentive/incentive-dashboard');
await shot(ap, '后台-概览-页面整体');
await shot(ap, '即时激励-左侧菜单', ap.locator('.ant-layout-sider').first());
await shot(ap, '后台-概览-KPI指标卡', ap.locator('.overview-kpi-grid').first());
await shot(ap, '后台-概览-统计周期', ap.locator('.ant-picker, .overview-date-range').first());
await shot(ap, '后台-概览-发放状态分布', ap.locator('.overview-chart-card', { hasText: '发放状态分布' }).first());
await shot(ap, '后台-概览-勋章分布', ap.locator('.overview-chart-card', { hasText: '勋章分布' }).first());
await shot(ap, '后台-概览-待办关注', ap.locator('.ant-card', { hasText: '待办关注' }).first());
await shot(ap, '后台-概览-近期发放', ap.locator('.ant-card', { hasText: '近期发放' }).first());

const pendingLink = ap.getByRole('button', { name: /详情/ }).first();
if (await pendingLink.count()) {
  await pendingLink.click();
  await ap.waitForTimeout(500);
  await shot(ap, '后台-概览-认可详情抽屉', ap.locator('.ant-drawer-content').last());
  await ap.keyboard.press('Escape');
  await ap.waitForTimeout(300);
}

await goto(ap, '#/incentive/incentive-badges');
await shot(ap, '后台-勋章管理-页面整体');
await shot(ap, '后台-勋章管理-归属Tabs', ap.locator('.incentive-badge-tabs').first());
await shot(ap, '后台-勋章管理-勋章目录', ap.locator('.incentive-badge-card').first());
await shot(ap, '后台-勋章管理-标题操作', ap.locator('.incentive-badge-tabs .ant-tabs-extra-content, .ant-tabs-nav-extra').first());

const taxBtn = ap.getByRole('button', { name: '归属与分类管理' });
if (await taxBtn.count()) {
  await taxBtn.click();
  await ap.waitForTimeout(500);
  await shot(ap, '后台-勋章管理-分类抽屉', ap.locator('.ant-drawer-content').last());
  await ap.keyboard.press('Escape');
  await ap.waitForTimeout(300);
}

await goto(ap, '#/incentive/incentive-badge-create');
await shot(ap, '后台-新建勋章-表单页');
await shot(ap, '后台-新建勋章-图标上传', ap.locator('.ant-upload').first());
await shot(ap, '后台-新建勋章-底栏操作', ap.locator('.sticky-form-actions').first());

await goto(ap, '#/incentive/incentive-badge-edit/b1');
await shot(ap, '后台-编辑勋章-表单页');

await goto(ap, '#/incentive/incentive-records');
await shot(ap, '后台-发放记录-页面整体');
await shot(ap, '后台-发放记录-查询筛选', ap.locator('.search-panel, form').first());
await shot(ap, '后台-发放记录-列表表格', ap.locator('.ant-table').first());
await shot(ap, '后台-发放记录-工具栏', ap.locator('.list-table-card .ant-flex, .ant-card-head').first());

const commendBtn = ap.getByRole('button', { name: '发布公司表彰' });
if (await commendBtn.count()) {
  await commendBtn.click();
  await ap.waitForTimeout(600);
  await shot(ap, '后台-发放记录-发布表彰抽屉', ap.locator('.ant-drawer-content').last());
  await ap.keyboard.press('Escape');
  await ap.waitForTimeout(300);
}

const detailBtn = ap.getByRole('button', { name: '详情' }).first();
if (await detailBtn.count()) {
  await detailBtn.click();
  await ap.waitForTimeout(500);
  await shot(ap, '后台-发放记录-认可详情', ap.locator('.ant-drawer-content').last());
  const rejectBtn = ap.getByRole('button', { name: '驳回' });
  if (await rejectBtn.count()) {
    await rejectBtn.click();
    await ap.waitForTimeout(400);
    await shot(ap, '后台-发放记录-驳回弹窗', ap.locator('.ant-modal').last());
    await ap.keyboard.press('Escape');
  }
  await ap.keyboard.press('Escape');
  await ap.waitForTimeout(300);
}

const withdrawBtn = ap.getByRole('button', { name: '撤回' }).first();
if (await withdrawBtn.count()) {
  await withdrawBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-发放记录-撤回确认', ap.locator('.ant-modal, .ant-popover').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/incentive/incentive-settings');
await shot(ap, '后台-规则设置-积分设置');
await shot(ap, '后台-规则设置-额度表格', ap.locator('.ant-table').first());
await shot(ap, '后台-规则设置-查询筛选', ap.locator('.search-panel, form').first());

const addQuota = ap.getByRole('button', { name: '新增' });
if (await addQuota.count()) {
  await addQuota.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-规则设置-新增额度弹窗', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/incentive/incentive-settings?tab=content');
await shot(ap, '后台-规则设置-填写设置');

await goto(ap, '#/incentive/incentive-settings?tab=risk');
await shot(ap, '后台-规则设置-风控设置');
await shot(ap, '后台-规则设置-审核设置', ap.locator('.ant-card', { hasText: '审核设置' }).first());
await shot(ap, '后台-规则设置-异常监控', ap.locator('.ant-card', { hasText: '异常监控设置' }).first());

const h5 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const hp = await h5.newPage();

await goto(hp, '#/c/h5/incentive', 1100);
await shot(hp, 'H5-首页-页面整体');
await shot(hp, 'H5-首页-热门勋章', hp.locator('.mobile-home-ranking-card').first());
await shot(hp, 'H5-首页-认可动态', hp.locator('.mobile-home-feed').first());
await shot(hp, 'H5-首页-底栏导航', hp.locator('.mobile-primary-nav').first());
await shot(hp, 'H5-首页-发放FAB', hp.locator('.mobile-home-floating-issue').first());

await goto(hp, '#/c/h5/incentive/issue', 900);
await shot(hp, 'H5-发放勋章-选勋章');
await shot(hp, 'H5-发放勋章-月度额度', hp.locator('.monthly-issue-quota').first());
const detailLink = hp.getByRole('button', { name: '查看详情' }).first();
if (await detailLink.count()) {
  await detailLink.click();
  await hp.waitForTimeout(500);
  await shot(hp, 'H5-发放勋章-勋章详情抽屉', hp.locator('.mobile-badge-detail-drawer, .ant-drawer-content').last());
  await hp.keyboard.press('Escape');
  await hp.waitForTimeout(300);
}
const pickBadge = hp.locator('.mobile-badge-issue-trigger').first();
if (await pickBadge.count()) {
  await pickBadge.click();
  await hp.waitForTimeout(600);
  await shot(hp, 'H5-发放勋章-填写表单');
  await shot(hp, 'H5-发放勋章-认可对象', hp.locator('.mobile-recognition-target').first());
  await shot(hp, 'H5-发放勋章-确认发放', hp.locator('.mobile-confirm-actions').first());
  const picker = hp.locator('.mobile-target-picker').first();
  if (await picker.count()) {
    await picker.click();
    await hp.waitForTimeout(500);
    await shot(hp, 'H5-发放勋章-对象选择树', hp.locator('.mobile-target-drawer, .ant-drawer-content').last());
    await hp.keyboard.press('Escape');
  }
}

await goto(hp, '#/c/h5/incentive/ranking', 900);
await shot(hp, 'H5-热门勋章-页面整体');
await shot(hp, 'H5-热门勋章-勋章条', hp.locator('.mobile-medal-tab-strip').first());
await shot(hp, 'H5-热门勋章-获得名单', hp.locator('.mobile-medal-recipient-list').first());

await goto(hp, '#/c/h5/incentive/ranking/P02', 800);
await shot(hp, 'H5-热门勋章-指定勋章');

await goto(hp, '#/c/h5/incentive/person/E001', 900);
await shot(hp, 'H5-个人勋章墙-页面整体');
await shot(hp, 'H5-个人勋章墙-页头', hp.locator('.employee-honor-wall-hero').first());

await goto(hp, '#/c/h5/incentive/profile', 900);
await shot(hp, 'H5-个人中心-页面整体');
await shot(hp, 'H5-个人中心-类型Tab', hp.locator('.honor-badge-tabs').first());
await shot(hp, 'H5-个人中心-勋章轮播', hp.locator('.honor-badge-carousel').first());
const badgeGridBtn = hp.locator('.honor-badge-grid button').first();
if (await badgeGridBtn.count()) {
  await badgeGridBtn.click();
  await hp.waitForTimeout(500);
  await shot(hp, 'H5-个人中心-勋章详情', hp.locator('.mobile-badge-detail-drawer, .ant-drawer-content').last());
  await hp.keyboard.press('Escape');
}

await goto(hp, '#/c/h5/incentive/messages', 800);
await shot(hp, 'H5-消息-页面整体');
await shot(hp, 'H5-消息-勋章卡片', hp.locator('.recognition-im-award-card').first());

await goto(hp, '#/c/h5/incentive/award', 800);
await shot(hp, 'H5-勋章详情-获得页');

const pc = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pp = await pc.newPage();

await goto(pp, '#/c/pc/incentive', 1100);
await shot(pp, 'PC-首页-页面整体');
await shot(pp, 'PC-首页-顶栏导航', pp.locator('.c-incentive-pc-nav').first());
await shot(pp, 'PC-首页-热门勋章', pp.locator('.mobile-home-ranking-card').first());
await shot(pp, 'PC-首页-侧栏与我相关', pp.locator('.c-incentive-pc-aside').first());
await shot(pp, 'PC-首页-发放按钮', pp.locator('.c-incentive-pc-aside .ant-btn-primary').first());

await goto(pp, '#/c/pc/incentive/issue', 900);
await shot(pp, 'PC-发放勋章-页面整体');

await goto(pp, '#/c/pc/incentive/ranking', 900);
await shot(pp, 'PC-热门勋章-页面整体');

await goto(pp, '#/c/pc/incentive/profile', 900);
await shot(pp, 'PC-个人中心-页面整体');
await shot(pp, 'PC-个人中心-统计头', pp.locator('.c-incentive-pc-profile-hero').first());

await goto(pp, '#/c/pc/incentive/messages', 800);
await shot(pp, 'PC-消息-页面整体');

await goto(pp, '#/c/pc/incentive/person/E001', 900);
await shot(pp, 'PC-个人勋章墙-页面整体');

await goto(pp, '#/c/pc/incentive/award', 800);
await shot(pp, 'PC-勋章详情-获得页');

await writeFile(join(OUT, '_manifest.json'), JSON.stringify(shots, null, 2));
await browser.close();
console.log('total', shots.length);
