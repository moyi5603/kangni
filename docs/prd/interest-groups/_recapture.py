#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from playwright.sync_api import TimeoutError as PwTimeout
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent / "screenshots"
BASE = "http://127.0.0.1:5173/"


def save(page, name, selector=None, full=False):
    path = ROOT / ("%s.png" % name)
    try:
        if selector:
            loc = page.locator(selector).first
            loc.wait_for(state="visible", timeout=10000)
            loc.screenshot(path=str(path))
        else:
            page.screenshot(path=str(path), full_page=full)
        print("ok", name)
    except Exception as exc:
        print("fail", name, exc)


def goto(page, hash_path, wait=None):
    page.goto(BASE + "#/c")
    page.wait_for_timeout(150)
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    if wait:
        try:
            page.wait_for_selector(wait, timeout=15000)
        except PwTimeout:
            pass
    page.wait_for_timeout(400)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.set_default_timeout(10000)

        page.set_viewport_size({"width": 1440, "height": 920})
        goto(page, "#/interest-groups", ".overview-page")
        save(page, "后台-概览-页面整体")
        save(page, "后台-应用-左侧菜单", ".ant-layout-sider")
        save(page, "后台-概览-KPI指标卡", ".overview-kpi-grid")
        save(page, "后台-概览-分布图", ".overview-chart-row")
        save(page, "后台-概览-待办表")
        save(page, "后台-概览-日期筛选", ".overview-page .list-page-heading, .page-stack > .list-page-heading")

        goto(page, "#/interest-groups/interest-group-list", ".ant-table, .media-entity-card-grid")
        save(page, "后台-兴趣圈管理-页面整体")
        save(page, "后台-兴趣圈管理-查询筛选", ".search-card")
        save(page, "后台-兴趣圈管理-列表表格", ".ant-table")
        seg = page.locator(".ant-segmented").filter(has_text="卡片")
        if seg.count():
            page.get_by_text("卡片", exact=True).first.click()
            page.wait_for_timeout(400)
            save(page, "后台-兴趣圈管理-卡片视图")
            page.get_by_text("列表", exact=True).first.click()
            page.wait_for_timeout(300)

        goto(page, "#/interest-groups/interest-group-detail/1", ".activity-detail-header-card")
        save(page, "后台-兴趣圈详情-页面整体")
        save(page, "后台-兴趣圈详情-头部卡片", ".activity-detail-header-card")

        goto(page, "#/interest-groups/interest-group-detail/5", ".activity-detail-header-card")
        save(page, "后台-兴趣圈详情-待审核状态")

        goto(page, "#/interest-groups/interest-group-activities", ".ant-table, .ig-activity-card-grid")
        save(page, "后台-活动管理-页面整体")
        save(page, "后台-活动管理-查询筛选", ".search-card")
        save(page, "后台-活动管理-列表表格", ".ant-table")
        if page.get_by_text("卡片", exact=True).count():
            page.get_by_text("卡片", exact=True).first.click()
            page.wait_for_timeout(400)
            save(page, "后台-活动管理-卡片视图")

        goto(page, "#/interest-groups/interest-group-activity-detail/101/signups", ".ant-table, .page-stack")
        save(page, "后台-活动详情-报名Tab")
        goto(page, "#/interest-groups/interest-group-activity-detail/301", ".activity-detail-header-card")
        save(page, "后台-活动详情-未发布活动", ".activity-detail-header-card")

        goto(page, "#/interest-groups/interest-group-layout", ".activity-deco-workbench")
        save(page, "后台-兴趣圈装修-页面整体")
        save(page, "后台-兴趣圈装修-组件面板", ".activity-deco-library")
        save(page, "后台-兴趣圈装修-画布", ".activity-deco-canvas")
        save(page, "后台-兴趣圈装修-配置区", ".activity-deco-inspector")

        goto(page, "#/interest-groups/interest-group-layout-pc", ".activity-deco-workbench")
        save(page, "后台-兴趣圈装修-PC画布", ".activity-deco-canvas")

        page.set_viewport_size({"width": 390, "height": 844})
        goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
        save(page, "H5-首页-页面整体", full=True)
        save(page, "H5-首页-轮播", ".c-home-banner, .c-banner, .home-banner")
        save(page, "H5-首页-搜索入口", ".c-ig-search-wrap")
        save(page, "H5-首页-AI助手", ".c-ig-ai-entry")
        save(page, "H5-首页-热门兴趣圈", ".c-ig-block.is-groups")
        save(page, "H5-首页-活动Tab", ".c-ig-tabs")
        save(page, "H5-首页-活动列表", "ul[aria-label='活动列表']")
        save(page, "H5-首页-往期瞬间", ".c-ig-past, .c-past-sec, section.c-ig-block:last-of-type")
        apps = page.locator(".c-ig-apps-btn").first
        if apps.count():
            apps.click()
            page.wait_for_timeout(300)
            save(page, "H5-首页-快捷入口", ".c-ig-apps-panel")
            page.keyboard.press("Escape")

        goto(page, "#/c/h5/interest-groups/moments", ".c-ig-stack-pad, .c-past-sec, .c-h5-shell")
        save(page, "H5-往期精彩回顾-页面整体")

        page.set_viewport_size({"width": 1440, "height": 920})
        goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
        save(page, "PC-首页-页面整体")
        save(page, "PC-首页-AI助手", ".c-ig-ai-entry")
        save(page, "PC-首页-活动三列", "ul[aria-label='活动列表']")
        apps = page.locator(".c-ig-apps-btn").first
        if apps.count():
            apps.click()
            page.wait_for_timeout(300)
            save(page, "PC-首页-快捷入口", ".c-ig-apps-panel")

        goto(page, "#/c/pc/interest-groups/moments", ".c-pc-ig-home")
        save(page, "PC-往期精彩回顾-页面整体")

        browser.close()
        print("done")


if __name__ == "__main__":
    main()
