import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'screenshots');
const BASE = 'http://localhost:5173/';

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
    console.log('fallback', file, String(err.message || err).slice(0, 80));
  }
  await page.screenshot({ path, fullPage: false });
  shots.push(file);
  console.log('page', file);
}

async function goto(page, hash, waitMs = 800) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitMs);
}

const admin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const ap = await admin.newPage();

await goto(ap, '#/activities/activity-overview');
await shot(ap, '后台-概览-页面整体');
await shot(ap, '活动应用-左侧菜单', ap.locator('.ant-layout-sider, aside, .ant-menu').first());
await shot(ap, '后台-概览-KPI指标卡', ap.locator('.overview-kpi-grid').first());

await goto(ap, '#/activities/activity-list');
await shot(ap, '后台-活动管理-页面整体');
await shot(ap, '后台-活动管理-查询筛选', ap.locator('.ant-card').first());
await shot(ap, '后台-活动管理-列表表格', ap.locator('.ant-table').first());
await shot(ap, '后台-活动管理-行操作', ap.locator('.ant-table-tbody tr').first());

const newBtn = ap.getByRole('button', { name: '新建' });
if (await newBtn.count()) {
  await newBtn.click();
  await ap.waitForTimeout(900);
  await shot(ap, '后台-新增活动-表单页');
  const groupCard = ap.locator('.activity-settings-card', { hasText: '报名分组设置' });
  if (await groupCard.count()) {
    await groupCard.first().scrollIntoViewIfNeeded();
    await shot(ap, '后台-新增活动-报名分组', groupCard.first());
  }
  const adv = ap.getByText('高级设置');
  if (await adv.count()) {
    await adv.first().click();
    await ap.waitForTimeout(400);
    await shot(ap, '后台-新增活动-高级设置');
  }
}

await goto(ap, '#/activities/activity-detail/26');
await shot(ap, '后台-活动详情-页面整体');
await shot(ap, '后台-活动详情-页头', ap.locator('.activity-detail-header-card').first());
await shot(ap, '后台-活动详情-标题与操作', ap.locator('.activity-detail-header-actions').first());
await shot(ap, '后台-活动详情-统计条', ap.locator('.activity-detail-header-metrics').first());
await shot(ap, '后台-活动详情-场次表', ap.locator('.ant-card', { hasText: '场次' }).first());

await goto(ap, '#/activities/activity-detail/26/signups');
await shot(ap, '后台-活动详情-报名Tab');
await shot(ap, '后台-活动详情-报名场次筛', ap.locator('.signup-session-search-select').first());

await goto(ap, '#/activities/activity-detail/26/checkin');
await shot(ap, '后台-活动详情-签到码Tab');

await goto(ap, '#/activities/activity-detail/1/comments');
await shot(ap, '后台-活动详情-评论Tab');
const commentReply = ap.getByRole('button', { name: '回复' }).first();
if (await commentReply.count()) {
  await commentReply.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-活动详情-评论回复', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/activities/activity-detail/1/moments');
