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
    console.log('fallback', file, String(err.message || err).slice(0, 80));
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

await goto(ap, '#/forum/forum-overview');
await shot(ap, '后台-概览-页面整体');
await shot(ap, '论坛应用-左侧菜单', ap.locator('.ant-layout-sider').first());
await shot(ap, '后台-概览-KPI指标卡', ap.locator('.overview-kpi-grid').first());
await shot(ap, '后台-概览-日期筛选', ap.locator('.overview-page .ant-picker, .page-stack .ant-picker').first());
await shot(ap, '后台-概览-帖子论坛分布', ap.locator('.overview-chart-card', { hasText: '帖子论坛分布' }).first());
await shot(ap, '后台-概览-互动热度分层', ap.locator('.overview-chart-card', { hasText: '互动热度分层' }).first());
await shot(ap, '后台-概览-最新帖子表', ap.locator('.ant-card', { hasText: '最新帖子' }).first());

await goto(ap, '#/forum/forum-list');
await shot(ap, '后台-论坛列表-页面整体');
await shot(ap, '后台-论坛列表-工具栏', ap.locator('.list-table-card .ant-card-head, .list-table-card .card-toolbar, .page-stack .ant-space').first());
await shot(ap, '后台-论坛列表-列表表格', ap.locator('.ant-table').first());
await shot(ap, '后台-论坛列表-行操作', ap.locator('.ant-table-tbody tr').first());

const moreBtn = ap.locator('.ant-table-tbody tr').first().getByRole('button', { name: /更多/ });
if (await moreBtn.count()) {
  await moreBtn.click();
  await ap.waitForTimeout(300);
  await shot(ap, '后台-论坛列表-更多菜单', ap.locator('.ant-dropdown:visible, .ant-dropdown-menu').last());
  await ap.keyboard.press('Escape');
}

