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

async function goto(hash, waitMs = 900) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitMs);
}

await goto('#/care/care-overview');
await shot('员工关怀-左侧菜单', page.locator('.ant-layout-sider').first());
await shot('后台-概览-页面整体');
await shot('后台-概览-人员信息完善', page.locator('.overview-complete-grid, .overview-block').first());

await goto('#/care/care-rules');
await shot('后台-关怀规则-页面整体');
await shot('后台-关怀规则-查询筛选', page.locator('.search-panel, .ant-card').first());
await shot('后台-关怀规则-列表表格', page.locator('.ant-table').first());

await goto('#/care/care-rule-create');
await shot('后台-新建规则-表单页');
await shot('后台-新建规则-规则设置', page.locator('.ant-card').first());
await page.locator('.ant-select').first().click();
await page.waitForTimeout(300);
await shot('后台-新建规则-场景下拉', page.locator('.ant-select-dropdown:visible').last());
await page.keyboard.press('Escape');

await goto('#/care/care-rule-create/' + encodeURIComponent('节气关怀'));
await shot('后台-新建规则-节气URL回落', page.locator('.ant-card').first());
await page.locator('.ant-select').first().click();
await page.waitForTimeout(300);
await shot('后台-新建规则-节气URL场景下拉', page.locator('.ant-select-dropdown:visible').last());
await page.keyboard.press('Escape');

await goto('#/care/care-rule-edit/r4');
await shot('后台-编辑规则-节日页');
await page.locator('.ant-select').first().click();
await page.waitForTimeout(300);
await shot('后台-编辑规则-场景下拉含节气', page.locator('.ant-select-dropdown:visible').last());
await page.keyboard.press('Escape');

await goto('#/care/care-records');
await page.setViewportSize({ width: 1680, height: 900 });
await page.waitForTimeout(200);
await shot('后台-关怀记录-页面整体');
const expand = page.getByRole('button', { name: '展开' });
if (await expand.count()) {
  await expand.click();
  await page.waitForTimeout(200);
}
await shot('后台-关怀记录-查询筛选', page.locator('.search-card').first());
await shot('后台-关怀记录-列表表格', page.locator('.ant-table').first());
const bless = page.getByRole('button', { name: /同事祝福/ }).first();
if (await bless.count()) {
  await bless.click();
  await page.waitForTimeout(400);
  await shot('后台-关怀记录-同事祝福抽屉', page.locator('.ant-drawer').last());
}
await page.setViewportSize({ width: 1440, height: 900 });

await goto('#/care/care-templates');
await shot('后台-关怀模板-页面整体');

await goto('#/care/care-settings');
await shot('后台-关怀设置-页面整体');

await goto('#/c/pc/profile/care');
await shot('PC-我的关怀-页面整体');

await browser.close();
console.log('done');
