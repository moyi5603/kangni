# 投票 v2：选项详情多选与首页共享选中态

## 目标

多选活动在选项详情可勾选/取消；选中列表与 C 端首页同一份；提交走 `castVoteV2Many` + min/max。单选详情不变。

## 方案

- `voteV2SelectionStore`：按 `campaignId` 存已选 `number[]`
- API：`get` / `use` / `toggle` / `clear` / `set` / `__resetForTests`
- C 端首页 `VoteV2PhonePreview`（`framed=false`）接 store；后台表单预览仍本地 state
- 详情多选：CTA 选择/取消；有选中时出确认条；「投票」未达 min 时 **disabled**
- 提交成功 clear；触顶 max 时 toast

## 非目标

- 不改单选详情
- 选中态不 persist（刷新清空）