await shot(ap, '后台-活动详情-精彩瞬间Tab');
const momentDetail = ap.getByRole('button', { name: '详情' }).first();
if (await momentDetail.count()) {
  await momentDetail.click();
  await ap.waitForTimeout(500);
  const drawerReply = ap.getByRole('button', { name: '回复' }).first();
  if (await drawerReply.count()) {
    await drawerReply.click();
    await ap.waitForTimeout(300);
    await shot(ap, '后台-活动详情-瞬间回复', ap.locator('.ant-drawer, .moment-inline-reply').last());
  }
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/activities/activity-detail/1/prizes');
await shot(ap, '后台-活动详情-奖品发放Tab');

await goto(ap, '#/activities/activity-list');
const closeBtn = ap.getByRole('button', { name: '截止报名' }).first();
if (await closeBtn.count()) {
  await closeBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-活动管理-截止报名确认', ap.locator('.ant-popover, .ant-modal').last());
  await ap.keyboard.press('Escape');
}

const qrBtn = ap.getByRole('button', { name: '签到码' }).first();
if (await qrBtn.count()) {
  await qrBtn.click();
  await ap.waitForTimeout(600);
  await shot(ap, '后台-活动管理-签到码弹窗', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/activities/activity-list');
const cardView = ap.locator('.ant-segmented-item', { hasText: '卡片' });
if (await cardView.count()) {
  await cardView.click();
  await ap.waitForTimeout(500);
  await shot(ap, '后台-活动管理-卡片视图');
}

await goto(ap, '#/activities/activity-edit/1');
await shot(ap, '后台-编辑活动-已结束锁定');

await goto(ap, '#/activities/activity-categories');
await shot(ap, '后台-分类管理-页面整体');

await goto(ap, '#/activities/activity-rules');
await shot(ap, '后台-规则设置-页面整体');

await goto(ap, '#/activities/activity-layout');
await shot(ap, '后台-活动装修-页面整体');
await shot(ap, '后台-活动装修-组件库', ap.locator('.activity-deco-library').first());
await shot(ap, '后台-活动装修-画布', ap.locator('.activity-deco-canvas').first());
const decoAct = ap.locator('.activity-deco-block[data-block-type="activity"]').first();
if (await decoAct.count()) {
  await decoAct.click();
  await ap.waitForTimeout(300);
}
await shot(ap, '后台-活动装修-字段设置', ap.locator('.activity-deco-field-toggles').first());

await goto(ap, '#/activities/activity-edit/2');
await shot(ap, '后台-编辑活动-系列场次');

await admin.close();

const portal = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pp = await portal.newPage();
await goto(pp, '#/c');
await shot(pp, 'C端预览-入口页');
await portal.close();

const h5 = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const hp = await h5.newPage();

await goto(hp, '#/c/h5', 1000);
await shot(hp, 'H5-首页-页面整体');
await shot(hp, 'H5-首页-搜索行', hp.locator('.c-home-search-row').first());
await shot(hp, 'H5-首页-我的活动', hp.locator('.c-home-mine-btn').first());
await shot(hp, 'H5-首页-轮播图', hp.locator('.c-home-banner').first());
await shot(hp, 'H5-首页-搜索入口', hp.locator('.c-h5-catalog-search, [class*="search"]').first());
await shot(hp, 'H5-首页-活动卡片', hp.locator('[class*="card"]').first());

await goto(hp, '#/c/h5/search');
await shot(hp, 'H5-搜索-空查询');
const searchInput = hp.locator('.c-act-searchbar input, input[type="search"]').first();
if (await searchInput.count()) {
  await searchInput.fill('篮球');
  await hp.waitForTimeout(400);
  await shot(hp, 'H5-搜索-有结果');
}

await goto(hp, '#/c/h5/list');
await shot(hp, 'H5-全部活动-页面整体');

await goto(hp, '#/c/h5/26', 1000);
await shot(hp, 'H5-活动详情-页面整体');
await shot(hp, 'H5-活动详情-底栏操作', hp.locator('[class*="engage"], footer, .c-h5-detail-fab, [class*="cta"]').last());

const signupCta = hp.getByRole('button', { name: /立即报名|取消报名|已报名|报名/ }).last();
if (await signupCta.count()) {
  await shot(hp, 'H5-活动详情-报名CTA', signupCta);
}

const peopleBtn = hp.getByText('查看名单').first();
if (await peopleBtn.count()) {
  await peopleBtn.click();
  await hp.waitForTimeout(400);
  await shot(hp, 'H5-活动详情-已报名人员', hp.locator('.c-signup-people-panel').last());
  await hp.locator('.c-signup-people-panel').getByRole('button', { name: '关闭' }).click();
}

await goto(hp, '#/c/h5/21/signup', 800);
await shot(hp, 'H5-报名页-表单');

await goto(hp, '#/c/h5/1', 1000);
await shot(hp, 'H5-已结束活动-详情');
const rate = hp.getByText('活动评分');
if (await rate.count()) await shot(hp, 'H5-已结束活动-评分', hp.locator('[class*="rating"]').first());

await goto(hp, '#/c/h5/my');
await shot(hp, 'H5-我的报名-页面整体');

await goto(hp, '#/c/h5/favorites');
await shot(hp, 'H5-我的收藏-页面整体');

await goto(hp, '#/c/h5/moments');
await shot(hp, 'H5-往期瞬间-页面整体');

await goto(hp, '#/c/h5/26/checkin', 800);
await shot(hp, 'H5-签到页-结果');

await goto(hp, '#/c/h5/999');
await shot(hp, 'H5-活动不存在-空态');

await h5.close();

const pc = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pcp = await pc.newPage();

await goto(pcp, '#/c/pc', 1000);
await shot(pcp, 'PC-首页-页面整体');
await shot(pcp, 'PC-首页-搜索行', pcp.locator('.c-home-search-row').first());
await shot(pcp, 'PC-首页-我的活动', pcp.locator('.c-home-mine-btn').first());
await shot(pcp, 'PC-首页-轮播图', pcp.locator('.c-home-banner').first());

await goto(pcp, '#/c/pc/list');
await shot(pcp, 'PC-全部活动-页面整体');

await goto(pcp, '#/c/pc/26', 1000);
await shot(pcp, 'PC-活动详情-页面整体');
await shot(pcp, 'PC-活动详情-右侧栏', pcp.locator('aside, [class*="aside"]').first());

const pcPeople = pcp.getByText('查看名单').first();
if (await pcPeople.count()) {
  await pcPeople.click();
  await pcp.waitForTimeout(400);
  await shot(pcp, 'PC-活动详情-已报名人员', pcp.locator('.c-signup-people-panel').last());
  await pcp.locator('.c-signup-people-panel').getByRole('button', { name: '关闭' }).click();
}

const pcSignup = pcp.getByRole('button', { name: /立即报名|取消报名/ }).last();
if (await pcSignup.count()) {
  await pcSignup.click();
  await pcp.waitForTimeout(500);
  const dialog = pcp.locator('[role="dialog"], .c-modal, [class*="modal"]').last();
  if (await dialog.count()) await shot(pcp, 'PC-活动详情-报名弹窗', dialog);
  else await shot(pcp, 'PC-活动详情-报名弹窗');
  const cancelBtn = pcp.getByRole('button', { name: '取消' }).last();
  if (await cancelBtn.count()) await cancelBtn.click();
}

await goto(pcp, '#/c/pc/1', 900);
await shot(pcp, 'PC-已结束活动-详情');

await goto(pcp, '#/c/pc/my');
await shot(pcp, 'PC-我的报名-页面整体');

await goto(pcp, '#/c/pc/favorites');
await shot(pcp, 'PC-我的收藏-页面整体');

await goto(pcp, '#/c/pc/moments');
await shot(pcp, 'PC-往期瞬间-页面整体');

await goto(pcp, '#/c/pc/search');
await shot(pcp, 'PC-搜索-页面整体');

await pc.close();
await browser.close();

await writeFile(join(OUT, '_manifest.json'), JSON.stringify(shots, null, 2));
console.log('total', shots.length);
