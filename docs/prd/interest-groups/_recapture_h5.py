#!/usr/bin/env python3
"""Recapture all H5 interest-group PRD screenshots (no 回主页 FAB)."""
from __future__ import annotations

from pathlib import Path

from playwright.sync_api import TimeoutError as PwTimeout
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent / "screenshots"
ROOT.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:5173/"


def save(page, name: str, selector: str | None = None, full: bool = False) -> None:
    path = ROOT / ("%s.png" % name)
    try:
        if selector:
            loc = page.locator(selector).first
            loc.wait_for(state="visible", timeout=10000)
            loc.screenshot(path=str(path))
        else:
            page.screenshot(path=str(path), full_page=full)
        body = page.inner_text("body")
        if "回主页" in body:
            print("WARN still 回主页", name)
        else:
            print("ok", name)
    except Exception as exc:  # noqa: BLE001
        print("fail", name, exc)


def bounce(page, hash_path: str, wait: str | None = None) -> None:
    page.goto(BASE + "#/c", wait_until="domcontentloaded")
    page.wait_for_timeout(120)
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    if wait:
        try:
            page.wait_for_selector(wait, timeout=15000)
        except PwTimeout:
            pass
    page.wait_for_timeout(450)


def home(page) -> None:
    bounce(page, "#/c/h5/interest-groups", ".c-ig-searchbar")


def open_apps(page, label: str) -> None:
    page.locator(".c-ig-apps-btn").first.click()
    page.wait_for_timeout(250)
    page.get_by_role("menuitem", name=label).click()
    page.wait_for_timeout(600)


def click_first_group(page) -> None:
    page.locator("[aria-label='热门兴趣圈'] .c-ig-group").first.click()
    page.wait_for_timeout(700)


def click_first_act(page) -> None:
    page.locator("ul[aria-label='活动列表'] .c-h5-card-button").first.click()
    page.wait_for_timeout(800)


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.set_default_timeout(12000)
        page.set_viewport_size({"width": 390, "height": 844})

        home(page)
        save(page, "H5-首页-页面整体", full=True)
        save(page, "H5-首页-搜索入口", ".c-ig-search-wrap")
        save(page, "H5-首页-热门兴趣圈", ".c-ig-block.is-groups")
        save(page, "H5-首页-活动Tab", ".c-ig-tabs")
        save(page, "H5-首页-活动列表", "ul[aria-label='活动列表']")
        save(page, "H5-首页-往期瞬间", "[aria-label='往期精彩回顾'], .c-ig-block.is-ended, section.c-ig-block:last-of-type")

        apps = page.locator(".c-ig-apps-btn").first
        apps.click()
        page.wait_for_timeout(300)
        save(page, "H5-首页-快捷入口", ".c-ig-apps-panel")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        home(page)
        page.locator(".c-ig-searchbar").first.click()
        page.wait_for_timeout(500)
        save(page, "H5-搜索-页面整体")
        page.locator("input").first.fill("zzzz无结果xyz")
        page.wait_for_timeout(400)
        save(page, "H5-搜索-空状态")

        home(page)
        open_apps(page, "创建兴趣圈")
        save(page, "H5-创建兴趣圈-表单")
        save(page, "H5-创建兴趣圈-底部创建按钮", ".c-ig-form-bar")

        home(page)
        open_apps(page, "创建活动")
        save(page, "H5-创建活动-表单", full=True)
        save(page, "H5-创建活动-底部创建按钮", ".c-ig-form-bar")

        home(page)
        open_apps(page, "我的活动")
        save(page, "H5-我的活动-列表")

        home(page)
        open_apps(page, "我的兴趣圈")
        save(page, "H5-我的兴趣圈-列表")

        home(page)
        page.locator(".c-ig-block.is-groups").get_by_text("全部", exact=True).first.click()
        page.wait_for_timeout(500)
        save(page, "H5-全部兴趣圈-列表")

        home(page)
        page.get_by_text("查看全部", exact=True).first.click()
        page.wait_for_timeout(500)
        save(page, "H5-全部活动-列表")

        home(page)
        click_first_group(page)
        save(page, "H5-兴趣圈详情-页面整体")
        save(page, "H5-兴趣圈详情-加入或退出", ".c-ig-group-panel")
        page.locator(".c-ig-gtabs button").filter(has_text="成员").click()
        page.wait_for_timeout(400)
        save(page, "H5-兴趣圈详情-成员Tab")
        page.locator(".c-ig-gtabs button").filter(has_text="圈子").click()
        page.wait_for_timeout(400)
        save(page, "H5-兴趣圈详情-圈子Tab")
        pub = page.get_by_role("button", name="发布瞬间")
        if pub.count():
            pub.first.click()
            page.wait_for_timeout(500)
            save(page, "H5-发布瞬间-表单")
        else:
            empty_pub = page.get_by_text("发布瞬间", exact=True)
            if empty_pub.count():
                empty_pub.first.click()
                page.wait_for_timeout(500)
                save(page, "H5-发布瞬间-表单")
            else:
                print("fail H5-发布瞬间-表单 no button")

        home(page)
        click_first_act(page)
        save(page, "H5-活动详情-页面整体", full=True)
        save(page, "H5-活动详情-底部报名", ".c-ig-detail-bar")
        cta = page.locator(".c-ig-stack .c-ig-cta")
        if cta.count() and cta.first.is_enabled():
            cta.first.click()
            page.wait_for_timeout(500)
        if page.locator(".c-ig-sheet").count():
            save(page, "H5-活动详情-场次报名", ".c-ig-sheet")
        else:
            save(page, "H5-活动详情-场次报名")

        bounce(page, "#/c/h5/ig-act-101/checkin?s=101-s1&t=ck-101-s1", ".c-signup-page")
        page.wait_for_timeout(600)
        save(page, "H5-扫码签到-结果页")

        bounce(page, "#/c/h5/interest-groups/moments", ".c-ig-stack-pad, .c-h5-shell")
        page.wait_for_timeout(600)
        save(page, "H5-往期精彩回顾-页面整体")

        # AI + banner: add via decoration (ephemeral Playwright profile)
        page.set_viewport_size({"width": 1440, "height": 920})
        bounce(page, "#/interest-groups/interest-group-layout", ".activity-deco-library")
        page.wait_for_timeout(400)
        if page.locator("[data-palette='ai']").count():
            page.locator("[data-palette='ai']").first.click()
            page.wait_for_timeout(250)
        if page.locator("[data-palette='banner']").count():
            page.locator("[data-palette='banner']").first.click()
            page.wait_for_timeout(250)
        save_btn = page.get_by_role("button", name="保存")
        if save_btn.count():
            save_btn.first.click()
            page.wait_for_timeout(400)

        page.set_viewport_size({"width": 390, "height": 844})
        home(page)
        save(page, "H5-首页-AI助手", ".c-ig-ai-entry")
        save(page, "H5-首页-轮播", ".c-home-banner, [aria-label='轮播图']")

        browser.close()
        print("done")


if __name__ == "__main__":
    main()
