# 活动扫码签到

日期：2026-08-26

## 目标

活动高级设置可开启扫码签到。现场展示二维码，员工用系统相机扫码打开 H5 落地页完成签到。必须已报名且报名已通过；多场次须对上扫到的场次。静态码每场不同。

## 角色

- 运营：配置规则、在活动详情「签到码」下载/全屏亮码。
- 员工（演示账号陈产品）：扫码进入 H5 签到页。

## 规则

- 开扫：`before_start` 为开始前 X 分钟（默认 30）；`after_start` 为开始时刻起。
- 关扫：该场 `startAt` 起算，X 天/小时（默认 3 天）。
- 动态码：URL token 按 5 分钟时间桶变化；过期桶失败。静态码 token 固定且每场不同。
- 单场活动使用虚拟场次 id `once`。
- 同一报名、同一场次重复扫：提示已签到，不改时间。多场次报名可分别签到各场。
- 未开启 / 错码 / 未到点 / 过期 / 未报名 / 未通过 / 场次不符：失败文案。

## 数据

活动：`checkInEnabled`、`checkInOpenMode`、`checkInOpenMinutesBefore`、`checkInValidAfterStart`、`checkInValidAfterStartUnit`、`checkInDynamicQr`、`checkInToken`（单场）。场次：`checkInToken`。报名：`checkIns: Record<sessionId, datetime>`。

## 界面

- 表单高级设置：开关后出开扫方式、有效期、动态码。
- 详情 tab「签到码」：未开启空状态；开启后每场一码，下载与全屏；动态码全屏刷新。
- 报名名单「签到」列。
- H5 `#/c/h5/{id}/checkin?s=&t=`。无内置摄像头扫码器。

## 非目标

独立签到流水、员工出示个人码、PC 扫码页、未报名补报。
