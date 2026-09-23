import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/edy/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'screenshots');
const BASE = 'http://127.0.0.1:5173/';

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function shot(name, locator) {
  const path = join(OUT, `${name}.png`);
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
    console.log('fallback', name, String(err.message || err).slice(0, 90));
  }
  await page.screenshot({ path, fullPage: false });
  console.log('page', name);
}

async function goto(hash, waitMs = 1200) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('iframe.html-studio-frame', { timeout: 15000 });
  await page.waitForTimeout(waitMs);
}

function studio() {
  return page.frameLocator('iframe.html-studio-frame');
}

function studioFrame() {
  return page.frames().find((f) => /decoration\/(h5|pc)\.html/.test(f.url()));
}

async function closePickers() {
  const frame = studioFrame();
  if (!frame) return;
  await frame.evaluate(() => {
    document.querySelectorAll('.pick-mask').forEach((el) => el.classList.remove('show'));
  });
}

async function expandAccordions() {
  const frame = studioFrame();
  if (!frame) return;
  await frame.evaluate(() => {
    document.querySelectorAll('.acc').forEach((el) => el.classList.add('open'));
  });
}

await goto('#/workbench/h5-decoration', 1600);
await shot('员工应用-左侧菜单', page.locator('.ant-layout-sider').first());
await shot('H5装修-页面整体');
await shot('H5装修-工作台整体', studio().locator('.studio').first());
await shot('H5装修-组件库', studio().locator('.left').first());
await shot('H5装修-画布', studio().locator('.center').first());
await shot('H5装修-工具栏', studio().locator('.center-tools').first());
await shot('H5装修-手机预览', studio().locator('.phone').first());
await shot('H5装修-文章-选中态', studio().locator('#artWrap').first());
await shot('H5装修-文章-右侧内容', studio().locator('.right').first());
await shot('H5装修-文章-展示样式', studio().locator('#stylePick').first());
await shot('H5装修-文章-字段设置', studio().locator('.field-set').first());

await studio().locator('.tabs button[data-tab="style"]').click();
await page.waitForTimeout(250);
await shot('H5装修-文章-样式Tab', studio().locator('#paneStyle').first());
await studio().locator('.tabs button[data-tab="content"]').click();

await studio().locator('input[name="pickMode"][value="custom"]').click();
await page.waitForTimeout(200);
await shot('H5装修-文章-自定义选择', studio().locator('#paneContent').first());
await studio().locator('#addNews').click();
await page.waitForTimeout(600);
await shot('H5装修-文章-选择文章弹窗', studio().locator('.pick-modal').first());
await closePickers();
await expandAccordions();
await page.waitForTimeout(300);

const libNames = ['调查问卷', '用户服务', '荣誉组件', '活动', '精彩瞬间', '兴趣圈', '投票'];
for (const name of libNames) {
  await studio().locator(`.comp[data-name="${name}"]`).click({ force: true });
  await page.waitForTimeout(350);
  const file = name.replace(/\s/g, '');
  await shot(`H5装修-${file}-画布选中`, studio().locator('.phone').first());
  await shot(`H5装修-${file}-右侧配置`, studio().locator('.right').first());
}

await goto('#/workbench/pc-decoration', 1600);
await shot('PC装修-页面整体');
await shot('PC装修-工作台整体', studio().locator('.app').first());
await shot('PC装修-顶栏', studio().locator('.top').first());
await shot('PC装修-组件库', studio().locator('#leftPane').first());
await shot('PC装修-画布', studio().locator('.center').first());
await shot('PC装修-右侧空态', studio().locator('#rightPane').first());

await studio().locator('.comp[data-name="文章"]').click({ force: true });
await page.waitForTimeout(350);
await shot('PC装修-文章-画布', studio().locator('#artWrap').first());
await shot('PC装修-文章-组件设置', studio().locator('#paneComp').first());

await studio().locator('.tabs button[data-tab="page"]').click();
await page.waitForTimeout(250);
await shot('PC装修-页面设置', studio().locator('#panePage').first());
await studio().locator('.tabs button[data-tab="comp"]').click();

await studio().locator('.comp[data-name="公告"]').click({ force: true });
await page.waitForTimeout(300);
await shot('PC装修-公告-画布', studio().locator('#noticeWrap').first());
await shot('PC装修-公告-组件设置', studio().locator('#paneNotice').first());

await studio().locator('.comp[data-name="与我相关"]').click({ force: true });
await page.waitForTimeout(300);
await shot('PC装修-与我相关-画布', studio().locator('#relWrap').first());
await shot('PC装修-与我相关-组件设置', studio().locator('#paneRelated').first());

for (const name of ['调查问卷', '活动', '精彩瞬间', '兴趣圈', '投票']) {
  await studio().locator(`.comp[data-name="${name}"]`).click({ force: true });
  await page.waitForTimeout(300);
  await shot(`PC装修-${name}-右侧配置`, studio().locator('#rightPane').first());
}

await studio().locator('#btnSave').click();
await page.waitForTimeout(200);
await shot('PC装修-保存Toast', studio().locator('#toast').first());

await browser.close();
console.log('done');
