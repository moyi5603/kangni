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
            loc.wait_for(state="visible", timeout=8000)
            loc.screenshot(path=str(path))
        else:
            page.screenshot(path=str(path), full_page=full)
        print("ok", name)
    except Exception as exc:
        print("fail", name, exc)


def goto(page, hash_path, wait=".ant-layout, .c-ig-scroll, .c-signup-page"):
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    try:
        page.wait_for_selector(wait, timeout=12000)
    except PwTimeout:
        pass
    page.wait_for_timeout(400)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.set_default_timeout(8000)

        page.set_viewport_size({"width": 1440, "height": 920})
        goto(page, "#/interest-groups/interest-group-activities")
        ai = page.get_by_role("button", name="AI 创建")
        if ai.count():
            ai.first.click()
            page.wait_for_timeout(400)
            save(page, "后台-活动管理-AI创建弹窗", ".ant-modal")
            page.keyboard.press("Escape")

        goto(page, "#/interest-groups/interest-group-detail/1")
        page.get_by_role("tab", name="成员").click()
        page.wait_for_timeout(400)
        add = page.get_by_role("button", name="添加成员")
        if add.count():
            add.first.click()
            page.wait_for_timeout(400)
            save(page, "后台-兴趣圈详情-添加成员弹窗", ".ant-modal")
            page.keyboard.press("Escape")

        page.set_viewport_size({"width": 390, "height": 844})
        goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
        page.locator(".c-ig-acts li").first.click()
        page.wait_for_timeout(800)
        save(page, "H5-活动详情-页面整体", full=True)
        save(page, "H5-活动详情-底部报名", ".c-ig-detail-bar")
        enroll = page.locator(".c-ig-cta")
        if enroll.count() and enroll.first.is_enabled():
            enroll.first.click()
            page.wait_for_timeout(500)
            save(page, "H5-活动详情-场次报名", ".c-ig-sheet")

        goto(page, "#/c/h5/interest-groups", ".c-ig-scroll")
        page.locator(".c-ig-searchbar").click()
        page.wait_for_timeout(400)
        page.locator("input").first.fill("zzzz无结果xyz")
        page.wait_for_timeout(400)
        save(page, "H5-搜索-空状态")

        goto(page, "#/c/h5/ig-act-101/checkin?s=101-s1&t=tok", ".c-signup-page")
        save(page, "H5-扫码签到-结果页")

        page.set_viewport_size({"width": 1440, "height": 920})
        goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
        save(page, "PC-首页-页面整体")
        save(page, "PC-首页-快捷入口", ".c-ig-shortcuts")
        save(page, "PC-首页-活动三列", ".c-ig-acts")

        page.locator(".c-ig-searchbar").click()
        page.wait_for_timeout(500)
        save(page, "PC-搜索-页面整体")

        goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
        page.locator(".c-ig-shortcut", has_text="创建兴趣圈").first.click()
        page.wait_for_timeout(500)
        save(page, "PC-创建兴趣圈-表单")

        goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
        page.locator(".c-ig-shortcut", has_text="创建活动").first.click()
        page.wait_for_timeout(500)
        save(page, "PC-创建活动-表单", full=True)

        goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
        page.locator(".c-ig-acts li").first.click()
        page.wait_for_timeout(800)
        save(page, "PC-活动详情-页面整体")
        save(page, "PC-活动详情-底部报名", ".c-ig-detail-bar")

        goto(page, "#/c/pc/interest-groups", ".c-ig-scroll")
        page.locator(".c-ig-hscroll").locator("xpath=./*").first.click()
        page.wait_for_timeout(700)
        save(page, "PC-兴趣圈详情-页面整体")

        goto(page, "#/interest-groups/interest-group-list")
        page.get_by_placeholder("请输入兴趣圈名称").fill("zzzz无结果xyz")
        page.get_by_role("button", name="查询").click()
        page.wait_for_timeout(400)
        save(page, "后台-兴趣圈管理-空状态")

        browser.close()
        print("done")


if __name__ == "__main__":
    main()
