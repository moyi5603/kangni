#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import _gen_prd as g

g.CSS += """
    .status.p0 { background:#fee2e2; color:#991b1b; }
    .note { background:#f8fafc; border-left:3px solid #0f766e; padding:8px 12px; margin:12px 0; }
"""


def fig(src: str, path: str, desc: str) -> str:
    return (
        f'<figure><img src="screenshots/{src}" alt="{path}截图">'
        f'<figcaption><span class="component-path">{path}</span>：{desc}</figcaption></figure>'
    )


def table(headers: list[str], rows: list[list[str]]) -> str:
    head = "".join(f"<th>{h}</th>" for h in headers)
    body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in row) + "</tr>" for row in rows)
    return f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


impl = '<span class="status impl">代码已实现</span>'
guess = '<span class="status guess">根据页面推测需要</span>'
todo = '<span class="status todo">待确认</span>'

TOC = [
    ("doc-note", "1. 文档说明"),
    ("overview", "2. 产品概述"),
    ("ia", "3. 页面结构 / 信息架构"),
    ("implemented-features", "4. 已实现功能清单"),
    ("flows", "5. 用户流程"),
    ("page-requirements", "6. 页面级需求说明"),
    ("data-fields", "7. 数据字段与枚举"),
    ("apis", "8. API / 数据接口清单"),
    ("non-functional", "9. 非功能需求"),
    ("analytics", "10. 埋点与指标建议"),
    ("acceptance", "11. 验收标准"),
    ("risks", "12. 风险与待确认问题"),
]