const linkBtn = ap.getByRole('button', { name: /查看链接/ }).first();
if (await linkBtn.count()) {
  await linkBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-论坛列表-查看链接弹窗', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await ap.locator('.ant-table-tbody .ant-checkbox-input').first().check({ force: true }).catch(() => {});
await ap.waitForTimeout(200);
await shot(ap, '后台-论坛列表-批量停用', ap.locator('.page-stack').first());
const batchBtn = ap.getByRole('button', { name: '批量停用' });
if (await batchBtn.count()) {
  await batchBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-论坛列表-批量停用确认', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/forum/forum-create');
await shot(ap, '后台-新建论坛-表单页');
await shot(ap, '后台-新建论坛-图标上传', ap.locator('.ant-form-item', { hasText: '论坛图标' }).first());
await shot(ap, '后台-新建论坛-背景图上传', ap.locator('.ant-form-item', { hasText: '背景图' }).first());
await shot(ap, '后台-新建论坛-可见范围', ap.locator('.ant-form-item', { hasText: '可见范围' }).first());
await ap.getByRole('radio', { name: '按部门' }).click();
await ap.waitForTimeout(300);
await shot(ap, '后台-新建论坛-按部门', ap.locator('.ant-form-item', { hasText: '选择部门' }).first());
await ap.getByRole('radio', { name: '自定义人群' }).click();
await ap.waitForTimeout(300);
await shot(ap, '后台-新建论坛-自定义人群', ap.locator('.ant-form-item', { hasText: '选择人员' }).first());
await ap.getByRole('radio', { name: '导入人群' }).click();
await ap.waitForTimeout(300);
await shot(ap, '后台-新建论坛-导入人群', ap.locator('.ant-form-item', { hasText: '导入人群' }).first());
await shot(ap, '后台-新建论坛-底栏操作', ap.locator('.sticky-form-actions').first());

await goto(ap, '#/forum/forum-edit/1');
await shot(ap, '后台-编辑论坛-表单页');

await goto(ap, '#/forum/forum-detail/1');
await shot(ap, '后台-论坛详情-页面整体');
await shot(ap, '后台-论坛详情-标题与操作', ap.locator('.forum-board-title-row').first());
await shot(ap, '后台-论坛详情-基本信息', ap.locator('.ant-descriptions').first());
await shot(ap, '后台-论坛详情-帖子表', ap.locator('.ant-table').first());

const pinMore = ap.locator('.ant-table-tbody tr').first().getByRole('button', { name: /更多/ });
if (await pinMore.count()) {
  await pinMore.click();
  await ap.waitForTimeout(300);
  await shot(ap, '后台-论坛详情-帖子更多菜单', ap.locator('.ant-dropdown:visible').last());
  const pinItem = ap.getByRole('menuitem', { name: /置顶|取消置顶/ }).first();
  if (await pinItem.count()) {
    await pinItem.click();
    await ap.waitForTimeout(400);
    await shot(ap, '后台-论坛详情-置顶确认', ap.locator('.ant-modal').last());
    await ap.keyboard.press('Escape');
  } else {
    await ap.keyboard.press('Escape');
  }
}

const assignBtn = ap.getByRole('button', { name: /指派回复人/ }).first();
if (await assignBtn.count()) {
  await assignBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-论坛详情-指派回复人弹窗', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/forum/topic-detail/1');
await shot(ap, '后台-帖子详情-页面整体');
await shot(ap, '后台-帖子详情-标题与操作', ap.locator('.detail-title-row').first());
await shot(ap, '后台-帖子详情-基本信息', ap.locator('.ant-card', { hasText: '基本信息' }).first());
await shot(ap, '后台-帖子详情-内容与评论', ap.locator('.ant-card', { hasText: '内容' }).first());

const replyTopic = ap.getByRole('button', { name: '回复帖子' });
if (await replyTopic.count()) {
  await replyTopic.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-帖子详情-回复帖子表单', ap.locator('.ant-card', { hasText: '内容' }).first());
}

const replyCmt = ap.getByRole('button', { name: /回复评论/ }).first();
if (await replyCmt.count()) {
  await replyCmt.click();
  await ap.waitForTimeout(300);
  await shot(ap, '后台-帖子详情-回复评论', ap.locator('.ant-card', { hasText: '内容' }).first());
}

await goto(ap, '#/forum/topic-detail/1');
const shelfBtn = ap.getByRole('button', { name: /下架|重新上架/ }).first();
if (await shelfBtn.count()) {
  await shelfBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-帖子详情-下架确认', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

const topicLink = ap.getByRole('button', { name: '查看链接' });
if (await topicLink.count()) {
  await topicLink.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-帖子详情-查看链接弹窗', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/forum/forum-tags');
await shot(ap, '后台-标签管理-页面整体');
await shot(ap, '后台-标签管理-查询筛选', ap.locator('.search-panel, form, .ant-card').first());
await shot(ap, '后台-标签管理-列表表格', ap.locator('.ant-table').first());
await ap.getByRole('button', { name: '新建标签' }).click();
await ap.waitForTimeout(400);
await shot(ap, '后台-标签管理-新建弹窗', ap.locator('.ant-modal').last());
await ap.keyboard.press('Escape');

const delBtn = ap.getByRole('button', { name: '删除' }).first();
if (await delBtn.count()) {
  await delBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-标签管理-删除确认', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

await goto(ap, '#/forum/forum-risk');
await shot(ap, '后台-禁言管理-页面整体');
await shot(ap, '后台-禁言管理-列表表格', ap.locator('.ant-table').first());
await ap.getByRole('button', { name: '添加禁言' }).click();
await ap.waitForTimeout(400);
await shot(ap, '后台-禁言管理-添加弹窗', ap.locator('.ant-modal').last());
await ap.keyboard.press('Escape');

const releaseBtn = ap.getByRole('button', { name: /解除禁言/ }).first();
if (await releaseBtn.count()) {
  await releaseBtn.click();
  await ap.waitForTimeout(400);
  await shot(ap, '后台-禁言管理-解除确认', ap.locator('.ant-modal').last());
  await ap.keyboard.press('Escape');
}

const h5 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const hp = await h5.newPage();

await goto(hp, '#/c/h5/forum/1', 1100);
await shot(hp, 'H5-板块页-页面整体');
await shot(hp, 'H5-板块页-头图区', hp.locator('.c-forum-hero').first());
await shot(hp, 'H5-板块页-搜索框', hp.locator('.c-forum-search-bar').first());
await shot(hp, 'H5-板块页-标签Tab', hp.locator('.c-forum-tabs').first());
await shot(hp, 'H5-板块页-排序', hp.locator('.c-forum-sort').first());
await shot(hp, 'H5-板块页-帖子列表', hp.locator('.c-forum-posts').first());
await shot(hp, 'H5-板块页-发布按钮', hp.locator('.c-forum-fab').first());

await hp.getByRole('button', { name: '立即发布' }).click();
await hp.waitForTimeout(500);
await shot(hp, 'H5-发布帖子-表单');
await hp.getByRole('button', { name: '关闭' }).click().catch(() => hp.keyboard.press('Escape'));
await hp.waitForTimeout(300);

await goto(hp, '#/c/h5/forum/1?empty=1', 900);
await shot(hp, 'H5-板块页-空态');

await goto(hp, '#/c/h5/forum/999', 800);
await shot(hp, 'H5-板块页-不存在');

await goto(hp, '#/c/h5/forum-topic/1', 1100);
await shot(hp, 'H5-帖子详情-页面整体');
await shot(hp, 'H5-帖子详情-正文', hp.locator('.c-h5-main, .c-forum-topic, main').first());

const likeBtn = hp.getByRole('button', { name: /点赞/ }).first();
if (await likeBtn.count()) await shot(hp, 'H5-帖子详情-点赞收藏', hp.locator('.c-forum-post-foot, .c-forum-topic-actions, footer').first());

const commentReply = hp.getByRole('button', { name: /回复 / }).first();
if (await commentReply.count()) {
  await commentReply.click();
  await hp.waitForTimeout(400);
  await shot(hp, 'H5-帖子详情-评论输入');
}

await goto(hp, '#/c/h5/forum-topic/999', 800);
await shot(hp, 'H5-帖子详情-不存在');

await goto(hp, '#/c/h5/forum-mine', 900);
await shot(hp, 'H5-我的帖子-页面整体');

await goto(hp, '#/c/h5/forum-mine?empty=1', 800);
await shot(hp, 'H5-我的帖子-空态');

const pc = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pp = await pc.newPage();

await goto(pp, '#/c/pc/forum/1', 1100);
await shot(pp, 'PC-板块页-页面整体');
await shot(pp, 'PC-板块页-头图区', pp.locator('.c-forum-pc-hero').first());
await shot(pp, 'PC-板块页-帖子列表', pp.locator('.c-forum-posts').first());
await shot(pp, 'PC-板块页-侧栏', pp.locator('.c-forum-pc-side').first());
await shot(pp, 'PC-板块页-立即发布', pp.locator('.c-forum-pc-publish').first());
await shot(pp, 'PC-板块页-其他论坛', pp.locator('.c-forum-pc-side-block', { hasText: '其他论坛' }).first());
await shot(pp, 'PC-板块页-热门帖子', pp.locator('.c-forum-pc-side-block', { hasText: '热门帖子' }).first());

await pp.getByRole('button', { name: '立即发布' }).click();
await pp.waitForTimeout(500);
await shot(pp, 'PC-发布帖子-表单', pp.locator('.c-forum-overlay-panel').first());
await pp.getByRole('button', { name: '关闭' }).click().catch(() => pp.keyboard.press('Escape'));

await goto(pp, '#/c/pc/forum/1?empty=1', 900);
await shot(pp, 'PC-板块页-空态');

await goto(pp, '#/c/pc/forum-topic/1', 1100);
await shot(pp, 'PC-帖子详情-页面整体');

await goto(pp, '#/c/pc/forum-mine', 900);
await shot(pp, 'PC-我的帖子-页面整体');

await goto(pp, '#/c', 800);
await shot(pp, 'C端预览-入口页', pp.locator('.c-portal').first());

await writeFile(join(OUT, '_manifest.json'), JSON.stringify(shots, null, 2));
await browser.close();
console.log('done', shots.length);
