#!/usr/bin/env python3
"""Capture instant-incentive PRD screenshots from local Vite."""
from __future__ import annotations

from pathlib import Path

from playwright.sync_api import TimeoutError as PwTimeout
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent / "screenshots"
ROOT.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:5173/"
SHOTS: list[str] = []


def save(page, name: str, selector: str | None = None) -> None:
    path = ROOT / f"{name}.png"
    try:
        if selector:
            loc = page.locator(selector).first
            loc.wait_for(state="visible", timeout=3500)
            loc.screenshot(path=str(path), timeout=8000)
        else:
            page.screenshot(path=str(path), full_page=False)
        SHOTS.append(f"{name}.png")
        print("ok", name)
    except Exception as exc:  # noqa: BLE001
        page.screenshot(path=str(path), full_page=False)
        SHOTS.append(f"{name}.png")
        print("page", name, str(exc)[:80])


def goto(page, hash_path: str, wait: str = ".ant-layout, .c-incentive-h5, .c-pc-shell") -> None:
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    try:
        page.wait_for_selector(wait, timeout=12000)
    except PwTimeout:
        pass
    page.wait_for_timeout(400)


def click_role(page, name: str) -> bool:
    loc = page.get_by_role("button", name=name)
    if loc.count():
        loc.first.click()
        page.wait_for_timeout(450)
        return True
    return False


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        admin = browser.new_context(viewport={"width": 1440, "height": 900})
        ap = admin.new_page()

        goto(ap, "#/incentive/incentive-dashboard")
        save(ap, "后台-概览-页面整体")
        save(ap, "即时激励-左侧菜单", ".ant-layout-sider")
        save(ap, "后台-概览-KPI指标卡", ".overview-kpi-grid")
        save(ap, "后台-概览-发放状态分布", ".overview-chart-card:has-text('发放状态分布')")
        save(ap, "后台-概览-勋章分布", ".overview-chart-card:has-text('勋章分布')")
        save(ap, "后台-概览-待办关注", ".ant-card:has-text('待办关注')")
        save(ap, "后台-概览-近期发放", ".ant-card:has-text('近期发放')")
        if click_role(ap, "详情"):
            save(ap, "后台-概览-认可详情抽屉", ".ant-drawer-content")
            ap.keyboard.press("Escape")
            ap.wait_for_timeout(250)

        goto(ap, "#/incentive/incentive-badges")
        save(ap, "后台-勋章管理-页面整体")
        save(ap, "后台-勋章管理-归属Tabs", ".incentive-badge-tabs")
        save(ap, "后台-勋章管理-勋章目录", ".incentive-badge-card")
        if click_role(ap, "归属与分类管理"):
            save(ap, "后台-勋章管理-分类抽屉", ".ant-drawer-content")
            ap.keyboard.press("Escape")
            ap.wait_for_timeout(250)

        goto(ap, "#/incentive/incentive-badge-create")
        save(ap, "后台-新建勋章-表单页")
        save(ap, "后台-新建勋章-图标上传", ".ant-upload")
        save(ap, "后台-新建勋章-底栏操作", ".sticky-form-actions")

        goto(ap, "#/incentive/incentive-badge-edit/b1")
        save(ap, "后台-编辑勋章-表单页")

        goto(ap, "#/incentive/incentive-records")
        save(ap, "后台-发放记录-页面整体")
        save(ap, "后台-发放记录-查询筛选", ".search-panel")
        save(ap, "后台-发放记录-列表表格", ".ant-table")
        if click_role(ap, "发布公司表彰"):
            save(ap, "后台-发放记录-发布表彰抽屉", ".ant-drawer-content")
            ap.keyboard.press("Escape")
            ap.wait_for_timeout(250)
        if click_role(ap, "详情"):
            save(ap, "后台-发放记录-认可详情", ".ant-drawer-content")
            if click_role(ap, "驳回"):
                save(ap, "后台-发放记录-驳回弹窗", ".ant-modal")
                ap.keyboard.press("Escape")
            ap.keyboard.press("Escape")
            ap.wait_for_timeout(250)
        if click_role(ap, "撤回"):
            save(ap, "后台-发放记录-撤回确认", ".ant-modal")
            ap.keyboard.press("Escape")

        goto(ap, "#/incentive/incentive-settings")
        save(ap, "后台-规则设置-积分设置")
        save(ap, "后台-规则设置-查询筛选", ".search-panel")
        save(ap, "后台-规则设置-额度表格", ".ant-table")
        if click_role(ap, "新增"):
            save(ap, "后台-规则设置-新增额度弹窗", ".ant-modal")
            ap.keyboard.press("Escape")

        goto(ap, "#/incentive/incentive-settings?tab=content")
        save(ap, "后台-规则设置-填写设置")

        goto(ap, "#/incentive/incentive-settings?tab=risk")
        save(ap, "后台-规则设置-风控设置")
        save(ap, "后台-规则设置-审核设置", ".ant-card:has-text('审核设置')")
        save(ap, "后台-规则设置-异常监控", ".ant-card:has-text('异常监控设置')")

        h5 = browser.new_context(viewport={"width": 390, "height": 844})
        hp = h5.new_page()
        goto(hp, "#/c/h5/incentive", ".c-incentive-h5")
        save(hp, "H5-首页-页面整体")
        save(hp, "H5-首页-热门勋章", ".mobile-home-ranking-card")
        save(hp, "H5-首页-认可动态", ".mobile-home-feed")
        save(hp, "H5-首页-底栏导航", ".mobile-primary-nav")
        save(hp, "H5-首页-发放FAB", ".mobile-home-floating-issue")

        goto(hp, "#/c/h5/incentive/issue", ".c-incentive-h5")
        save(hp, "H5-发放勋章-选勋章")
        save(hp, "H5-发放勋章-月度额度", ".monthly-issue-quota")
        if click_role(hp, "查看详情"):
            save(hp, "H5-发放勋章-勋章详情抽屉", ".ant-drawer-content")
            hp.keyboard.press("Escape")
            hp.wait_for_timeout(250)
        loc = hp.locator(".mobile-badge-issue-trigger").first
        if loc.count():
            loc.click()
            hp.wait_for_timeout(500)
            save(hp, "H5-发放勋章-填写表单")
            save(hp, "H5-发放勋章-认可对象", ".mobile-recognition-target")
            save(hp, "H5-发放勋章-确认发放", ".mobile-confirm-actions")
            picker = hp.locator(".mobile-target-picker").first
            if picker.count():
                picker.click()
                hp.wait_for_timeout(450)
                save(hp, "H5-发放勋章-对象选择树", ".ant-drawer-content")
                hp.keyboard.press("Escape")

        goto(hp, "#/c/h5/incentive/ranking", ".c-incentive-h5")
        save(hp, "H5-热门勋章-页面整体")
        save(hp, "H5-热门勋章-勋章条", ".mobile-medal-tab-strip")
        save(hp, "H5-热门勋章-获得名单", ".mobile-medal-recipient-list")

        goto(hp, "#/c/h5/incentive/ranking/P02", ".c-incentive-h5")
        save(hp, "H5-热门勋章-指定勋章")

        goto(hp, "#/c/h5/incentive/person/E001", ".c-incentive-h5")
        save(hp, "H5-个人勋章墙-页面整体")
        save(hp, "H5-个人勋章墙-页头", ".employee-honor-wall-hero")

        goto(hp, "#/c/h5/incentive/profile", ".c-incentive-h5")
        save(hp, "H5-个人中心-页面整体")
        save(hp, "H5-个人中心-类型Tab", ".honor-badge-tabs")
        save(hp, "H5-个人中心-勋章轮播", ".honor-badge-carousel")
        grid = hp.locator(".honor-badge-grid button").first
        if grid.count():
            grid.click()
            hp.wait_for_timeout(450)
            save(hp, "H5-个人中心-勋章详情", ".ant-drawer-content")
            hp.keyboard.press("Escape")

        goto(hp, "#/c/h5/incentive/messages", ".c-incentive-h5")
        save(hp, "H5-消息-页面整体")
        save(hp, "H5-消息-勋章卡片", ".recognition-im-award-card")

        goto(hp, "#/c/h5/incentive/award", ".c-incentive-h5")
        save(hp, "H5-勋章详情-获得页")

        pc = browser.new_context(viewport={"width": 1440, "height": 900})
        pp = pc.new_page()
        goto(pp, "#/c/pc/incentive", ".c-incentive-pc")
        save(pp, "PC-首页-页面整体")
        save(pp, "PC-首页-顶栏导航", ".c-incentive-pc-nav")
        save(pp, "PC-首页-热门勋章", ".mobile-home-ranking-card")
        save(pp, "PC-首页-侧栏与我相关", ".c-incentive-pc-aside")
        save(pp, "PC-首页-发放按钮", ".c-incentive-pc-aside .ant-btn-primary")

        goto(pp, "#/c/pc/incentive/issue", ".c-incentive-pc")
        save(pp, "PC-发放勋章-页面整体")

        goto(pp, "#/c/pc/incentive/ranking", ".c-incentive-pc")
        save(pp, "PC-热门勋章-页面整体")

        goto(pp, "#/c/pc/incentive/profile", ".c-incentive-pc")
        save(pp, "PC-个人中心-页面整体")
        save(pp, "PC-个人中心-统计头", ".c-incentive-pc-profile-hero")

        goto(pp, "#/c/pc/incentive/messages", ".c-incentive-pc")
        save(pp, "PC-消息-页面整体")

        goto(pp, "#/c/pc/incentive/person/E001", ".c-incentive-pc")
        save(pp, "PC-个人勋章墙-页面整体")

        goto(pp, "#/c/pc/incentive/award", ".c-incentive-pc")
        save(pp, "PC-勋章详情-获得页")

        (ROOT / "_manifest.json").write_text(
            "[\n  " + ",\n  ".join(f'"{s}"' for s in SHOTS) + "\n]\n",
            encoding="utf-8",
        )
        browser.close()
        print("total", len(SHOTS))


if __name__ == "__main__":
    main()