body = f"""
<section id="doc-note">
  <h2>1. 文档说明</h2>
  <ul>
    <li>文档来源：基于现有 HTML/CSS/JavaScript（React + Ant Design 原型）反向分析</li>
    <li>分析范围：信箱后台（独立应用 <code>mailbox</code>）、C 端 H5、C 端 PC</li>
    <li>生成日期：2026-09-22（相对 09-21 稿：信箱列表改为上移/下移且去掉批量停用；C 端负责人改为「姓名 · 部门」；我的建言空态改为「已有 N 条建言」）</li>
    <li>主要代码：<code>src/standalone/mailbox/</code>、<code>src/features/forum/pages/</code>、<code>src/features/c-end/forum/h5/H5Mailbox*.tsx</code>、<code>src/features/c-end/forum/pc/PcMailbox*.tsx</code>、<code>src/features/forum/model/forumStore.ts</code></li>
    <li>可信度说明：交互以页面代码为准。C 端信箱卡片文案来自常量 <code>MAILBOX_H5_DIRECTIONS</code>，与后台信箱列表不是同一份数据。</li>
    <li>待确认事项摘要：C 端为何只展示 2 个入口、后台「响应时效到期前 1 小时提醒」无发送实现、建言「已驳回」在 C 端列表被隐藏。</li>
    <li>输出格式：HTML 图文需求文档</li>
  </ul>
</section>

<section id="overview">
  <h2>2. 产品概述</h2>
  <p><strong>产品定位：</strong>企业内建言信箱。员工按方向提交建言，后台配置信箱、查看并回复。</p>
  <p><strong>目标用户：</strong>后台运营/信箱负责人/回复人；C 端员工（当前原型固定登录身份 <code>周敏</code>）。</p>
  <p><strong>核心使用场景：</strong>配置信箱 → 员工提交（可匿名）→ 后台回复 → 员工在「我的建言」看状态与回复。</p>
  <p><strong>页面/系统主要价值：</strong>把建言与论坛帖子拆成独立应用；后台强调处理闭环（待回复/已回复），C 端强调按入口提交与查看自己的建言。</p>
  {fig("C端预览-入口页.png", "C端预览-入口页-应用入口", "门户提供「信箱 H5」「信箱 PC」及空数据预览链接。")}
</section>

<section id="ia">
  <h2>3. 页面结构 / 信息架构</h2>
  {fig("信箱应用-左侧菜单.png", "后台-框架-左侧菜单", "菜单仅「概览」「信箱列表」。建言详情、新建/编辑不进菜单，由列表/KPI/行操作进入。")}
  <ul>
    <li>后台 Hash：<code>#/mailbox/mailbox-overview</code>、<code>#/mailbox/mailbox-list</code>、<code>#/mailbox/mailbox-create</code>、<code>#/mailbox/mailbox-edit/:id</code>、<code>#/mailbox/mailbox-detail/:id</code>、<code>#/mailbox/advice-detail/:id</code>。另有 <code>mailbox-messages</code> 路由可渲染建言表，菜单未挂。</li>
    <li>H5：<code>#/c/h5/mailbox</code> 列表；<code>#/c/h5/mailbox/:id</code> 建言详情；<code>?empty=1</code> 把「我的建言」置空。</li>
    <li>PC：<code>#/c/pc/mailbox</code>、<code>#/c/pc/mailbox/:id</code>，结构与 H5 同模块。</li>
    <li>组件命名：<code>页面-模块-组件名称</code></li>
  </ul>
  <p class="note">C 端入口卡片写死「战略发展建言 / 员工体验建言」两张，后台种子信箱有 4 个（员工体验、经营发展、人才发展、建言献策）。列表与后台配置未打通。</p>
</section>

<section id="implemented-features">
  <h2>4. 已实现功能清单</h2>
  {table(
    ["模块", "功能点", "功能说明", "页面/区域", "状态"],
    [
      ["后台概览", "日期筛选+KPI+饼图+待回复表", "按创建/提交日过滤；信箱数、建言数可点进列表；待回复行点「回复」进建言详情", "后台-概览", impl],
      ["后台信箱列表", "表格 CRUD 排序启停", "新建、详情、上移/下移（同 kind 内交换）、编辑、启用/停用；无勾选、无批量停用、无查询区", "后台-信箱列表", impl],
      ["后台信箱表单", "配置信箱", "图片、名称、简介、可见范围、负责人（单选且互斥）、回复人、标签（tags 模式）、匿名、响应时效", "后台-新建/编辑信箱", impl],
      ["后台信箱详情", "只读信息+嵌套建言表", "启用/停用、编辑；无「查看链接」", "后台-信箱详情", impl],
      ["后台建言详情", "查看并回复", "处理人回复可累加；无帖子式评论/置顶/下架/链接", "后台-建言详情", impl],
      ["C 端列表", "入口+我的建言", "负责人展示「姓名 · 部门」；点照片/标题打开提交层；点建言进详情；简介≥70 字可展开；无我的建言时显示「已有 N 条建言」（N=可见信箱建言总数，含他人）", "H5/PC-信箱列表", impl],
      ["C 端提交", "提交建言 overlay", "标题必填；图最多 9 张；信箱允许匿名时显示「匿名发帖」", "H5/PC-提交建言", impl],
      ["C 端详情", "看内容与回复", "仅当前用户可见建言；不存在显示空文案", "H5/PC-建言详情", impl],
    ],
  )}
</section>

<section id="flows">
  <h2>5. 用户流程</h2>
  <h3>5.1 员工提交建言</h3>
  <p>入口：H5/PC 信箱列表 → 点入口照片或标题 → 填写标题/内容/图片/可选匿名 → 点「提交」→ <code>publishClientTopic</code> 成功 toast「已提交」并关层；标题为空 toast「请填写标题」，弹层保持打开。</p>
  <h3>5.2 后台回复</h3>
  <p>入口：概览待回复「回复」或信箱详情建言标题/「详情」→ 建言详情「回复建言」选账号填内容点「确认」→ <code>setChairmanReply</code> 追加回复，message「已回复建言」。内容空校验「请输入回复内容」。账号必须是陈产品/论坛小助手/官方客服。</p>
  <h3>5.3 停用信箱</h3>
  <p>列表行「更多」里的停用，或详情页停用 → 确认弹窗 → <code>setForumBoardStatus(..., 'disabled')</code> → message「已停用」。文案写前台不可访问；C 端入口常量不读 status，{todo} 停用后 C 端入口是否消失。信箱列表不再提供批量停用。</p>
  <h3>5.4 调整信箱顺序</h3>
  <p>列表行「上移」「下移」调用 <code>moveForumBoard(id, -1|1)</code>，只在相同 <code>kind===mailbox</code> 的记录之间互换位置。第一行上移、最后一行下移 disabled。无成功 toast。</p>
</section>

<section id="page-requirements">
  <h2>6. 页面级需求说明</h2>

  <article>
    <h3>6.1 后台-概览</h3>
    <h4>页面目标</h4>
    <p>看时间范围内信箱规模与回复进度，从待回复直接处理。</p>
    {fig("后台-概览-页面整体.png", "后台-概览-页面整体", "默认日期从 2026-08-01 到当天；含 KPI、两张饼图、待回复表。")}
    {fig("后台-概览-日期范围.png", "后台-概览-日期范围", "日/月切换与近 7/30 天。改范围会重算 KPI、饼图、待回复行。")}
    {fig("后台-概览-KPI指标卡.png", "后台-概览-KPI指标卡", "信箱数、建言数点击 <code>onNavigate('mailbox-list')</code>。待回复、已回复无点击。口径：已回复看 <code>chairmanReply</code> 是否有值，与 C 端「有回复数组即已回复」不完全同一。")}
    {fig("后台-概览-建言信箱分布.png", "后台-概览-建言信箱分布", "各信箱建言条数饼图。")}
    {fig("后台-概览-回复情况.png", "后台-概览-回复情况", "已回复绿、待回复橙。")}
    {fig("后台-概览-待回复建言.png", "后台-概览-待回复建言", "最多 8 条无 <code>chairmanReply</code> 的建言，按提交时间倒序。空态文案「暂无待回复建言」。")}
    <h4>组件显示逻辑</h4>
    {table(
      ["组件路径", "组件类型", "默认状态", "显示/隐藏逻辑", "启用/禁用逻辑", "数据来源", "状态变化", "空/错/加载状态", "权限/条件控制"],
      [
        ["后台-概览-KPI指标卡", "指标卡", "显示四卡", "始终显示", "均可点，后两卡无跳转", "内存 boards/topics + 日期", "改日期重算", "无独立 loading", "无角色分流"],
        ["后台-概览-待回复建言", "表格", "有数据出表", "无行则 Empty", "回复始终可点", "buildMailboxPendingRows", "回复后需刷新才离开待回复", "Empty", "无"],
      ],
    )}
    <h4>操作说明</h4>
    {table(
      ["操作名称", "组件路径", "触发元素", "前置条件", "启用/禁用逻辑", "用户动作", "系统响应", "状态变化", "成功反馈", "失败反馈", "跳转/接口"],
      [
        ["回复", "后台-概览-待回复建言-回复", "链接按钮", "行存在", "始终启用", "点击", "进入建言详情", "无列表侧即时移除", "无", "无", "内存导航 advice-detail"],
        ["查看信箱列表", "后台-概览-KPI指标卡-信箱数", "卡片", "无", "始终启用", "点击", "进信箱列表", "无", "无", "无", "mailbox-list"],
      ],
    )}
    <h4>验收标准</h4>
    <p>Given 默认种子与默认日期 When 打开概览 Then 可见 4 个信箱 KPI。Given 待回复行 When 点回复 Then 打开对应建言详情。</p>
  </article>

  <article>
    <h3>6.2 后台-信箱列表</h3>
    <h4>页面目标</h4>
    <p>维护信箱主数据与启停。</p>
    {fig("后台-信箱列表-页面整体.png", "后台-信箱列表-页面整体", "面包屑「信箱 / 信箱列表」。无勾选列、无横向滚动（tableLayout=fixed）。")}
    {fig("后台-信箱列表-工具栏.png", "后台-信箱列表-工具栏", "「共 N 条」+「新建信箱」。不出现已选择计数，不出现批量停用。")}
    {fig("后台-信箱列表-列表表格.png", "后台-信箱列表-列表表格", "列：名称（图标+链接）、负责人、标签、状态、创建时间、操作。无选择列。分页 pageSize=20。")}
    {fig("后台-信箱列表-行操作.png", "后台-信箱列表-行操作", "actionsMaxVisible=3，外显「详情」「上移」「下移」。首行上移 disabled。")}
    {fig("后台-信箱列表-更多菜单.png", "后台-信箱列表-更多菜单", "溢出「编辑」「停用」。无「查看链接」。")}
    {fig("后台-信箱列表-停用确认.png", "后台-信箱列表-停用确认", "从更多菜单点停用后弹出。标题「停用信箱」，说明前台不可访问且保留历史。")}
    <h4>字段说明</h4>
    {table(
      ["列名", "组件路径", "数据含义", "格式", "是否可排序", "是否可筛选", "行操作"],
      [
        ["名称", "后台-信箱列表-列表表格-名称", "信箱 name + icon", "链接", "否", "否", "进详情"],
        ["负责人", "后台-信箱列表-列表表格-负责人", "board.manager", "文本", "否", "否", "—"],
        ["标签", "后台-信箱列表-列表表格-标签", "board.tags", "Tag，空为 —", "否", "否", "—"],
        ["状态", "后台-信箱列表-列表表格-状态", "enabled/disabled", "Badge 已启用/已停用", "否", "否", "停用/启用"],
        ["创建时间", "后台-信箱列表-列表表格-创建时间", "createdAt", "YYYY-MM-DD HH:mm", "否", "否", "—"],
      ],
    )}
    <h4>操作说明</h4>
    {table(
      ["操作名称", "组件路径", "触发元素", "前置条件", "启用/禁用逻辑", "用户动作", "系统响应", "状态变化", "成功反馈", "失败反馈", "跳转/接口"],
      [
        ["新建信箱", "后台-信箱列表-工具栏-新建信箱", "主按钮", "无", "始终", "点击", "打开表单页", "dirty 未保存离开会确认", "无", "无", "mailbox-create"],
        ["详情", "后台-信箱列表-行操作-详情", "链接/按钮", "行存在", "始终", "点击", "打开详情", "无", "无", "无", "mailbox-detail"],
        ["上移", "后台-信箱列表-行操作-上移", "按钮", "非第一行", "index<=0 时 disabled", "点击", "同 kind 相邻互换", "表格顺序变", "无 toast", "越界返回 false 无提示", "moveForumBoard(id,-1)"],
        ["下移", "后台-信箱列表-行操作-下移", "按钮", "非最后一行", "末行 disabled", "点击", "同 kind 相邻互换", "表格顺序变", "无 toast", "越界返回 false 无提示", "moveForumBoard(id,1)"],
        ["编辑", "后台-信箱列表-更多菜单-编辑", "更多菜单", "行存在", "始终", "点击", "打开编辑", "无", "无", "无", "mailbox-edit"],
        ["停用", "后台-信箱列表-更多菜单-停用", "更多菜单", "status=enabled", "文案随状态切换", "确认", "写 disabled", "Badge 变已停用", "message 已停用", "无", "内存 store"],
      ],
    )}
  </article>

  <article>
    <h3>6.3 后台-新建/编辑信箱</h3>
    <h4>页面目标</h4>
    <p>创建或改信箱配置。编辑记录不存在显示 Empty「信箱不存在或已删除」。</p>
    {fig("后台-新建信箱-表单页.png", "后台-新建信箱-表单页", "标题「新建信箱」，底栏固定创建/取消。")}
    {fig("后台-新建信箱-图片与名称.png", "后台-新建信箱-图片与名称", "信箱图片 picture-card，hint 3:4 ≤5MB；beforeUpload 返回 false，本地 FileReader 写入表单。名称 Input 必填。")}
    {fig("后台-新建信箱-可见范围.png", "后台-新建信箱-可见范围", "全员 / 按部门 / 自定义人群 / 导入人群。")}
    {fig("后台-新建信箱-按部门.png", "后台-新建信箱-按部门", "选「按部门」出现部门 TreeSelect，必填。")}
    {fig("后台-新建信箱-自定义人群.png", "后台-新建信箱-自定义人群", "选「自定义人群」出现人员 TreeSelect，必填。")}
    {fig("后台-新建信箱-导入人群.png", "后台-新建信箱-导入人群", "csv/xlsx 单文件 +「下载模板」。必填校验看 importFileName。模板为前端生成 CSV，无上传解析人数逻辑。")}
    {fig("后台-新建信箱-响应时效.png", "后台-新建信箱-响应时效", "开关打开后出现 24h/48h/一周/不限时。extra 写到期前 1 小时消息提醒，代码无发送实现。")}
    {fig("后台-新建信箱-底栏操作.png", "后台-新建信箱-底栏操作", "创建走 validateFields + validateBoardDraft + saveForumBoard。取消：dirty 则「离开当前页？」确认。")}
    {fig("后台-新建信箱-校验错误.png", "后台-新建信箱-校验错误", "空表提交出现：请输入名称、请输入信箱简介、请选择负责人、请选择响应时效。图片必填是隐藏 icon 字段，此截图未出图片红字。")}
    {fig("后台-编辑信箱-表单页.png", "后台-编辑信箱-表单页", "编辑员工体验：图片已回填，允许匿名默认开，响应时效未开。负责人 TreeSelect 单选；已被其他信箱占用的人 disabled 并标注「已负责其他信箱」。")}
    <h4>字段说明</h4>
    {table(
      ["字段名称", "组件路径", "控件类型", "是否必填", "默认值", "校验规则", "选项值", "业务含义"],
      [
        ["信箱图片", "后台-新建信箱-图片与名称-上传", "Upload", "创建必填", "空", "请上传信箱图片", "bmp/png/jpeg/jpg/gif", "列表/详情缩略图"],
        ["名称", "后台-新建信箱-图片与名称-名称", "Input", "是", "空", "请输入名称；保存时名称不可与其他信箱重复", "自由文本", "信箱标识"],
        ["信箱简介", "后台-新建信箱-表单页-简介", "TextArea", "是", "空", "请输入信箱简介", "—", "后台详情展示；C 端入口简介未读此字段"],
        ["可见范围", "后台-新建信箱-可见范围", "Radio", "是", "全员", "请选择可见范围", "全员/按部门/自定义人群/导入人群", "组织范围文案"],
        ["负责人", "后台-新建信箱-表单页-负责人", "TreeSelect 单选", "是", "空", "请选择负责人；一人不能负责两个信箱", "组织树，占用项灰", "列表「负责人」列"],
        ["回复人", "后台-新建信箱-表单页-回复人", "TreeSelect 多选", "否", "空", "无", "组织树人员", "详情「回复人」"],
        ["标签", "后台-新建信箱-表单页-标签", "Select mode=tags", "否", "空", "回车添加", "自由输入，非标签管理目录", "列表 Tag"],
        ["允许匿名", "后台-新建信箱-表单页-允许匿名", "Switch", "否", "信箱默认 true", "无", "开/关", "C 端是否显示匿名勾选"],
        ["响应时效", "后台-新建信箱-响应时效", "Switch+Select", "开启后必选", "关", "请选择响应时效", "24h/48h/一周/不限时", "详情展示；提醒未实现"],
      ],
    )}
    <h4>交互规则</h4>
    <p>保存失败「信箱名称已存在」落到名称；「该负责人已配置到其他信箱」落到负责人。成功 message「已创建信箱」/「已保存信箱」并回列表。</p>
  </article>

  <article>
    <h3>6.4 后台-信箱详情</h3>
    {fig("后台-信箱详情-页面整体.png", "后台-信箱详情-页面整体", "上半只读信息，下半嵌套该信箱建言表。")}
    {fig("后台-信箱详情-标题与操作.png", "后台-信箱详情-标题与操作", "图标、名称、状态；操作仅编辑、停用/启用。无查看链接。")}
    {fig("后台-信箱详情-信息描述.png", "后台-信箱详情-信息描述", "可见范围、负责人、回复人、匿名、响应时效、标签、创建时间、简介。无背景图项（论坛才有）。")}
    {fig("后台-信箱详情-建言列表.png", "后台-信箱详情-建言列表", "列：建言、建言内容、信箱、实际回复人、发起人、提交时间、操作（详情）。无指派/置顶/下架。")}
    {fig("后台-信箱详情-空态.png", "后台-信箱详情-空态", "id 不存在：「信箱不存在或已删除」+ 返回信箱列表。")}
  </article>

  <article>
    <h3>6.5 后台-建言详情</h3>
    {fig("后台-建言详情-已回复-页面整体.png", "后台-建言详情-已回复-页面整体", "经营发展种子建言：基本信息 + 内容 + 处理人回复 + 回复表单。无下架、无查看链接。")}
    {fig("后台-建言详情-基本信息.png", "后台-建言详情-基本信息", "标题、发起人、发起人部门、时间、所属信箱。匿名发起人按后台展示函数显示。")}
    {fig("后台-建言详情-内容.png", "后台-建言详情-内容", "正文；有图则 Image.PreviewGroup。")}
    {fig("后台-建言详情-处理人回复.png", "后台-建言详情-处理人回复", "有 chairmanReplies/chairmanReply 才出此卡。展示回复人姓名·部门、内容、时间。")}
    {fig("后台-建言详情-回复建言.png", "后台-建言详情-回复建言", "回复账号默认陈产品（个人账号）；内容 TextArea maxLength=500，校验与 store 上限 FORUM_COMMENT_MAX=200。取消会 resetFields。")}
    {fig("后台-建言详情-待回复-页面整体.png", "后台-建言详情-待回复-页面整体", "无处理人回复卡，仅回复表单。")}
    {fig("后台-建言详情-待回复表单.png", "后台-建言详情-待回复表单", "确认走 setChairmanReply；成功「已回复建言」。非法账号「请选择回复账号」。")}
    {fig("后台-建言详情-已驳回种子.png", "后台-建言详情-已驳回种子", "auditStatus 可为已驳回，详情页未单独展示审核结果。C 端可见性会隐藏已驳回。")}
    <h4>操作说明</h4>
    {table(
      ["操作名称", "组件路径", "触发元素", "前置条件", "启用/禁用逻辑", "用户动作", "系统响应", "状态变化", "成功反馈", "失败反馈", "跳转/接口"],
      [
        ["确认回复", "后台-建言详情-回复建言-确认", "主按钮", "建言存在", "始终", "填内容点确认", "追加 chairmanReplies", "最新一条写入 chairmanReply", "已回复建言", "请输入回复内容 / 请选择回复账号 / 建言不存在", "setChairmanReply"],
        ["取消回复", "后台-建言详情-回复建言-取消", "按钮", "无", "始终", "点击", "reset 表单", "不清历史回复", "无", "无", "无"],
      ],
    )}
  </article>

  <article>
    <h3>6.6 H5-信箱列表</h3>
    {fig("H5-信箱列表-页面整体.png", "H5-信箱列表-页面整体", "顶栏返回 + 标题「信箱列表」；两张入口卡；我的建言。返回调用 goH5Back。")}
    {fig("H5-信箱列表-顶栏.png", "H5-信箱列表-顶栏", "无搜索、无 Tab。")}
    {fig("H5-信箱列表-信箱卡片.png", "H5-信箱列表-信箱卡片", "MAILBOX_H5_DIRECTIONS：战略发展建言「李明远 · 经营管理中心」、员工体验建言「周岚 · 人力资源部」。不再显示「负责人 ·」。点照片或标题打开提交层。")}
    {fig("H5-信箱列表-简介展开.png", "H5-信箱列表-简介展开", "purpose 长度≥70 才切换展开。员工体验简介约 75–85 字可展开；战略发展约 45–55 字无展开控件语义。")}
    {fig("H5-信箱列表-我的建言.png", "H5-信箱列表-我的建言", "仅 author=周敏、boardName 属于 CLIENT_MAILBOX_BOARDS、未下架且审核非待审核/已驳回。展示标题、入口名、实名/匿名、状态、时间、摘要、图片。")}
    {fig("H5-信箱列表-空建言.png", "H5-信箱列表-空建言", "我的建言为空时文案「已有 N 条建言」，N=<code>mailboxProposalCount</code>（可见信箱建言总数，不限当前用户）。empty=1 预览把列表置空，故显示「已有 0 条建言」。不再使用「暂无建言」。")}
    <h4>组件显示逻辑</h4>
    {table(
      ["组件路径", "组件类型", "默认状态", "显示/隐藏逻辑", "启用/禁用逻辑", "数据来源", "状态变化", "空/错/加载状态", "权限/条件控制"],
      [
        ["H5-信箱列表-信箱卡片", "入口卡", "两张常显", "写死，不读后台 enabled", "始终可点提交", "MAILBOX_H5_DIRECTIONS", "无", "无空态", "无登录判断"],
        ["H5-信箱列表-我的建言", "列表", "有则出列表", "empty 预览强制空数组", "条目始终可进详情", "forumStore topics", "提交成功后出现新行", "已有 N 条建言", "列表仅当前用户；空文案 N 含全部可见建言"],
        ["H5-信箱列表-实名/匿名标", "标签", "按题显示", "board.anonymous 为假则隐藏", "只读", "boards+topic.authorAnonymous", "提交时写入", "无", "跟信箱开关"],
      ],
    )}
  </article>

  <article>
    <h3>6.7 H5-提交建言</h3>
    {fig("H5-提交建言-弹层.png", "H5-提交建言-弹层", "标题「提交建言」。填写标题、内容；上传最多 9 张；无标签区（tags=[]）。经营发展/员工体验种子 anonymous=true，故显示「匿名发帖」勾选（文案沿用论坛，未改成匿名建言）。")}
    {fig("H5-提交建言-标题校验.png", "H5-提交建言-标题校验", "空标题点提交，toast「请填写标题」2 秒，弹层不关。成功 toast「已提交」。失败其他文案同样 toast。")}
    <h4>字段说明</h4>
    {table(
      ["字段名称", "组件路径", "控件类型", "是否必填", "默认值", "校验规则", "选项值", "业务含义"],
      [
        ["标题", "H5-提交建言-弹层-填写标题", "input", "是", "空", "trim 后空则请填写标题", "—", "建言标题"],
        ["内容", "H5-提交建言-弹层-填写内容", "textarea", "否", "空", "可空", "—", "正文"],
        ["图片", "H5-提交建言-弹层-上传图片", "file multiple", "否", "空", "最多 9", "image/*", "列表/详情图"],
        ["匿名发帖", "H5-提交建言-弹层-匿名发帖", "checkbox", "否", "未勾选", "仅 allowAnonymous 显示", "开/关", "authorAnonymous"],
      ],
    )}
    <h4>操作说明</h4>
    {table(
      ["操作名称", "组件路径", "触发元素", "前置条件", "启用/禁用逻辑", "用户动作", "系统响应", "状态变化", "成功反馈", "失败反馈", "跳转/接口"],
      [
        ["提交", "H5-提交建言-弹层-提交", "底部按钮", "弹层打开", "始终", "点击", "publishClientTopic，boardName 用入口常量，chairName 用入口 handler", "成功关层并刷新我的建言", "已提交", "请填写标题等 toast", "内存 store"],
        ["关闭", "H5-提交建言-弹层-遮罩", "scrim aria-label 关闭", "弹层打开", "始终", "点遮罩", "onClose 不提交", "草稿随卸载丢失", "无", "无", "无"],
      ],
    )}
  </article>

  <article>
    <h3>6.8 H5-建言详情</h3>
    {fig("H5-建言详情-页面整体.png", "H5-建言详情-页面整体", "顶栏返回列表。仅当建言属于当前用户可见集合才渲染。")}
    {fig("H5-建言详情-内容卡片.png", "H5-建言详情-内容卡片", "入口名、标题、实名/匿名、状态（处理中/已回复/已驳回样式类）、时间、正文、图。有主席回复才出「回复」区。")}
    {fig("H5-建言详情-不存在.png", "H5-建言详情-不存在", "id 不在「我的可见建言」显示「建言不存在」。他人建言、已驳回、下架均走此空态。")}
  </article>

  <article>
    <h3>6.9 PC-信箱列表 / 提交</h3>
    {fig("PC-信箱列表-页面整体.png", "PC-信箱列表-页面整体", "PcActivityShell 标题「信箱列表」，品牌回 C 端门户。模块与 H5 相同。")}
    {fig("PC-信箱列表-顶栏.png", "PC-信箱列表-顶栏", "康尼品牌 + 标题。")}
    {fig("PC-信箱列表-信箱卡片.png", "PC-信箱列表-信箱卡片", "同一套 MAILBOX_H5_DIRECTIONS，负责人同样是「姓名 · 部门」。")}
    {fig("PC-信箱列表-我的建言.png", "PC-信箱列表-我的建言", "链接 toPcMailboxTopicHash。")}
    {fig("PC-提交建言-弹层.png", "PC-提交建言-弹层", "复用 H5ForumCompose，校验与提交逻辑同 H5。")}
    {fig("PC-信箱列表-空建言.png", "PC-信箱列表-空建言", "empty=1 显示「已有 0 条建言」，与 H5 同一函数。")}
  </article>

  <article>
    <h3>6.10 PC-建言详情</h3>
    {fig("PC-建言详情-页面整体.png", "PC-建言详情-页面整体", "宽屏详情；有回复时绿色回复区。种子「员工体验」周敏建言带多图与多条回复。")}
    {fig("PC-建言详情-内容卡片.png", "PC-建言详情-内容卡片", "字段与 H5 详情一致。")}
    {fig("PC-建言详情-返回列表.png", "PC-建言详情-返回列表", "headerActions「返回列表」链到 #/c/pc/mailbox。")}
    {fig("PC-建言详情-不存在.png", "PC-建言详情-不存在", "文案「建言不存在」。")}
  </article>
</section>

<section id="data-fields">
  <h2>7. 数据字段与枚举</h2>
  {table(
    ["枚举", "取值", "代码位置", "备注"],
    [
      ["BoardStatus", "enabled / disabled", "forum.ts boardStatusText", "已启用 / 已停用"],
      ["ForumVisibility", "全员、按部门、自定义人群、导入人群", "FORUM_VISIBILITY_OPTIONS", "表单 Radio"],
      ["MailboxResponseSla", "24h、48h、一周、不限时", "MAILBOX_RESPONSE_SLA_OPTIONS", "开关打开才选"],
      ["C 端建言状态", "处理中、已回复、已驳回", "mailboxProposalStatus", "已驳回优先；有主席回复则已回复；否则处理中"],
      ["C 端入口常量", "boardName / title / handler / department / tags / purpose / photo", "MAILBOX_H5_DIRECTIONS", "提交 chairName 用 handler；卡片副标题用 handler · department"],
      ["C 端可见信箱名", "员工体验、经营发展、人才发展、建言献策", "CLIENT_MAILBOX_BOARDS", "我的建言过滤"],
      ["回复账号", "陈产品、论坛小助手、官方客服", "forumCommentReplyAccountOptions", "否则请选择回复账号"],
      ["C 端当前用户", "周敏", "forumClientSelf", "原型写死"],
    ],
  )}
</section>

<section id="apis">
  <h2>8. API / 数据接口清单</h2>
  <p>代码中无 <code>fetch</code> / <code>axios</code> / 表单 action。读写均在 <code>forumStore</code> 内存。</p>
  {table(
    ["接口用途", "方法", "路径", "触发场景", "请求参数", "响应字段", "是否真实接口", "备注"],
    [
      ["保存信箱", "函数", "saveForumBoard", "创建/保存", "ForumBoardDraft + id?", "ok+board / error", "否", "重名、负责人占用"],
      ["启停信箱", "函数", "setForumBoardStatus(es)", "启用停用", "id(s)+status", "无返回", "否", "列表已去掉批量停用，详情仍可单个启停"],
      ["信箱排序", "函数", "moveForumBoard", "上移/下移", "id + dir -1|1", "boolean", "否", "仅同 kind 互换"],
      ["C 端发建言", "函数", "publishClientTopic", "提交", "boardName,title,content,images,author,anonymous,chairName", "ok+id / 请填写标题", "否", "auditStatus=直接发布"],
      ["后台回复", "函数", "setChairmanReply", "确认回复", "id,content,operator", "ok / error", "否", "累加 replies"],
    ],
  )}
  <p>建议接口 / {todo}：信箱 CRUD、启停、建言列表分页、回复、C 端提交、我的建言、SLA 提醒、人群导入解析、权限。</p>
</section>

<section id="non-functional">
  <h2>9. 非功能需求</h2>
  <ul>
    <li>后台列表横向滚动：信箱表 scroll.x=1600，建言表 1400。</li>
    <li>H5 视口按手机壳 <code>.c-h5-frame</code>；PC 用 <code>.c-pc-shell</code>。</li>
    <li>图片上传前端限制提示 5MB，代码未拦实际文件大小。</li>
    <li>回复框 UI maxLength=500 与校验 200 不一致。{todo}</li>
    <li>安全：无鉴权，C 端用户写死。无真实传输。</li>
    <li>错误：后台 antd message/modal；C 端 toast 2s。</li>
  </ul>
</section>

<section id="analytics">
  <h2>10. 埋点与指标建议</h2>
  <p><span class="status">建议补充</span> 代码无埋点。</p>
  {table(
    ["事件名称", "触发动作", "关键属性", "业务目的"],
    [
      ["mailbox_submit_click", "C 端点提交", "boardName, anonymous, hasImage", "提交转化"],
      ["mailbox_submit_fail", "标题为空等", "error", "校验摩擦"],
      ["mailbox_admin_reply", "后台确认回复", "topicId, operator", "处理时效"],
      ["mailbox_board_disable", "停用确认", "boardId", "供给治理"],
    ],
  )}
</section>

<section id="acceptance">
  <h2>11. 验收标准</h2>
  <ul>
    <li>Given 后台 When 打开信箱应用 Then 菜单仅概览、信箱列表，默认概览。</li>
    <li>Given 空新建表 When 点创建 Then 名称/简介/负责人报错；开时效未选则报请选择响应时效。</li>
    <li>Given 负责人已被占用 When 再选同一人保存 Then 该负责人已配置到其他信箱。</li>
    <li>Given 列表启用信箱 When 确认停用 Then 状态已停用，message 已停用。</li>
    <li>Given 待回复建言 When 后台回复成功 Then 详情出现处理人回复，概览已回复口径依赖 chairmanReply。</li>
    <li>Given H5/PC 列表 When 点入口 Then 打开提交建言；空标题 toast 请填写标题。</li>
    <li>Given 提交成功 When 回到我的建言 Then 新纪录在前，状态处理中（无回复时）。</li>
    <li>Given 信箱列表 When 看行操作 Then 外显详情/上移/下移，更多内为编辑/停用；无勾选与批量停用。首行上移不可点。</li>
    <li>Given empty=1 When 打开 H5/PC 列表 Then 我的建言文案为「已有 0 条建言」，入口仍在。</li>
    <li>Given C 端入口卡 When 阅读负责人 Then 为「李明远 · 经营管理中心」「周岚 · 人力资源部」，无「负责人 ·」前缀。</li>
    <li>Given 不存在或无权建言 When 打开详情 Then 建言不存在。</li>
  </ul>
</section>

<section id="risks">
  <h2>12. 风险与待确认问题</h2>
  <ol>
    <li>{todo} C 端只展示 2 个写死入口，后台 4 个信箱、启停、简介、负责人、标签均未驱动 C 端卡片。</li>
    <li>{todo} 入口 handler/department（李明远·经营管理中心 / 周岚·人力资源部）与后台 manager（周明远/林知夏）仍不一致。</li>
    <li>{todo} 响应时效「到期前 1 小时提醒」仅文案。</li>
    <li>{todo} 导入人群只存文件名，不解析名单。</li>
    <li>{todo} C 端隐藏已驳回，后台详情也不展示审核字段，员工看不到驳回原因。</li>
    <li>{todo} 概览「已回复」用 chairmanReply，C 端用 replies 数组，历史数据可能不一致。</li>
    <li>{todo} 提交勾选文案为「匿名发帖」。</li>
    <li>{todo} mailbox-messages、信箱标签管理页存在于论坛复用组件，信箱菜单未挂标签管理。</li>
    <li>{guess} 停用后 C 端入口仍可提交，因入口不读 board.status。</li>
  </ol>
</section>
"""

g.write_prd("mailbox-app", "信箱应用-PRD.html", "信箱应用 产品需求文档", TOC, body)
