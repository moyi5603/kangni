#!/usr/bin/env python3
"""Recapture 2026-09-22 incentive UI deltas."""
from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent / "screenshots"
BASE = "http://127.0.0.1:5173/"


def save(page, name: str, selector: str | None = None) -> None:
    path = ROOT / f"{name}.png"
    if selector:
        loc = page.locator(selector).first
        loc.wait_for(state="visible", timeout=8000)
        loc.screenshot(path=str(path), timeout=8000)
    else:
        page.screenshot(path=str(path), full_page=False)
    print("ok", name)


def goto(page, hash_path: str) -> None:
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    page.wait_for_timeout(1000)


def close_drawer(page) -> None:
    close = page.locator(".ant-drawer-close")
    if close.count():
        close.first.click()
        page.wait_for_timeout(400)


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ap = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()

        goto(ap, "#/incentive/incentive-records")
        save(ap, "后台-发放记录-页面整体")
        save(ap, "后台-发放记录-列表表格", ".ant-table")
        ap.get_by_role("button", name="RK20260826004", exact=True).click()
        ap.wait_for_timeout(600)
        save(ap, "后台-发放记录-认可详情", ".ant-drawer-content-wrapper, .ant-drawer-content")
        save(ap, "后台-发放记录-详情附件", ".incentive-record-files, .ant-descriptions")
        close_drawer(ap)
        ap.get_by_role("button", name="RK20260826003", exact=True).click()
        ap.wait_for_timeout(600)
        save(ap, "后台-发放记录-表彰详情", ".ant-drawer-content-wrapper, .ant-drawer-content")
        close_drawer(ap)

        goto(ap, "#/incentive/incentive-dashboard")
        save(ap, "后台-概览-待办关注", ".ant-card:has-text('待办关注')")
        save(ap, "后台-概览-近期发放", ".ant-card:has-text('近期发放')")

        hp = browser.new_context(viewport={"width": 390, "height": 844}).new_page()
        goto(hp, "#/c/h5/incentive/ranking")
        save(hp, "H5-热门勋章-页面整体")
        save(hp, "H5-热门勋章-筛选条", ".c-incentive-filters")
        save(hp, "H5-热门勋章-勋章条", ".mobile-medal-tab-strip")
        save(hp, "H5-热门勋章-获得名单", ".mobile-medal-recipient-list")
        hp.get_by_role("button", name="公司表彰").click()
        hp.wait_for_timeout(500)
        save(hp, "H5-热门勋章-公司表彰")
        row = hp.locator(".mobile-medal-recipient-row").first
        if row.count():
            row.click()
            hp.wait_for_timeout(700)
            save(hp, "H5-公司表彰-光荣事迹")

        goto(hp, "#/c/h5/incentive")
        save(hp, "H5-首页-热门勋章", ".mobile-home-ranking-card")

        pp = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
        goto(pp, "#/c/pc/incentive")
        save(pp, "PC-首页-页面整体")
        save(pp, "PC-首页-热门勋章", ".mobile-home-ranking-card")
        save(pp, "PC-首页-热门筛选", ".c-incentive-home-filters")

        goto(pp, "#/c/pc/incentive/ranking")
        save(pp, "PC-热门勋章-页面整体")
        save(pp, "PC-热门勋章-筛选条", ".c-incentive-filters")

        browser.close()


if __name__ == "__main__":
    main()
