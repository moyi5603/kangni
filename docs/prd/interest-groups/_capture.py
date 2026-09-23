#!/usr/bin/env python3
"""Capture interest-group PRD screenshots from local Vite."""
from __future__ import annotations

from pathlib import Path
from playwright.sync_api import TimeoutError as PwTimeout
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent / "screenshots"
ROOT.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:5173/"


def save(page, name: str, selector: str | None = None, full: bool = False) -> None:
    path = ROOT / f"{name}.png"
    try:
        if selector:
            loc = page.locator(selector).first
            loc.wait_for(state="visible", timeout=8000)
            loc.screenshot(path=str(path))
        else:
            page.screenshot(path=str(path), full_page=full)
        print("ok", name)
    except Exception as exc:  # noqa: BLE001
        print("fail", name, exc)


def goto(page, hash_path: str, wait: str = ".ant-layout, .c-ig-scroll, .c-portal, .c-signup-page") -> None:
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    page.wait_for_timeout(700)
    try:
        page.wait_for_selector(wait, timeout=12000)
    except PwTimeout:
        pass
    page.wait_for_timeout(400)


def click_text(page, text: str, exact: bool = False) -> None:
    loc = page.get_by_text(text, exact=exact).first
    loc.click(timeout=8000)
    page.wait_for_timeout(500)


def admin(page) -> None:
    page.set_viewport_size({"width": 1440, "height": 920})
    goto(page, "#/interest-groups")
    save(page, "后台-概览-页面整体")
    save(page, "后台-应用-左侧菜单", ".ant-layout-sider")
    save(page, "后台-概览-KPI指标卡", ".overview-kpi-grid")
    save(page, "后台-概览-分布图", ".overview-chart-row")
    save(page, "后台-概览-待办表", ".ant-table")

    goto(page, "#/interest-groups/interest-group-list")
    save(page, "后台-兴趣圈管理-页面整体")
    save(page, "后台-兴趣圈管理-查询筛选", ".search-panel, .list-search, form")
    save(page, "后台-兴趣圈管理-列表表格", ".ant-table")
    page.get_by_role("button", name="新建兴趣圈").click()
    page.wait_for_selector(".ant-drawer", timeout=8000)
    page.wait_for_timeout(400)
    save(page, "后台-兴趣圈管理-新建抽屉", ".ant-drawer")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)

    review = page.get_by_role("button", name="审核 午休飞盘局")
    if review.count() == 0:
        page.get_by_label("更多操作 午休飞盘局").click()
        page.wait_for_timeout(300)
        page.get_by_text("审核", exact=True).last.click()
    else:
        review.click()
    page.wait_for_selector(".ant-modal", timeout=8000)
    page.wait_for_timeout(300)
    save(page, "后台-兴趣圈管理-审核弹窗", ".ant-modal")
    page.keyboard.press("Escape")

    goto(page, "#/interest-groups/interest-group-detail/1")
    save(page, "后台-兴趣圈详情-页面整体")
    save(page, "后台-兴趣圈详情-头部卡片", ".activity-detail-header-card")
    save(page, "后台-兴趣圈详情-活动Tab")
    page.get_by_role("tab", name="成员").click()
    page.wait_for_timeout(500)
    save(page, "后台-兴趣圈详情-成员Tab")
    page.get_by_role("tab", name="评论").click()
    page.wait_for_timeout(500)
    save(page, "后台-兴趣圈详情-评论Tab")
    page.get_by_role("tab", name="精彩瞬间").click()
    page.wait_for_timeout(500)
    save(page, "后台-兴趣圈详情-瞬间Tab")

    goto(page, "#/interest-groups/interest-group-detail/5")
    save(page, "后台-兴趣圈详情-待审核状态")

    goto(page, "#/interest-groups/interest-group-activities")
    save(page, "后台-活动管理-页面整体")
    save(page, "后台-活动管理-查询筛选", ".search-panel, .list-search, form")
    save(page, "后台-活动管理-列表表格", ".ant-table")

    goto(page, "#/interest-groups/interest-group-activity-create")
    page.wait_for_timeout(600)
    save(page, "后台-新建活动-表单页", full=True)
    save(page, "后台-新建活动-基础信息")

    goto(page, "#/interest-groups/interest-group-activity-detail/101")
    save(page, "后台-活动详情-页面整体")
    save(page, "后台-活动详情-头部操作", ".activity-detail-header-card")
    page.get_by_role("tab", name="报名").click()
    page.wait_for_timeout(500)
    save(page, "后台-活动详情-报名Tab")
    page.get_by_role("tab", name="签到码").click()
    page.wait_for_timeout(500)
    save(page, "后台-活动详情-签到码Tab")
    page.get_by_role("tab", name="评论").click()
    page.wait_for_timeout(500)
    save(page, "后台-活动详情-评论Tab")
    page.get_by_role("tab", name="精彩瞬间").click()
    page.wait_for_timeout(500)
    save(page, "后台-活动详情-瞬间Tab")

    goto(page, "#/interest-groups/interest-group-activity-detail/104")
    save(page, "后台-活动详情-待审核活动")

    goto(page, "#/interest-groups/interest-group-categories")
    save(page, "后台-分类管理-页面整体")
    page.get_by_role("button", name="新建分类").click()
    page.wait_for_selector(".ant-modal", timeout=8000)
    page.wait_for_timeout(300)
    save(page, "后台-分类管理-新建弹窗", ".ant-modal")
    page.keyboard.press("Escape")

    goto(page, "#/interest-groups/interest-group-rules")
    save(page, "后台-规则设置-页面整体", full=True)
    save(page, "后台-规则设置-创建权限", ".ig-create-permission-card")
    save(page, "后台-规则设置-活动积分", ".activity-point-rules-card")


