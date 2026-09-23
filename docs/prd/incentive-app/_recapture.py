#!/usr/bin/env python3
"""Recapture failed / misaligned incentive screenshots."""
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


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ap = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()

        goto(ap, "#/incentive/incentive-records")
        save(ap, "后台-发放记录-查询筛选", ".search-card")
        ap.get_by_role("button", name="展开").click()
        ap.wait_for_timeout(400)
        save(ap, "后台-发放记录-查询筛选展开", ".search-card")
        ap.get_by_role("button", name="发布公司表彰").click()
        ap.wait_for_timeout(600)
        save(ap, "后台-发放记录-发布表彰抽屉", ".ant-drawer-content-wrapper, .ant-drawer-content")
        close = ap.locator(".ant-drawer-close")
        if close.count():
            close.first.click()
        ap.wait_for_timeout(500)
        ap.get_by_role("button", name="RK20260826001", exact=True).click()
        ap.wait_for_timeout(600)
        save(ap, "后台-发放记录-认可详情", ".ant-drawer-content-wrapper, .ant-drawer-content")
        reject = ap.get_by_role("button", name="驳回")
        if reject.count():
            reject.first.click()
            ap.wait_for_timeout(400)
            save(ap, "后台-发放记录-驳回弹窗", ".ant-modal-content")
            ap.keyboard.press("Escape")

        goto(ap, "#/incentive/incentive-dashboard")
        try:
            ap.get_by_role("button", name="RK20260826001", exact=True).click(timeout=4000)
            ap.wait_for_timeout(500)
            save(ap, "后台-概览-认可详情抽屉", ".ant-drawer-content-wrapper, .ant-drawer-content")
            ap.keyboard.press("Escape")
        except Exception as exc:  # noqa: BLE001
            print("skip dashboard drawer", exc)

        goto(ap, "#/incentive/incentive-badges")
        ap.get_by_role("button", name="归属与分类管理").click()
        ap.wait_for_timeout(600)
        save(ap, "后台-勋章管理-分类抽屉", ".ant-drawer-content-wrapper, .ant-drawer-content")

        goto(ap, "#/incentive/incentive-settings")
        save(ap, "后台-规则设置-查询筛选", ".search-card")
        ap.get_by_role("tab", name="填写设置").click()
        ap.wait_for_timeout(400)
        save(ap, "后台-规则设置-填写设置")
        ap.get_by_role("tab", name="风控设置").click()
        ap.wait_for_timeout(500)
        save(ap, "后台-规则设置-风控设置")
        save(ap, "后台-规则设置-审核设置", ".ant-card:has-text('同事认可审核')")
        save(ap, "后台-规则设置-异常监控", ".ant-card:has-text('异常监控设置')")

        hp = browser.new_context(viewport={"width": 390, "height": 844}).new_page()
        goto(hp, "#/c/h5/incentive/issue")
        hp.get_by_role("button", name="查看详情").first.click()
        hp.wait_for_timeout(700)
        save(hp, "H5-发放勋章-勋章详情抽屉")
        hp.keyboard.press("Escape")
        hp.wait_for_timeout(300)
        hp.locator(".mobile-badge-issue-trigger").first.click()
        hp.wait_for_timeout(500)
        hp.locator(".mobile-target-picker").click()
        hp.wait_for_timeout(600)
        save(hp, "H5-发放勋章-对象选择树")

        goto(hp, "#/c/h5/incentive/profile")
        hp.locator(".honor-badge-grid button").first.click()
        hp.wait_for_timeout(600)
        save(hp, "H5-个人中心-勋章详情")

        browser.close()


if __name__ == "__main__":
    main()
