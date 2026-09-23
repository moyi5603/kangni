#!/usr/bin/env python3
"""Capture mailbox PRD screenshots from local Vite."""
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
            loc.wait_for(state="visible", timeout=4000)
            loc.screenshot(path=str(path), timeout=8000)
        else:
            page.screenshot(path=str(path), full_page=False)
        SHOTS.append(f"{name}.png")
        print("ok", name)
    except Exception as exc:  # noqa: BLE001
        print("fail-el", name, str(exc)[:120])
        page.screenshot(path=str(path), full_page=False)
        SHOTS.append(f"{name}.png")
        print("page", name)


def goto(page, hash_path: str, wait: str = ".ant-layout, .c-h5-shell, .c-pc-shell, .c-portal") -> None:
    page.goto(BASE + hash_path, wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    try:
        page.wait_for_selector(wait, timeout=12000)
    except PwTimeout:
        pass
    page.wait_for_timeout(400)


def admin(page) -> None:
    page.set_viewport_size({"width": 1440, "height": 900})
    goto(page, "#/mailbox/mailbox-overview")
    save(page, "信箱应用-左侧菜单", ".ant-layout-sider")
    save(page, "后台-概览-页面整体")
    save(page, "后台-概览-日期范围", ".overview-date-range")
    save(page, "后台-概览-KPI指标卡", ".overview-kpi-grid")
    save(page, "后台-概览-建言信箱分布", ".overview-chart-card:has-text('建言信箱分布')")
    save(page, "后台-概览-回复情况", ".overview-chart-card:has-text('回复情况')")
    save(page, "后台-概览-待回复建言", ".ant-card:has-text('待回复建言')")

    goto(page, "#/mailbox/mailbox-list")
    save(page, "后台-信箱列表-页面整体")
    save(page, "后台-信箱列表-工具栏", ".ant-card")
    save(page, "后台-信箱列表-列表表格", ".ant-table")
    save(page, "后台-信箱列表-行操作", ".ant-table-tbody tr.ant-table-row")
    more = page.locator(".ant-table-tbody tr.ant-table-row").first.get_by_role("button", name="更多")
    if more.count():
        more.first.click()
        page.wait_for_timeout(300)
        save(page, "后台-信箱列表-更多菜单", ".ant-dropdown")
        stop = page.locator(".ant-dropdown").get_by_text("停用", exact=True)
        if stop.count():
            stop.first.click()
            page.wait_for_timeout(400)
            save(page, "后台-信箱列表-停用确认", ".ant-modal")
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        else:
            page.keyboard.press("Escape")

    page.get_by_role("button", name="新建信箱").click()
    page.wait_for_timeout(800)
    save(page, "后台-新建信箱-表单页")
    save(page, "后台-新建信箱-图片与名称", ".edit-form")
    save(page, "后台-新建信箱-可见范围", ".ant-form-item:has-text('可见范围')")
    page.locator(".ant-form-item:has-text('可见范围')").get_by_text("按部门", exact=True).click()
    page.wait_for_timeout(250)
    save(page, "后台-新建信箱-按部门", ".ant-form-item:has-text('选择部门')")
    page.get_by_text("自定义人群", exact=True).click()
    page.wait_for_timeout(250)
    save(page, "后台-新建信箱-自定义人群", ".ant-form-item:has-text('选择人员')")
    page.get_by_text("导入人群", exact=True).click()
    page.wait_for_timeout(250)
    save(page, "后台-新建信箱-导入人群", ".ant-form-item:has-text('导入人群')")
    page.get_by_text("全员", exact=True).click()
    page.locator(".ant-form-item:has-text('响应时效')").get_by_role("switch").click()
    page.wait_for_timeout(250)
    save(page, "后台-新建信箱-响应时效", ".ant-form-item:has-text('响应时效')")
    save(page, "后台-新建信箱-底栏操作", ".sticky-form-actions")
    page.locator(".sticky-form-actions .ant-btn-primary").click(force=True)
    page.wait_for_timeout(400)
    save(page, "后台-新建信箱-校验错误", ".edit-form")

    goto(page, "#/mailbox/mailbox-edit/3")
    save(page, "后台-编辑信箱-表单页")

    goto(page, "#/mailbox/mailbox-detail/3")
    save(page, "后台-信箱详情-页面整体")
    save(page, "后台-信箱详情-标题与操作", ".forum-board-title-row")
    save(page, "后台-信箱详情-信息描述", ".ant-descriptions")
    save(page, "后台-信箱详情-建言列表", ".ant-table")

    goto(page, "#/mailbox/advice-detail/3")
    save(page, "后台-建言详情-已回复-页面整体")
    save(page, "后台-建言详情-基本信息", ".ant-card:has-text('基本信息')")
    save(page, "后台-建言详情-内容", ".ant-card:has-text('内容')")
    save(page, "后台-建言详情-处理人回复", ".ant-card:has-text('处理人回复')")
    save(page, "后台-建言详情-回复建言", ".ant-card:has-text('回复建言')")

    goto(page, "#/mailbox/advice-detail/6")
    save(page, "后台-建言详情-待回复-页面整体")
    save(page, "后台-建言详情-待回复表单", ".moment-inline-reply")

    goto(page, "#/mailbox/advice-detail/9")
    save(page, "后台-建言详情-已驳回种子", ".ant-card:has-text('基本信息')")

    goto(page, "#/mailbox/mailbox-detail/999")
    save(page, "后台-信箱详情-空态", ".ant-empty")


def h5(page) -> None:
    page.set_viewport_size({"width": 390, "height": 844})
    goto(page, "#/c/h5/mailbox", ".c-h5-shell")
    save(page, "H5-信箱列表-页面整体", ".c-h5-frame")
    save(page, "H5-信箱列表-顶栏", ".c-mailbox-hero")
    save(page, "H5-信箱列表-信箱卡片", ".c-mailbox-dirs")
    save(page, "H5-信箱列表-我的建言", ".c-mailbox-mine")
    purposes = page.locator(".c-mailbox-purpose")
    if purposes.count() > 1:
        purposes.nth(1).click()
        page.wait_for_timeout(250)
        save(page, "H5-信箱列表-简介展开", ".c-mailbox-dir")
    page.get_by_role("button", name="提交 战略发展建言").first.click()
    page.wait_for_timeout(500)
    save(page, "H5-提交建言-弹层", ".c-forum-overlay-panel")
    page.locator(".c-forum-submit").click()
    page.wait_for_timeout(400)
    save(page, "H5-提交建言-标题校验", ".c-h5-shell")
    page.locator(".c-forum-overlay-scrim").click(force=True)
    page.wait_for_timeout(200)

    goto(page, "#/c/h5/mailbox?empty=1", ".c-h5-shell")
    save(page, "H5-信箱列表-空建言", ".c-mailbox-mine")

    goto(page, "#/c/h5/mailbox/22", ".c-h5-shell")
    save(page, "H5-建言详情-页面整体", ".c-h5-frame")
    save(page, "H5-建言详情-内容卡片", ".c-mailbox-detail-card")

    goto(page, "#/c/h5/mailbox/999", ".c-h5-shell")
    save(page, "H5-建言详情-不存在", ".c-mailbox-empty")


def pc(page) -> None:
    page.set_viewport_size({"width": 1440, "height": 900})
    goto(page, "#/c/pc/mailbox", ".c-pc-shell")
    save(page, "PC-信箱列表-页面整体")
    save(page, "PC-信箱列表-顶栏", ".c-pc-header")
    save(page, "PC-信箱列表-信箱卡片", ".c-mailbox-dirs")
    save(page, "PC-信箱列表-我的建言", ".c-mailbox-mine")
    page.get_by_role("button", name="提交 员工体验建言").first.click()
    page.wait_for_timeout(500)
    save(page, "PC-提交建言-弹层", ".c-forum-overlay-panel")
    page.locator(".c-forum-overlay-scrim").click(force=True)

    goto(page, "#/c/pc/mailbox?empty=1", ".c-pc-shell")
    save(page, "PC-信箱列表-空建言", ".c-mailbox-mine")

    goto(page, "#/c/pc/mailbox/23", ".c-pc-shell")
    save(page, "PC-建言详情-页面整体")
    save(page, "PC-建言详情-内容卡片", ".c-mailbox-detail-card")
    save(page, "PC-建言详情-返回列表", ".c-mailbox-pc-back")

    goto(page, "#/c/pc/mailbox/999", ".c-pc-shell")
    save(page, "PC-建言详情-不存在", ".c-mailbox-empty")

    goto(page, "#/c", ".c-portal")
    save(page, "C端预览-入口页")


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        page = browser.new_page()
        admin(page)
        h5(page)
        pc(page)
        browser.close()
    (ROOT / "_manifest.json").write_text("[\n  " + ",\n  ".join(f'"{n}"' for n in SHOTS) + "\n]\n", encoding="utf-8")
    print("done", len(SHOTS))


if __name__ == "__main__":
    main()