def h5_home(page) -> None:
    page.set_viewport_size({"width": 390, "height": 844})
    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.wait_for_timeout(800)
    save(page, "H5-首页-页面整体")
    save(page, "H5-首页-搜索入口", ".c-ig-search-wrap")
    save(page, "H5-首页-快捷入口", ".c-ig-shortcuts")
    save(page, "H5-首页-热门兴趣圈", ".c-ig-block.is-groups")
    save(page, "H5-首页-活动Tab", ".c-ig-tabs")
    save(page, "H5-首页-活动列表", ".c-ig-acts")


def click_shortcut(page, label: str) -> None:
    page.locator(".c-ig-shortcut", has_text=label).first.click()
    page.wait_for_timeout(600)


def h5_flows(page) -> None:
    page.set_viewport_size({"width": 390, "height": 844})

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-searchbar").click()
    page.wait_for_timeout(500)
    save(page, "H5-搜索-页面整体")
    page.locator(".c-ig-stack-back").click()
    page.wait_for_timeout(300)

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    click_shortcut(page, "创建兴趣圈")
    save(page, "H5-创建兴趣圈-表单")
    save(page, "H5-创建兴趣圈-底部创建按钮", ".c-ig-form-bar")
    page.locator(".c-ig-stack-back").click()
    page.wait_for_timeout(300)

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    click_shortcut(page, "创建活动")
    save(page, "H5-创建活动-表单", full=True)
    save(page, "H5-创建活动-底部创建按钮", ".c-ig-form-bar")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    click_shortcut(page, "我的活动")
    save(page, "H5-我的活动-列表")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    click_shortcut(page, "我的兴趣圈")
    save(page, "H5-我的兴趣圈-列表")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-block.is-groups").get_by_text("全部", exact=True).click()
    page.wait_for_timeout(500)
    save(page, "H5-全部兴趣圈-列表")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.locator("section.c-ig-block").nth(1).get_by_text("全部", exact=True).click()
    page.wait_for_timeout(500)
    save(page, "H5-全部活动-列表")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-hscroll .c-ig-gcard, .c-ig-hscroll button, .c-ig-hscroll a, .c-ig-hscroll > *").first.click()
    page.wait_for_timeout(700)
    save(page, "H5-兴趣圈详情-页面整体")
    save(page, "H5-兴趣圈详情-加入或退出", ".c-ig-group-panel")
    page.get_by_role("button", name="成员").click()
    page.wait_for_timeout(400)
    save(page, "H5-兴趣圈详情-成员Tab")
    page.get_by_role("button", name="圈子").click()
    page.wait_for_timeout(400)
    save(page, "H5-兴趣圈详情-圈子Tab")
    page.locator(".c-ig-float").click()
    page.wait_for_timeout(300)

    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-acts li").first.click()
    page.wait_for_timeout(800)
    save(page, "H5-活动详情-页面整体", full=True)
    save(page, "H5-活动详情-底部报名", ".c-h5-detail-fab, .c-ig-cta, .c-ig-form-bar, footer")

    # pick enroll overlay if present
    if page.get_by_text("选择场次", exact=False).count() or page.locator(".c-ig-session").count():
        save(page, "H5-活动详情-场次选择")

    goto(page, "#/c/h5/ig-checkin/101", ".c-signup-page, .c-checkin-msg, .c-checkin-ok")
    page.wait_for_timeout(600)
    save(page, "H5-扫码签到-结果页")


def pc_flows(page) -> None:
    page.set_viewport_size({"width": 1440, "height": 920})
    goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
    page.wait_for_timeout(800)
    save(page, "PC-首页-页面整体")
    save(page, "PC-首页-快捷入口", ".c-ig-shortcuts")
    save(page, "PC-首页-活动三列", ".c-ig-acts")

    page.locator(".c-ig-searchbar").click()
    page.wait_for_timeout(500)
    save(page, "PC-搜索-页面整体")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
    click_shortcut(page, "创建兴趣圈")
    save(page, "PC-创建兴趣圈-表单")
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
    click_shortcut(page, "创建活动")
    save(page, "PC-创建活动-表单", full=True)
    page.locator(".c-ig-stack-back").click()

    goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-acts li").first.click()
    page.wait_for_timeout(800)
    save(page, "PC-活动详情-页面整体")

    goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-hscroll").locator("xpath=./*").first.click()
    page.wait_for_timeout(700)
    save(page, "PC-兴趣圈详情-页面整体")


def extra_states(page) -> None:
    page.set_viewport_size({"width": 390, "height": 844})
    goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
    page.locator(".c-ig-searchbar").click()
    page.wait_for_timeout(400)
    page.locator("input").first.fill("zzzz无结果xyz")
    page.wait_for_timeout(400)
    save(page, "H5-搜索-空状态")

    page.set_viewport_size({"width": 1440, "height": 920})
    goto(page, "#/interest-groups/interest-group-list")
    page.get_by_placeholder("请输入兴趣圈名称").fill("zzzz无结果xyz")
    page.get_by_role("button", name="查询").click()
    page.wait_for_timeout(400)
    save(page, "后台-兴趣圈管理-空状态")


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(device_scale_factor=1)
        page = context.new_page()
        page.set_default_timeout(10000)
        admin(page)
        h5_home(page)
        h5_flows(page)
        pc_flows(page)
        extra_states(page)
        browser.close()
    print("done", ROOT)


if __name__ == "__main__":
    main()
