# 评优管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** B 端评优应用落地评优管理列表/新建编辑/详情占位，以及评优证书管理。

**Architecture:** `features/awards` 本地 mock。状态由三个时间戳相对 now 推导。勋章与组织树复用活动模块。导航增加「评优证书」一级菜单。

**Tech Stack:** React、TypeScript、Ant Design、Vitest、现有 ListPage / hash 路由。

**Spec:** `docs/superpowers/specs/2026-08-24-award-management-design.md`

---

## File map

- Create: `src/features/awards/model/award.ts` 及测试
- Create: `src/features/awards/model/awardStore.ts` 及测试
- Create: `src/features/awards/model/awardCertificate.ts`、`awardCertificateStore.ts` 及测试
- Create: `src/features/awards/pages/AwardListPage.tsx` 及测试
- Create: `src/features/awards/pages/AwardFormPage.tsx` 及测试
- Create: `src/features/awards/pages/AwardDetailPage.tsx` 及测试
- Create: `src/features/awards/pages/AwardCertificateListPage.tsx` 及测试
- Modify: `src/app/navigation.ts`、`navigation.test.ts`、`App.tsx`

执行顺序：模型 TDD → store TDD → 导航测试 → 页面 → 接入 App → vitest + UI conformance。

已落地。`npx vitest run src/features/awards src/app/navigation.test.ts`：82 PASS。评优页面无 `layout=vertical`。全仓 `check_ui_conformance.py` 仍失败在既有考试页（非本轮）。
