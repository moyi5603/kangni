import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/tmp/kn-playwright/package.json');
const { chromium } = require('playwright');
const out = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
const BASE = 'http://localhost:5173';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(20000);
await page.goto(`${BASE}/#/voting-v2/vote-v2-players/2`, { waitUntil: 'networkidle' });
await page.getByText('选项管理').first().waitFor();
await page.waitForTimeout(400);

await page.getByRole('button', { name: '编辑 张工' }).click({ force: true });
await page.locator('.ant-drawer').waitFor();
await page.waitForTimeout(400);
await page.locator('.ant-drawer').last().screenshot({ path: join(out, '选项管理-编辑选项抽屉.png') });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await page.getByRole('button', { name: '删除 张工' }).click({ force: true });
await page.waitForTimeout(500);
const dlg = page.locator('.ant-modal, [role="dialog"]').last();
await dlg.screenshot({ path: join(out, '选项管理-删除确认弹窗.png') }).catch(async () => {
  await page.screenshot({ path: join(out, '选项管理-删除确认弹窗.png'), fullPage: true });
});
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await page.getByRole('button', { name: '批量导入' }).click({ force: true });
await page.waitForTimeout(500);
await page.locator('.ant-modal').last().screenshot({ path: join(out, '选项管理-批量导入弹窗.png') });
await page.getByRole('tab', { name: '表格' }).click({ force: true }).catch(() => page.getByText('表格', { exact: true }).click());
await page.waitForTimeout(300);
await page.locator('.ant-modal').last().screenshot({ path: join(out, '选项管理-批量导入表格.png') });

await browser.close();
console.log('recapture ok');
