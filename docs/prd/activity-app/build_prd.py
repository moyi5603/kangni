#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import _gen_prd as g

g.CSS += """
    .status.p0 { background:#fee2e2; color:#991b1b; }
    .status.p1 { background:#fef3c7; color:#92400e; }
    .status.p2 { background:#e0e7ff; color:#3730a3; }
    .status.must { background:#fecaca; color:#7f1d1d; }
    .note { background:#f8fafc; border-left:3px solid #0f766e; padding:8px 12px; margin:12px 0; }
"""


def fig(src: str, path: str, desc: str) -> str:
    return (
        f'<figure><img src="screenshots/{src}" alt="{path}截图">'
        f'<figcaption><span class="component-path">{path}</span>：{desc}</figcaption></figure>'
    )


def table(headers: list[str], rows: list[list[str]]) -> str:
    head = ''.join(f'<th>{h}</th>' for h in headers)
    body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows)
    return f'<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'


p0, p1, p2 = '<span class="status p0">P0</span>', '<span class="status p1">P1</span>', '<span class="status p2">P2</span>'
impl, guess, todo = (
    '<span class="status impl">代码已实现</span>',
    '<span class="status guess">根据页面推测需要</span>',
    '<span class="status todo">待确认</span>',
)

TOC = [
    ('doc-note', '1. 文档说明'),
    ('overview', '2. 功能概述与业务背景'),
    ('roles', '3. 用户角色与权限'),
    ('ia', '4. 页面结构 / 信息架构'),
    ('features', '5. 功能清单与优先级'),
    ('visibility-rules', '5.1 可见范围与司龄'),
    ('flows', '6. 用户流程'),
    ('page-admin', '7. 后台页面需求'),
    ('page-h5', '8. H5 页面需求'),
    ('page-pc', '9. PC 页面需求'),
    ('data-fields', '10. 数据字段与枚举'),
    ('apis', '11. API / 数据接口清单'),
    ('exceptions', '12. 异常场景与边界条件'),
    ('non-functional', '13. 非功能需求'),
    ('analytics', '14. 埋点与指标建议'),
    ('acceptance', '15. 验收标准'),
    ('risks', '16. 风险与待确认问题'),
]

body = []
a = body.append

a('<section id="doc-note"><h2>1. 文档说明</h2><ul>')
a('<li>文档来源：基于康尼活动应用 React/TSX 原型反向分析（html-to-prd）。截图为 2026-09-07 本地 <code>http://localhost:5173/</code> 实机渲染。</li>')
a('<li>分析范围：管理后台 <code>#/activities/*</code>（含活动装修）；员工 H5 <code>#/c/h5/*</code>；员工 PC <code>#/c/pc/*</code>。不含兴趣圈活动、投票、课程。</li>')
a('<li>生成日期：2026-09-07</li>')
a('<li>本次对照增量：① ACTIVITY_MOCK_VERSION=38，种子 28 条（含志愿服务说明会）。② 周期/系列报名截止字段 Label 为「报名截止」，开场前 N 小时，placeholder「0 为开场即停」。③ 导入人群 extra 要求模板列：工号、姓名、部门。④ 活动评分：进行中或已结束均展示（canShowActivityRating）；已通过报名可评，每人一次 toast「已评分」。</li>')
a('<li>可信度：按钮文案、校验、状态机以代码为准。活动本体仍无 HTTP。装修与列表视图有 localStorage。接口列为建议而非已实现。</li>')
a(f'<li>标记：{impl} {guess} {todo}</li>')
a(f'<li>优先级：{p0} 主路径；{p1} 运营完整度；{p2} 可延后。</li>')
a('<li>组件一律使用 <code>页面-模块-组件名称</code>。</li></ul></section>')

a('<section id="overview"><h2>2. 功能概述与业务背景</h2>')
a('<p><strong>做什么：</strong>活动应用覆盖企业员工活动全生命周期。运营在后台配置活动（封面、时间/场次、可见范围、报名收集项、积分、签到码），并可装修 H5/PC 首页版面；审核/发布后，员工在 H5 或 PC 发现活动、按场次报名、扫码签到、评论/评分/发瞬间；运营管理报名、评论、瞬间与奖品。</p>')
a('<p><strong>为什么做：</strong>把线下「通知 + 表格收名单」收口到统一规则：名额、多场次、审核、手动截止、终止、签到核销，员工自助参加，运营可复盘。</p>')
a('<p><strong>产品定位：</strong>康尼「员工与组织」下的活动运营中台 + 员工参加端。当前为可交互原型（内存 mock），用于评审交互而非生产。</p>')
a('<p><strong>核心场景：</strong>① HR 创建开放日/培训/疗休养/周期球类并发布；② 员工浏览报名；③ 现场扫码；④ 进行中或已结束后评分发瞬间（不限次数）、后台发奖导出。</p></section>')

a('<section id="roles"><h2>3. 用户角色与权限</h2>')
a('<p>原型<strong>无</strong>登录鉴权、角色表、菜单 ACL。下表是产品语义 + 代码条件分支。</p>')
a(table(
    ['角色', '入口', '代码证据', '可做', '差异/限制'],
    [
        ['后台运营（顶栏「陈产品」）', '全部应用 → 活动', '无 permission 判断', '活动 CRUD、分类、规则设置（仅演示）、活动装修（仅演示）、审核发布、截止/终止、报名审、签到码、评论/瞬间马甲回复、奖品', '任何人打开后台即可全部操作；已结束/终止不可保存编辑'],
        ['员工（DEMO_SIGNUP_USER）', 'C 端预览 → 活动 H5/PC', '姓名陈产品 / 手机 13800001111 / 华东大区 / 产品经理；无切换用户', '看已发布且对本账号可见的活动、报名取消、赞藏评、进行中/已结束打分发瞬间（无次数上限）、H5 签到', '见 5.1；PC 无签到页'],
        ['活动发起人', 'C 端同一演示账号', '展示码：shouldShowOrganizerCheckInQr 仅姓名全等；发起人字段为自由文本，不据此拦截取消/调整', '详情展示签到二维码（姓名匹配时）', '后台保存时自动已通过报名；C 端取消/调整与普通员工相同'],
        ['活动审批人', '列表/详情「审核」', 'canReviewActivity：审批开且待审核', '通过/驳回活动', '与报名审核开关分离'],
        ['报名审核人', '详情-报名 Tab', 'needAudit 且记录待审核', '通过/驳回/批量', '员工不能审他人'],
    ],
))
a('<p class="note">奖品 Tab 文案写「康尼通过权限控制不显示此功能」，但 <code>detailTabs</code> 仍始终渲染。</p></section>')

a('<section id="ia"><h2>4. 页面结构 / 信息架构</h2>')
a(table(
    ['端', '页面', 'Hash', '组件'],
    [
        ['后台', '概览', '#/activities/activity-overview', 'ActivityOverviewPage'],
        ['后台', '活动管理', '#/activities/activity-list', 'ActivityListPage；列表/卡片'],
        ['后台', '新建/复制', '#/activities/activity-create[/{源id}]', 'ActivityFormPage create'],
        ['后台', '编辑', '#/activities/activity-edit/{id}', 'ActivityFormPage edit；已结束/终止整表 disabled'],
        ['后台', '详情', '#/activities/activity-detail/{id}[/{tab}]', 'tab=detail|signups|checkin|comments|moments|prizes'],
        ['后台', '分类 / 规则设置（仅演示）', '#/activities/activity-categories|activity-rules', 'Category / ActivityRulesPage；侧栏 label 规则设置（仅演示）'],
        ['后台', '活动装修（仅演示）', '#/activities/activity-layout[-mobile|-pc]', '仅演示样式；生产以首页装修（H5/PC 装修）为准'],
        ['H5', '首页/搜索/全部', '#/c/h5 | /search | /list', 'H5ActivityHome；首页读装修 draft'],
        ['H5', '详情/报名/签到', '#/c/h5/{id}[/signup|/checkin]', 'Detail / Signup / CheckIn'],
        ['H5', '我的/收藏/瞬间', '#/c/h5/my|favorites|moments', '搜索栏右侧图标进 my；收藏仍 hash；搜索/全部页无入口'],
        ['PC', '对称路由', '#/c/pc/…', '报名 hash 打开详情+弹窗；无 checkin'],
    ],
))
a('</section>')

a('<section id="features"><h2>5. 功能清单与优先级</h2>')
a(table(
    ['模块', '功能点', '说明', '端', '优先级', '状态'],
    [
        ['配置', '新建/编辑/复制', '封面 jpg/png；标题 max20；发起人 max20；详情必填；已结束/终止禁编辑', '后台', p0, impl],
        ['配置', '举办方式', '单次 / 周期（周几+时段）/ 系列≥2 场；编辑不可改类型', '后台', p0, impl],
        ['发布', '审批、发布、撤销', '撤销仅已发布+未开始；进行中引导终止', '后台', p0, impl],
        ['运营', '置顶、截止/恢复报名、终止、删除、批量', '终止不可恢复为进行中', '后台', p0, impl],
        ['运营', '列表/卡片视图', 'ListViewSegmented；localStorage activity-list-view', '后台', p1, impl],
        ['报名运营', '审、导入导出、添加、可搜索场次筛', '发起人自动占已通过名额；一人一行多场拼文案', '后台', p0, impl],
        ['社交', '赞藏评分享、评分瞬间；后台马甲回复', '回复账号：陈产品（个人）/活动小助手/官方客服；内容 max500', '后台+H5/PC', p1, impl],
        ['装修', '活动装修（仅演示）', '装修以首页装修为准，此处仅演示样式；生产不作为装修入口', '后台', p1, impl],
        ['发现', '分类、搜索、列表、详情', '已发布且对当前员工可见（见 5.1）；首页块顺序/条数由装修 latestCount', 'H5/PC', p0, impl],
        ['报名', '选场次、填表、提交/调整/取消', 'H5 整页；PC 弹窗；不可见活动不可报名', 'H5/PC', p0, impl],
        ['签到', '静/动态码、H5 扫码', '动态码 5 分钟刷新不可下载', '后台+H5', p0, impl],
        ['分类规则', '分类启停、报名积分上下限', '菜单/页标题「规则设置（仅演示）」；活动积分默认 1～20；评论/打分/瞬间仍单次+日上限', '后台', p1, impl],
        ['我的', '五态报名、收藏、往期', '首页搜索行右侧图标进报名页（aria 我的活动）；无搜索块则入口消失；收藏无入口', 'H5/PC', p1, impl],
        ['概览', 'KPI/图表/待办/进行中表', '日期范围过滤；KPI 点进列表不带筛参', '后台', p1, impl],
        ['奖品', '发放/导入/指定分组', '仅已结束已发布；无分组字段则无「指定分组」目标', '后台', p2, impl],
    ],
))

a('<article id="visibility-rules"><h3>5.1 可见范围与司龄（C 端过滤）</h3>')
a('<p>H5 / PC 员工端<strong>必须</strong>按当前登录员工过滤活动数据，不能只看 <code>publishStatus=已发布</code>。后台运营列表、详情、报名 Tab 不过滤可见范围。</p>')
a('<p>判定顺序：① 未发布 → 对员工不可见。② 当前员工是该活动发起人（姓名或手机匹配）→ 可见。③ 按可见范围命中。④ 若开启报名司龄限制，当前员工司龄（整年）&lt; 年限 → 不可见且不可报名。四步都过才进入 C 端数据集。</p>')
a(table(
    ['可见范围', '命中规则', '未命中'],
    [
        ['全员', '任意在职员工（仍过发布与司龄）', '—'],
        ['按部门', '员工所属部门 ∈ 已选部门，或为已选节点的下级部门（TreeSelect SHOW_PARENT：勾父部门含下级）', '列表不出现；深链详情/报名/签到等同「活动不存在」'],
        ['自定义人群', '员工姓名 ∈ customPeople', '同上'],
        ['导入人群', '员工姓名或手机号 ∈ importedPeople（导入文件解析出的名单）', '同上'],
    ],
))
a('<p>作用面：首页活动块与轮播（指向不可见活动的图不展示或不可点进该活动）、搜索、全部活动、往期精彩回顾、详情、报名页、签到页。收藏/我的报名仍可列出本人历史记录；活动已不可见时卡片「活动已失效」，不可再进详情。</p>')
a('<p>司龄：高级设置「报名司龄限制=有限制」时，年限 ≥0。无该员工司龄则视为 0。关闭限制则跳过本步。</p>')
a('<p>原型现状：<code>clientVisibleActivities</code> 仍等于 <code>publishedActivities</code>，演示用户无司龄字段。实现时改过滤函数，详情用同一套可见集合取活动，禁止未命中深链。</p></article></section>')

a('<section id="flows"><h2>6. 用户流程</h2>')
a('<h3>6.1 创建发布</h3><p>后台-活动管理-新建活动 → 保存（audit 待提交或无需审核）→ 可选提交审批 → 审核通过 → 发布。仅对命中可见范围（及司龄）的员工出现。失败：表单校验 message.error。</p>')
a('<h3>6.2 员工报名</h3><p>详情 CTA「立即报名」→ H5 跳转 signup / PC 弹窗 → 勾选未截止场次 → 填姓名等 → 确认报名。toast「报名成功」。满员仅标「已满」，仍可勾选且提交不拦配额。</p>')
a('<h3>6.3 取消</h3><p>报名窗内 + 已报名：单场次 CTA「取消报名」→ 弹窗「取消后将释放名额，报名截止前可以再次报名。」→ 确认取消。多场次 CTA 为「立即报名」(adjust)。发起人字段是文本，不校验身份，取消/调整规则与普通员工相同。</p>')
a('<h3>6.4 签到</h3><p>后台开启扫码签到 → 列表更多或详情 Tab 出示码（H5 URL <code>#/c/h5/{id}/checkin?s=&amp;t=</code>）。员工仅 H5 打开。PC 无 checkin 路由。发起人姓名全等时详情内嵌 OrganizerCheckInQr。</p>')
a('<h3>6.5 装修首页</h3><p class="note">产品说明：C 端首页版面以「首页装修」（H5/PC 装修）为准。「活动装修（仅演示）」仅演示活动卡片与组件样式，不作为生产装修入口。</p>')
a('<p>原型页：后台-活动装修 → 选移动端/PC → 拖入搜索/轮播/活动/瞬间 → 右侧改样式与 latestCount → 画布改动即时 <code>saveActivityDecoration</code> 写 draft → 点保存 <code>publishActivityDecoration</code> toast「已保存，C端首页已更新」。C 端首页实际 <code>useActivityDecoration</code> 读的是 draft，未点保存也会在刷新后看到草稿（localStorage）。</p></section>')

# ---- admin pages ----
a('<section id="page-admin"><h2>7. 后台页面需求</h2>')

a('<article><h3>7.1 后台-概览</h3><h4>页面目标</h4><p>运营看到待办量与活动健康度，跳转列表处理。</p>')
a(fig('后台-概览-页面整体.png', '后台-概览-页面整体', '标题旁 OverviewDateRange；KPI、状态/分类饼图、「待办关注」「进行中的活动」。'))
a(fig('后台-概览-KPI指标卡.png', '后台-概览-KPI指标卡', '待审核活动 / 待审核报名 / 进行中活动 / 总报名人数 / 已发布活动。均 onNavigate(activity-list)，无 query。日期范围默认近 30 天，可切日/月。报名人数按 uniqueBySignupOccupant。'))
a('<h4>组件显示逻辑</h4>')
a(table(
    ['组件路径', '组件类型', '默认状态', '显示/隐藏', '启用/禁用', '数据来源', '状态变化', '空/错/加载', '权限'],
    [
        ['后台-概览-日期范围', 'RangePicker', 'defaultOverviewDateRange', '始终', '始终', 'OverviewDateRange', '改范围重算 KPI/表', '无', '无'],
        ['后台-概览-待办关注', 'Table', '有数据则展示', '始终', '详情可点', 'buildAttentionRows', '报名待审核点详情带 tab=signups', '暂无待办', '无'],
        ['后台-概览-进行中的活动', 'Table', '进行中', '始终', '详情可点', 'buildInProgressActivityRows', '分页 b2bStandards.table', '当前没有进行中的活动', '无'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [['查看待办活动', '后台-概览-KPI指标卡', 'KPI 卡片', '无', '始终', '点击', '进入活动列表', '无', '无', '无', 'hash activity-list，无 API']],
))
a('<h4>验收</h4><p>Given 存在待审核活动 When 打开概览 Then KPI 数字与列表一致。Given 点击 KPI When 进入列表 Then 不自动带审核筛选项（现状）。</p></article>')

a('<article><h3>7.2 后台-活动管理</h3>')
a(fig('后台-活动管理-页面整体.png', '后台-活动管理-页面整体', '查询区 + 列表/卡片切换 + 新建活动。顶栏当前用户陈产品。'))
a(fig('后台-活动管理-查询筛选.png', '后台-活动管理-查询筛选', '活动标题、审核状态、状态；查询/重置/展开。查询成功文案「查询完成」。'))
a(fig('后台-活动管理-列表表格.png', '后台-活动管理-列表表格', '列：标题（可置顶 Tag）、分类、举办方式、活动时间、审核状态、状态、操作。工具栏「展示形式」列表/卡片。'))
a(fig('后台-活动管理-卡片视图.png', '后台-活动管理-卡片视图', 'MediaEntityCardGrid：封面、标题、时间摘要、生命周期状态、置顶/审核 Tag。'))
a(fig('后台-活动管理-行操作.png', '后台-活动管理-行操作', '详情、编辑、复制、更多操作。'))
a(fig('后台-活动管理-截止报名确认.png', '后台-活动管理-更多菜单', '更多含撤销、取消置顶、截止报名、终止活动（红）、删除。截图为菜单展开态，非确认框。确认框文案见下表。'))
a(fig('后台-活动管理-签到码弹窗.png', '后台-活动管理-更多菜单-签到码项', '开启签到的活动更多中出现「签到码」。点击后应开 Modal 嵌 ActivityQrCheckInPage。'))
a('<h4>字段说明（筛选）</h4>')
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['活动标题', '后台-活动管理-查询筛选-活动标题', 'Input', '否', '空', '无 maxlength 在筛选项', '—', '模糊匹配标题'],
        ['审核状态', '后台-活动管理-查询筛选-审核状态', 'Select', '否', '全部', '—', '待提交/待审核/已通过/已驳回/无需审核', 'auditStatus'],
        ['状态', '后台-活动管理-查询筛选-状态', 'Select', '否', '全部', '—', '未发布/未开始/进行中/已结束/已终止', 'lifecycle 展示态'],
        ['分类', '展开后', 'Select', '否', '全部', '—', '启用分类', 'category'],
        ['举办方式', '展开后', 'Select', '否', '全部', '—', '单次/周期/系列', 'scheduleType'],
        ['活动时间/创建时间/发布时间', '展开后', 'RangePicker', '否', '空', '—', '—', '落在区间内'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['新建活动', '后台-活动管理-新建活动', '主按钮', '无', '始终', '点击', '打开表单', '无', '无', '无', 'activity-create'],
        ['详情', '后台-活动管理-行操作-详情', '链接', '无', '始终', '点击', '进详情', '无', '无', '无', 'activity-detail/{id}'],
        ['编辑', '同上-编辑', '按钮', 'canEditActivity', '已结束/终止 disabled，tooltip「活动已结束/已终止，不能编辑」', '点击', '进编辑', '无', '无', '无', 'activity-edit/{id}'],
        ['复制', '同上-复制', '按钮', '无', '始终（含已结束）', '点击', '带源数据新建', '无', '无', '无', 'activity-create/{id}'],
        ['提交审批', '更多或行内', '按钮', 'canSubmitApproval', '否则不出现', '确认', 'audit=待审核', '是', '已提交「」审批', '当前不可提交审批', '内存 store'],
        ['审核', '行内', '按钮', 'canReviewActivity', '仅待审核出现', '打开审核弹窗', '通过/驳回', 'audit 变', '弹窗内', '无', 'ActivityReviewModal'],
        ['发布', '行内', '按钮', '未发布', 'canPublishActivity 否则 disabled，tooltip 仅审批通过或无需审核…', '点击', 'publish=已发布', '是', '已发布「」', '无法发布', 'patchActivities'],
        ['撤销', '更多', '按钮', '已发布', '未开始才启用；进行中 disabled+tooltip 引导终止', '确认「撤销后活动不再对员工可见。发布时间保留。」', 'publish=未发布', '是', '已撤销「」', 'revokeActivityBlockReason', '内存'],
        ['截止报名', '更多', '按钮', 'canCloseActivitySignup', '已发布且未手操截止且报名未到点', '确认', 'signupEndAt=now，写 signupClosedAt', '是', '已截止「」报名', '无', 'applyCloseActivitySignup'],
        ['恢复报名', '更多', '按钮', 'canReopenActivitySignup', '有 signupClosedAt 且未终止', '确认', '还原截止', '是', '已恢复「」报名', '无', '单次还原 stash；周期/系列 syncSignupEndAt'],
        ['终止', '更多', '按钮', 'canTerminateActivity', '已发布且进行中', '确认「未举办场次不再进行，且不可恢复为进行中。」', 'activityStatus=已终止', '是', '已终止「」', '无', 'applyTerminateActivity'],
        ['删除', '更多', '按钮', '无', '始终', '确认「删除后不可恢复。」', '从列表移除', '是', '已删除「」', '无', 'filter id'],
        ['置顶', '更多', '按钮', '无', '始终', '点击', 'pinned 翻转', '是', '已置顶/已取消置顶「」', '无', '内存'],
        ['签到码', '更多', '按钮', 'checkInEnabled', '未开启则无此项', '点击', 'Modal 二维码', '无', '无', '无', '无独立路由'],
        ['展示形式', '后台-活动管理-展示形式', 'Segmented', '无', '始终', '点列表/卡片', '切换 Table / MediaEntityCardGrid', '写入 localStorage activity-list-view', '无', '无', '无 API'],
        ['批量撤销/提交/发布/设分类', '勾选后批量栏', '按钮', '有选中且为列表视图', '按 can* 过滤；卡片视图不显示批量栏', '点击', '批量 patch', '是', '已撤销 N 个…', '已选活动均不可…', '内存'],
    ],
))
a('<h4>交互规则</h4><p>行内状态按钮互斥：能提交则显示提交；否则能审则审核；否则已发布显示撤销；否则显示发布。查询不改 URL。空表：有筛选「没有符合条件的活动」，否则标准 emptyText。</p>')
a('<h4>权限/状态</h4>')
a(table(
    ['按钮', '待提交', '待审核', '已通过未发', '无需审核未发', '已发未开始', '进行中', '已结束/终止'],
    [
        ['提交审批', '审批开则有', '—', '—', '—', '按 audit', '同左', '同左'],
        ['审核', '—', '有', '—', '—', '—', '—', '—'],
        ['发布', '禁', '禁', '有', '有', '—', '—', '—'],
        ['撤销', '—', '—', '—', '—', '启用', '禁用', '无'],
        ['截止报名', '—', '—', '—', '—', '报名未截止则有', '同', '无'],
        ['终止', '—', '—', '—', '—', '无', '有', '无'],
        ['编辑', '未结束有', '同', '同', '同', '有', '有', '禁用'],
        ['删除复制', '有', '有', '有', '有', '有', '有', '有'],
    ],
))
a('</article>')

a('<article><h3>7.3 后台-新增/编辑活动</h3>')
a(fig('后台-新增活动-表单页.png', '后台-新增活动-表单页', '封面、标题、分类、地点、发起人、活动时间、举办方式。底部取消/保存/提交审核。'))
a(fig('后台-新增活动-报名分组.png', '后台-新增活动-报名分组设置', '独立 Card。是否设置默认关；开后 SignupGroupsEditor，至少 2 组，名称 max20，合计须等于报名总人数。'))
a(fig('后台-新增活动-高级设置.png', '后台-新增活动-高级设置', '展开后含报名审核、司龄、活动积分、扫码签到、报名字段。发送消息通知不在此折叠。'))
a(fig('后台-编辑活动-系列场次.png', '后台-编辑活动-系列场次', '系列活动编辑：场次 RangePicker；举办方式编辑态 disabled。'))
a(fig('后台-编辑活动-已结束锁定.png', '后台-编辑活动-已结束锁定', 'Alert「活动已结束，不能编辑」；Form disabled；底部只留取消，无保存/提交。'))
a('<h4>字段说明</h4>')
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['封面图片', '后台-新增活动-封面图片', 'Upload→url', '是', '空', 'jpg/png；请上传封面图片', '—', 'C 端封面'],
        ['活动标题', '后台-新增活动-活动标题', 'Input', '是', '空', 'maxLength=20 showCount', '—', '列表/C 端标题'],
        ['分类', '后台-新增活动-分类', 'Select', '是', '空', '请选择分类；仅启用项（编辑可保留当前禁用）', '分类管理数据', 'C 端 Tab 与筛'],
        ['活动地点', '后台-新增活动-活动地点', 'Input', '否', '总部一号楼多功能厅(mock 默认)', '无', '—', 'C 端地点'],
        ['发起人', '后台-新增活动-发起人', 'Input', '是', '陈产品(默认)', 'maxLength=20；请输入发起人', '—', '保存时 ensureOrganizerSignup'],
        ['活动时间', '后台-新增活动-活动时间', 'RangePicker', '是', '空', '请选择活动时间；结束不得早于开始', '—', '生命周期计算窗'],
        ['举办方式', '后台-新增活动-举办方式', 'Radio', '是', 'once', '请选择举办方式；编辑 disabled', '单次/周期/系列', '场次生成策略'],
        ['报名时间', '单次-报名起止', 'RangePicker', '单次是', '—', '—', '—', 'signupStartAt/EndAt'],
        ['名额', '后台-新增活动-名额', 'InputNumber', '是', '50', '≥1；周期/系列=每场上限', '—', 'C 端已报名 a/b'],
        ['周几+时段', '周期', 'Checkbox+Time', '周期是', '—', '请选择重复的周几；请填写{周}时段；无场次则报错', '周一…日', 'generateRecurringSessions'],
        ['场次列表', '系列', 'RangePicker 列表', '系列是', '—', '至少 2 场；每场落在活动时间内', '—', 'sessions'],
        ['报名开始', '周期/系列', 'DatePicker', '是', '—', '请选择报名开始时间', '—', 'signupStartAt'],
        ['报名截止', '周期/系列-开场前小时', 'InputNumber', '是', '0', '≥0；placeholder「0 为开场即停」', '—', 'signupHoursBefore；UI Label「报名截止」'],
        ['活动详情', '后台-新增活动-活动详情', 'RichText', '是', '—', '请填写活动详情', '—', 'C 端介绍 HTML；工具栏「区块背景」；disabled 藏工具栏'],
        ['可见范围', '后台-新增活动-可见范围', 'Radio', '是', '全员', '请选择可见范围', '全员/按部门/自定义人群/导入人群', 'C 端过滤，见 5.1'],
        ['选择部门', '可见=按部门', 'TreeSelect', '条件必填', '空', '请选择部门', 'orgDepartmentTree', 'C 端按部门及下级命中'],
        ['选择人员', '可见=自定义', 'TreeSelect', '条件必填', '空', '请选择人员', '人员树，部门节点不可选', 'C 端按姓名命中'],
        ['导入人群', '可见=导入', 'Upload', '条件必填', '空', '请导入人群文件；csv/xlsx', '模板列：工号、姓名、部门', 'C 端按姓名或手机命中'],
        ['发送消息通知', '后台-新增活动-可见范围卡', 'Switch', '否', '关', '—', '—', 'notifyOnPublish，无真实推送'],
        ['是否设置分组', '后台-新增活动-报名分组设置', 'Switch', '否', '不设置', '开则各组人数合计=报名总人数，否则拦保存', '已设置/不设置', 'setGroupSignupEnabled'],
        ['分组', '后台-新增活动-报名分组设置-分组', 'SignupGroupsEditor', '开则≥2 组', '空名+限 0', '名称 maxLength=20；至少 2 组不可删到 1', '添加分组', 'C 端多选组+上限 N 人'],
        ['是否审核报名', '高级', 'Switch', '否', '关', '—', '—', 'signupSettings.needAudit'],
        ['审批流节点', '审核开时', 'Editor', '否', '空', '—', '—', '报名审批，非活动审批'],
        ['报名司龄限制', '高级', 'Switch+Number', '开则年限必填', '关', '年限≥0', '—', '开启后 C 端不可见且不可报，见 5.1'],
        ['活动积分', '高级', 'Switch+Number', '开则必填', '开/规则页 signupPointsMin', '须在 signupPointsMin～signupPointsMax（默认 1～20）', '—', 'extra：规则范围 min～max；表单无每日上限'],
        ['扫码签到', '高级', 'Switch', '否', '关', '—', '—', 'checkInEnabled'],
        ['开始前可扫', '签到开', 'Number', '是', '30', '分钟', '—', 'checkInOpenMinutesBefore'],
        ['动态二维码', '高级', 'Switch', '否', '关', '—', '—', '5 分钟刷新'],
        ['报名字段', '高级-SignupFieldsEditor', '编辑器', '至少 1 项', '固定「姓名」必填', '见 signupFields 校验', '预设+自定义', 'C 端表单'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['取消', '后台-新增活动-取消', '次按钮', '无', '始终', '点击', 'dirty 则确认「未保存的修改将丢失。」', '丢草稿', '无', '无', '回列表'],
        ['保存', '后台-新增活动-保存', '主按钮', '校验通过且未锁定', 'editLockedReason 时整组不渲染', '点击', 'upsertActivity', '写入', '活动已保存/已更新', 'message.error 积分或场次；锁定时 warning 锁定文案', '回列表'],
        ['提交审核/审批', '后台-新增活动-提交审核', '按钮', 'create 或 canSubmitApproval(editing)', 'showSubmit 为假则无', '点击 save(true)', 'audit=待审核', '是', '已提交审核/已提交审批', '同保存校验', '回列表'],
    ],
))
a('<h4>校验规则</h4><p>分组人数合计必须等于报名总人数，不符则静默不提交（表单内联）。自定义文本字数 1～200。同行人最多 1～20 且至少勾选一项收集。单选/多选≥2 选项。周期无生成场次：「该活动时间内没有可生成的场次」。</p>')
a('<h4>异常</h4><p>缺封面/标题/分类/详情拦提交。已结束/终止：列表编辑禁用；若直达 edit hash，表单 Alert + disabled + 点保存走 warning。进行中仍可改时间/名额/可见范围（举办方式仍锁）。</p></article>')

a('<article><h3>7.4 后台-活动详情</h3>')
a(fig('后台-活动详情-页面整体.png', '后台-活动详情-页面整体', '面包屑 + ActivityDetailHeader + Tabs。Tab：详情/报名/签到码/评论/精彩瞬间/奖品。'))
a(fig('后台-活动详情-页头.png', '后台-活动详情-页头', '封面、分类/生命周期/审核 Tag、标题右侧操作、事实行（活动/报名时间、地点、报名截止、终止时间）、嵌入 ActivityStatsRow。'))
a(fig('后台-活动详情-标题与操作.png', '后台-活动详情-页头-操作', '审核/提交/编辑互斥；复制创建；签到码切 Tab；截止/恢复/终止/删除。已结束编辑 disabled+Tooltip。'))
a(fig('后台-活动详情-统计条.png', '后台-活动详情-页头-指标', '顺序：报名人数（/总名额）、评论数、精彩瞬间数、待审核报名、报名额使用率、平均分、评分人数。报名人数/待审核按 uniqueBySignupOccupant。'))
a(fig('后台-活动详情-场次表.png', '后台-活动详情-详情Tab-场次', 'needsSessionPick 才渲染 ActivitySessionsDetailCard：场次/开始/结束/报名截止/人数上限。'))
a(fig('后台-活动详情-报名Tab.png', '后台-活动详情-报名Tab', '周期/系列：SignupSessionSearchSelect（showSearch，全部场次+第 n 场+起止）。无场次概况表。人表场次列仅「第 n 场」，场次时间另列。'))
a(fig('后台-活动详情-报名场次筛.png', '后台-活动详情-报名Tab-场次筛', '收起态可见场次（字段序：姓名、部门、场次、状态；报名时间在展开后）。点查询才过滤。'))
a(fig('后台-活动详情-签到码Tab.png', '后台-活动详情-签到码Tab', '场次二维码表；静态可下载；动态码提示每 5 分钟刷新不支持下载。'))
a(fig('后台-活动详情-评论Tab.png', '后台-活动详情-评论Tab', '筛内容/评论人/时间；列：内容、评论人（头像）、部门、时间、点赞数。行操作回复/删除。删除级联子回复。'))
a(fig('后台-活动详情-评论回复.png', '后台-活动详情-评论Tab-回复弹窗', 'Modal「回复评论」。回复账号默认陈产品（个人账号）；另有活动小助手、官方客服。回复内容必填 maxLength=500。成功 toast 回复成功。'))
a(fig('后台-活动详情-精彩瞬间Tab.png', '后台-活动详情-精彩瞬间Tab', '筛内容/类型/提交人/时间。行：详情、删除。详情抽屉 footer「回复」评论该瞬间；评论/回复旁也可回复或删除。'))
a(fig('后台-活动详情-瞬间回复.png', '后台-活动详情-瞬间详情-行内回复', 'MomentInlineReplyForm：回复账号 + 回复内容 + 取消/确认。成功回复成功。'))
a(fig('后台-活动详情-奖品发放Tab.png', '后台-活动详情-奖品发放Tab', 'Tab 标题含权限文案但仍展示。发放：canGrantPrize 已发布且已结束，否则 grantPrizeBlockReason。目标类型 visiblePrizeTargetTypes：无分组字段则无「指定分组」。'))
a('<h4>组件显示逻辑</h4>')
a(table(
    ['组件路径', '组件类型', '默认状态', '显示/隐藏', '启用/禁用', '数据来源', '状态变化', '空/错/加载', '权限'],
    [
        ['后台-活动详情-编辑按钮', 'Button', '未结束启用', '始终显示', '已结束/终止 disabled+Tooltip', 'activityStatus', '—', '—', 'canEditActivity'],
        ['后台-活动详情-签到码按钮', 'Button', 'checkInEnabled', '未开启隐藏', '可点切 Tab', '活动字段', '—', '未开启扫码签到', '无'],
        ['后台-活动详情-场次卡', 'Card+Table', '周期/系列', 'needsSessionPick 才显示', '只读', 'sessions + signupHoursBefore', '终止后未开场不再举行', '无场次则整卡不渲染', '无'],
        ['后台-活动详情-报名-场次筛', 'Select showSearch', '全部场次', '周期/系列', '点查询才生效', 'sessionSelectOptions', 'filterBySessionId 按 answers.场次', '—', '无'],
        ['后台-活动详情-奖品Tab', 'Tab', '始终在 tab 列表', '始终', '发放受 canGrantPrize', 'prizes', '结束后可发', '演示导入限制', '文案声称隐藏但未藏'],
        ['后台-活动详情-评论Tab-回复弹窗', 'Modal', '点回复打开', '有评论行', '始终可开', 'author+content', 'adminReplyActivityComment', 'comments 新增子回复', '空内容拦提交', '无 RBAC'],
        ['后台-活动详情-瞬间详情-行内回复', 'MomentInlineReplyForm', '点回复展开', '详情抽屉已开', '始终', 'author+content max500', 'adminCommentOnMoment / adminReplyMomentComment', '瞬间评论树', '空内容拦提交', '无'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['回复评论', '后台-活动详情-评论Tab-回复', '行按钮回复', '有评论', '始终', '选回复账号、填内容、确定', 'adminReplyActivityComment；value=陈产品 展示「陈产品（个人账号）」', '新增 parentId 子记录', '回复成功', '请选择回复账号 / 请输入回复内容', '无 HTTP'],
        ['删除评论', '后台-活动详情-评论Tab-删除', '行/批量删除', '有记录', '始终', '确认', 'removeCommentsAndDescendants', '删根及全部子孙', '已删除…', '—', '无'],
        ['回复瞬间', '后台-活动详情-瞬间详情-回复', '抽屉 footer 回复或评论旁回复', '详情已开', '始终', '选账号填内容确认', 'adminCommentOnMoment / adminReplyMomentComment', '瞬间评论树', '回复成功', '请选择回复账号 / 请输入回复内容', '无 HTTP'],
    ],
))
a('<p>报名操作成功：「已通过/已驳回/已删除「」的报名」「已导出 N 条报名」。驳回弹窗 extra「选填」，非必填。一人报多场仍<strong>一行</strong>，场次列拼接「第 n 场」；筛指定场次只要 answers 含该 id 即保留该行（不拆行）。</p>')
a('<p>id 无效：Empty「未找到该活动」。详情 HTML 空：「暂无详情」。无收集字段：「暂无收集字段」。</p></article>')

a('<article><h3>7.5 后台-分类管理 / 规则设置（仅演示）</h3>')
a(fig('后台-分类管理-页面整体.png', '后台-分类管理-页面整体', '分类名称 maxLength=10；启用/禁用；占用中不可删。'))
a(fig('后台-规则设置-页面整体.png', '后台-规则设置（仅演示）-页面整体', '标题与面包屑「规则设置（仅演示）」。活动积分：下限 — 上限（默认 1–20），失败「上限不能小于下限」。后三行评论/打分/精彩瞬间：积分 + 每日上限。保存 toast「规则设置已保存」。'))
a(table(
    ['操作名称', '组件路径', '成功反馈', '失败反馈'],
    [
        ['保存分类', '后台-分类管理-保存', '分类已创建/已更新', '—'],
        ['删除分类', '后台-分类管理-删除', '已删除「」', '分类「」已被活动使用，无法删除'],
        ['批量启用/禁用', '后台-分类管理-批量', '已启用/禁用 N 个分类', '已选分类均已启用/禁用'],
        ['保存规则', '后台-规则设置（仅演示）-保存', '规则设置已保存', 'validateActivityPointRules 的 message.error'],
    ],
))
a('</article>')

a('<article><h3>7.6 后台-活动装修（仅演示）</h3>')
a('<p class="note">产品说明：<strong>装修以首页装修为准</strong>，此处仅演示样式。生产不单独维护活动装修；C 端发现页走统一 H5/PC 装修（微页面）。本页工作台仅方便对照卡片字段、列表样式等演示效果。</p>')
a(fig('后台-活动装修-页面整体.png', '后台-活动装修-页面整体', '侧栏「活动装修（仅演示）」。面包屑/标题「活动装修」。titleExtra：仅方便演示使用，实际无此装修页面，统一在H5/PC装修中实现。顶栏切移动端/PC。'))
a(fig('后台-活动装修-组件库.png', '后台-活动装修-组件库', '可拖可点：搜索、轮播图、活动、精彩瞬间。无悬浮按钮。'))
a(fig('后台-活动装修-画布.png', '后台-活动装修-画布', '默认块顺序：轮播 → 搜索 → 活动 → 精彩瞬间。页面标题默认「员工活动」。预览分类 Tab 仅全部/文化/体育/培训（无公益）。'))
a(fig('后台-活动装修-字段设置.png', '后台-活动装修-右侧配置-字段设置', '选中活动块后：置顶、分类、举办方式、状态、点赞、标题、活动时间、活动地点、报名进度、报名按钮。默认开。'))
a('<h4>字段说明</h4>')
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['页面标题', '后台-活动装修-页面设置-页面标题', 'Input', '空则回落员工活动', '员工活动', 'maxLength=20', '—', 'C 端 Shell 标题'],
        ['区块标题', '右侧配置-标题', 'Input', '否', '组件类型名', 'slice 0～40', '—', '活动/瞬间栏目标题'],
        ['列表样式', '右侧-样式', '选择', '活动/瞬间', '活动 large-image；瞬间 H5 scroll / PC large-image', '按类型限制', '大图/一行两列/左图右文/左文右图/横向滑动', 'C 端卡片布局'],
        ['展示条数 latestCount', '右侧', 'Number', '是', 'H5 活动3/瞬间3；PC 活动6/瞬间5', '1～20', '—', '首页切片'],
        ['搜索占位', '搜索块', 'text', '否', '搜索活动名称', '—', '—', '点进独立搜索页'],
        ['轮播', '轮播块', 'slides+样式', '无图则 C 端不渲染', '3 张演示图', '高 80～420；间隔 1～10 秒', 'bleed/inset/split；dot/number', 'HomeBanner'],
        ['查看全部', 'showMore', 'Switch+颜色+链接', '否', '开', '链接可指 list 或 past-moments', '—', 'H5/PC 跳转全部或往期'],
        ['字段设置（活动）', '右侧-字段设置', 'Switch×10', '否', '全开', '关则 C 端对应元素不渲染', '置顶/分类/举办方式/状态/点赞/标题/活动时间/活动地点/报名进度/报名按钮', 'decoActivityCardFields'],
        ['字段设置（瞬间）', '右侧-字段设置', 'Switch×2', '否', '全开', '关则往期卡片少标题或状态', '标题、状态', 'DECO_MOMENT_CARD_FIELD_TOGGLES'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置', '启用/禁用', '用户动作', '系统响应', '状态变化', '成功', '失败', '跳转/接口'],
    [
        ['添加组件', '后台-活动装修-组件库', 'chip 点击或拖入画布', '无', '始终', '点击/drop', 'addDecoBlock + save draft', 'localStorage', '无单独 toast', '无', '无 HTTP'],
        ['页面设置', '后台-活动装修-页面设置', '按钮', '无', '始终', '改标题确定', 'commit pageTitle', 'draft', '无', '无', 'Modal'],
        ['保存', '后台-活动装修-保存', '主按钮', '无', '始终', '点击', 'publishActivityDecoration 复制 draft→published', 'published 更新', '已保存，C端首页已更新', '无', 'C 端实际读 draft 非 published'],
        ['端切换', 'DecorationSurfaceTabs', 'Tab', '无', '始终', '点移动端/PC', '换 surface 画布', '独立两套 page', '无', '无', 'activity-layout-mobile/pc'],
        ['字段开关', '后台-活动装修-字段设置', 'Switch', '选中活动/瞬间块', '始终', '关某项', 'commit + draft persist', 'C 端对应元素不渲染', '无 toast', '无', '无 HTTP'],
    ],
))
a('<p>C 端 <code>useActivityDecoration</code> 绑定 draft。拖拽即 persist。published 仅「保存」写入，员工端未使用 <code>usePublishedActivityDecoration</code>。</p></article></section>')

# H5
a('<section id="page-h5"><h2>8. H5 页面需求</h2>')
a('<article><h3>8.1 H5-首页 / 搜索 / 全部</h3>')
a(fig('H5-首页-页面整体.png', 'H5-首页-页面整体', '装修 draft 块顺序：轮播 → HomeSearchRow（搜索按钮+我的图标）→ 活动列表（块 latestCount，默认 3）→ 往期精彩回顾。悬浮回主页。顶栏无「我的活动」文字。'))
a(fig('H5-首页-搜索行.png', 'H5-首页-搜索行', 'HomeSearchRow：左搜索按钮，右 40×40 用户图标按钮，aria-label=我的活动。'))
a(fig('H5-首页-我的活动.png', 'H5-首页-我的活动', '图标按钮 goH5MySignups → #/c/h5/my。依赖装修存在 search 块；删除搜索块后首页无此入口。搜索页/全部活动不渲染。'))
a(fig('H5-首页-轮播图.png', 'H5-首页-轮播图', 'HomeBanner：无有效图片则整块不渲染；可点进活动/投票/全部/往期。'))
a(fig('H5-首页-搜索入口.png', 'H5-首页-搜索入口', '来自装修 search 块；点击进 #/c/h5/search，不在首页内过滤。'))
a(fig('H5-首页-活动卡片.png', 'H5-首页-活动卡片', '大图：封面 badge+赞+叠标题；HomeQuotaBlock 已报名 a/b、余N位、进度、头像≤4、N人、CTA。左图右文/左文右图：封面无 badge；ActivitySideCopy 标题+置顶/状态/分类/举办方式；compact 名额无头像。'))
a(fig('H5-搜索-空查询.png', 'H5-搜索-空查询', '独立搜索页：壳标题「搜索」；ActivitySearchBar 顶栏；空 query「输入名称搜索活动」。无我的图标。'))
a(fig('H5-搜索-有结果.png', 'H5-搜索-有结果', '输入「篮球」匹配标题。无匹配「没有匹配的活动」。'))
a(fig('H5-全部活动-页面整体.png', 'H5-全部活动-页面整体', '可搜+分类（含公益）；有关键字无结果「未找到相关活动」。'))
a('<p>活动块分类 Tab 用 CLIENT_TABS（含公益）。装修画布预览 Tab 写死四项无公益，两端不一致。瞬间块无数据时整段不渲染（非空文案）。列表/搜索/全部数据源须为 5.1 可见集合。卡片字段由装修开关控制，默认全显。</p></article>')

a('<article><h3>8.2 H5-活动详情</h3>')
a(fig('H5-活动详情-页面整体.png', 'H5-活动详情-页面整体', '周四篮球夜：进行中/置顶/周期/体育；活动时间窗与共 N 场；每场开场截止；发起人；OrganizerCheckInQr 仅姓名全等；最近场次余位；已报名人员；介绍。进行中亦可出活动评分区。'))
a(fig('H5-活动详情-已报名人员.png', 'H5-活动详情-已报名人员', '入口：头像堆（预览 5）+已报名人员（N）+查看名单。空：「已报名人员 · 暂无已通过报名」。点开 H5 sheet：两列姓名+部门；周期/系列场次日期 Tab；N>5 出搜索姓名或部门。'))
a(fig('H5-活动详情-底栏操作.png', 'H5-活动详情-底栏操作', '点赞、收藏、评论（滚到社交区）、分享、主 CTA。'))
a(fig('H5-活动详情-报名CTA.png', 'H5-活动详情-报名CTA', '可报时「立即报名」启用，跳转 /signup。'))
a(fig('H5-已结束活动-详情.png', 'H5-已结束活动-详情', '已结束活动展示评分区；CTA「报名已结束」禁用。进行中活动同样可出评分区。'))
a(fig('H5-已结束活动-评分.png', 'H5-活动详情-活动评分', 'canShowActivityRating：进行中或已结束。已通过报名可评 1～5 星 + 确认评分；每人一次，toast「已评分」。'))
a(fig('H5-活动不存在-空态.png', 'H5-活动详情-活动不存在', '非法 id：标题与正文「活动不存在」，主按钮返回列表，另有返回上一页/回主页。'))
a('<h4>CTA 状态</h4>')
a(table(
    ['条件', '按钮文案', '启用', '点击'],
    [
        ['已结束或已终止', '报名已结束', '否', '无'],
        ['now &lt; signupStartAt', '报名未开始', '否', '无'],
        ['已报名+可取消+多场次', '立即报名', '是', 'adjust 进报名页'],
        ['已报名+可取消', '取消报名', '是', '打开取消弹窗'],
        ['已报名其他', '已报名', '否', '无'],
        ['报名窗关', '报名已截止', '否', '无'],
        ['可报', '立即报名', '是', 'signup 页'],
    ],
))
a('<p>无 CTA 文案「已满员」。场次「已满」不禁用勾选、不拦提交。分享：选择联系人 → 确定（N）→ toast「已分享给 N 人」。评论成功「评论成功」。发布瞬间：报名已通过且活动进行中或已结束即可，不限次数；未开始/已终止不可发。按钮「发布瞬间」，成功「发布成功」。</p></article>')

a('<article><h3>8.3 H5-报名页</h3>')
a(fig('H5-报名页-表单.png', 'H5-报名页-表单', 'legend 创建=确认报名、调整=立即报名。场次：截止（已截止）disabled；余N位/已满仅文案。默认 5 场，「展开全部场次」。空「暂无可以报名的场次」。'))
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['参加场次', 'H5-报名页-参加场次', 'checkbox 组', '周期/系列是', '无', '请选择要参加的场次；请选择仍可报名的场次', '未截止场次；已满仍可勾', 'CLIENT_SIGNUP_SESSION_LIMIT=5'],
        ['姓名', 'H5-报名页-姓名', 'text', '是（固定）', '陈产品', '不能为空；最多 20 字', '—', '报名身份'],
        ['手机号', 'H5-报名页-手机号', 'text digit', '按活动配置', '13800001111', '仅允许输入数字；最多 11 字', '—', '联系方式'],
        ['报名类型', '类型>1 时', 'radio', '是', '第一项', 'types=0 显示暂不可报名', 'signupSettings.type', 'canSubmit 需已选'],
        ['分组选择', 'H5-报名页-分组', 'checkbox 组', '按配置', '—', '展示上限文案，满员不禁用', '组名（上限 N 人）', 'inputType=group；提交不拦组余量'],
        ['同行人', 'companion', '人数+子表', '子项必填', '0', '最多 1～20', '姓名/手机/身份证', '占额外名额 待确认'],
    ],
))
a('<h4>操作</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置', '启用/禁用', '用户动作', '系统响应', '状态变化', '成功', '失败', '跳转'],
    [
        ['确认报名', 'H5-报名页-确认报名', '主按钮', 'types>0 且已选类型且（无需场次或有可报场次）', 'canSubmit 否则禁用', '点击', 'saveClientSignup', '报名记录', '报名成功 / 已更新报名 / 已取消报名(清光场次)', '校验文案；窗关则 CTA 文案作 toast', '回详情'],
        ['取消', 'H5-报名页-取消', '次按钮', '无', '始终', '点击', '关闭页', '无', '无', '无', '回详情'],
    ],
))
a('</article>')

a('<article><h3>8.4 H5-我的 / 收藏 / 瞬间 / 签到</h3>')
a(fig('H5-我的报名-页面整体.png', 'H5-我的报名-页面整体', '左图右文卡片（H5_MY_SIGNUPS_LIST_STYLE=left-image）。Tab：待审核/待参加/进行中/已结束/已驳回。'))
a(fig('H5-我的收藏-页面整体.png', 'H5-我的收藏-页面整体', '空「还没有收藏活动」+去看看活动。失效活动「活动已失效」。'))
a(fig('H5-往期瞬间-页面整体.png', 'H5-往期瞬间-页面整体', '读装修 moments.listStyle；首页 scroll 在本页变 two-col。空「暂无已结束活动」。'))
a(fig('H5-签到页-结果.png', 'H5-签到页-场次不存在', '无有效 s/t：活动名下展示「场次不存在」，按钮返回活动。'))
a('<h4>签到失败文案（代码）</h4><p>该活动未开启扫码签到；场次不存在；二维码无效或已刷新；还未到签到时间；签到已截止；请先报名该活动；报名通过后才能签到；未报名该场次。成功：签到成功；已签：你已签到过这场。</p></article></section>')

# PC
a('<section id="page-pc"><h2>9. PC 页面需求</h2>')
a(fig('PC-首页-页面整体.png', 'PC-首页-页面整体', '装修：轮播 + HomeSearchRow + 活动网格（latestCount 默认 6，PC 列数 columnCount）+ 往期。卡片样式同 H5 五套 listStyle。顶栏无我的入口。'))
a(fig('PC-首页-搜索行.png', 'PC-首页-搜索行', '与 H5 同结构 HomeSearchRow；搜索不再塞进活动区块标题栏。'))
a(fig('PC-首页-我的活动.png', 'PC-首页-我的活动', 'c-home-mine-btn → goPcMySignups。搜索页/全部活动无此按钮。'))
a(fig('PC-首页-轮播图.png', 'PC-首页-轮播图', 'PC 轮播按 375:bannerHeight 比例；无图不渲染。'))
a(fig('PC-全部活动-页面整体.png', 'PC-全部活动-页面整体', '与 H5 同一套过滤与 CTA 文案，布局为网格。'))
a(fig('PC-搜索-页面整体.png', 'PC-搜索-页面整体', '搜索变体，逻辑同 H5。'))
a(fig('PC-活动详情-页面整体.png', 'PC-活动详情-页面整体', '左介绍右 aside：名额、签到码（发起人）、场次、名单、engage、CTA。'))
a(fig('PC-活动详情-右侧栏.png', 'PC-活动详情-右侧栏', '名额与 CTA 固定在右侧。已报名人员同 H5 组件，弹层为 Modal。'))
a(fig('PC-活动详情-已报名人员.png', 'PC-活动详情-已报名人员', 'Modal 两列名单；场次日期 Tab 与搜索规则同 H5。'))
a(fig('PC-活动详情-报名弹窗.png', 'PC-活动详情-报名弹窗', 'hash /signup 或点立即报名打开 PcSignupModal，表单与 H5 SignupForm 同一套。'))
a(fig('PC-已结束活动-详情.png', 'PC-已结束活动-详情', '评分与瞬间规则同 H5。'))
a(fig('PC-我的报名-页面整体.png', 'PC-我的报名-页面整体', 'PC_MY_SIGNUPS_LIST_STYLE=left-image，不跟首页装修 listStyle。五 Tab 同 H5。'))
a(fig('PC-我的收藏-页面整体.png', 'PC-我的收藏-页面整体', '空态同 H5。'))
a(fig('PC-往期瞬间-页面整体.png', 'PC-往期瞬间-页面整体', '返回 ← 返回首页。'))
a('<p>PC 无独立 checkin 路由。员工扫码必须用 H5 URL。发现/搜索/详情过滤同 5.1。发起人若在 PC 详情满足姓名全等，可在 aside 看 OrganizerCheckInQr。</p></section>')

a('<section id="data-fields"><h2>10. 数据字段与枚举</h2>')
a(table(
    ['枚举', '值', '用途'],
    [
        ['activityTypes', '公司活动、疗休养活动、体检活动、项目活动', '表单类型；疗休养有额外行程字段'],
        ['visibilityOptions', '全员、按部门、自定义人群、导入人群', '后台配置；C 端按 5.1 过滤'],
        ['auditStatuses', '待提交、待审核、已通过、已驳回、无需审核', '活动审批'],
        ['publishStatuses', '未发布、已发布', 'C 端可见门槛'],
        ['activityStatuses', '未开始、进行中、已结束、已终止', '时间/终止写入'],
        ['lifecycleStatuses', '未发布 + 上述四态', '列表展示：未发布优先'],
        ['scheduleType', 'once / recurring / series', '单次/周期/系列'],
        ['CLIENT_TABS', '全部、文化、体育、培训、公益', 'C 端分类，与后台分类名耦合'],
        ['报名记录状态', '待审核、已通过、已驳回', 'related signups'],
        ['activityDecoBlockTypes', 'search / banner / activity / moments', '首页装修块'],
        ['activityDecoListStyles', 'large-image / two-col / left-image / left-text / scroll', '卡片布局'],
        ['sessionOverviewStatuses', '未开始、进行中、已结束、已取消', '纯函数 deriveClockSessionStatus；报名 Tab 未渲染概况表'],
        ['ACTIVITY_DECO_MOCK_VERSION', '11', 'localStorage 版本不匹配则丢弃装修'],
    ],
))
a('<p>ACTIVITY_MOCK_VERSION=38。种子活动 28 条（含志愿服务说明会）。ACTIVITY_POINT_RULES_MOCK_VERSION=7。报名积分默认下限 1、上限 20；signupPointsDailyMax 仍存模型默认 10，规则页活动积分行不展示。评论/打分/瞬间默认单次 1、日上限 10。装修 STORAGE_KEY=<code>koni-activity-decoration</code>。</p></section>')

a('<section id="apis"><h2>11. API / 数据接口清单</h2>')
a('<p>代码中<strong>无</strong> fetch / axios。活动/报名仍内存 mock。装修与列表视图使用 localStorage。engagement 刷新仍丢。</p>')
a(table(
    ['接口用途', '方法', '路径', '触发场景', '请求参数', '响应字段', '是否真实接口', '备注'],
    [
        ['活动 CRUD', '—', '—', '保存/删', 'Activity', '—', '否', 'activityStore'],
        ['发布/撤销/终止/截止报名', '—', '—', '列表按钮', 'id', '—', '否', 'patchActivities'],
        ['报名提交/取消/签到', '—', '—', 'C 端', 'answers / token', '—', '否', 'signupStore'],
        ['签到码 URL', '—', 'hash', '扫码', 's,t', '—', '否', 'activityCheckIn 拼 #/c/h5/{id}/checkin'],
        ['装修草稿/发布', 'localStorage', 'koni-activity-decoration', '拖拽/保存', 'draft+published 两套 page', 'pageTitle+blocks', '否（浏览器存储）', 'C 端读 draft'],
        ['列表视图', 'localStorage', 'activity-list-view', '切列表/卡片', 'list|card', '—', '否', 'readListViewMode'],
    ],
))
a('<p>建议接口（推测需要，非已实现）：GET/POST/PUT/DELETE /activities；POST publish/revoke/terminate/close-signup；报名审批；分类；积分规则；签到校验；文件导入。</p></section>')

a('<section id="exceptions"><h2>12. 异常场景与边界条件</h2>')
a(table(
    ['场景', '用户操作', '系统行为', '证据'],
    [
        ['非法活动 id', '打开 #/c/h5/999', '活动不存在 + 返回列表', '截图 H5-活动不存在'],
        ['签到缺场次参数', '打开 checkin 无 query', '场次不存在', '截图 H5-签到页'],
        ['动态码过期', '扫旧码', '二维码无效或已刷新', 'activityCheckIn'],
        ['未报名扫码', '扫码', '请先报名该活动 / 未报名该场次 / 报名通过后才能签到', 'applyActivityCheckIn'],
        ['过早/过晚扫', '扫码', '还未到签到时间 / 签到已截止', '开放分钟与场次结束'],
        ['报名校验', '空姓名/超长/非数字', '{label}不能为空 / 不能超过 N 字 / 仅允许输入数字', 'SignupForm'],
        ['满员场次', '勾选', '展示已满；checkbox 不禁用；提交不校验名额', 'SignupForm remainLabel'],
        ['活动占用去重', '一人多场', '活动已报名人数按人计 1；场次余位按含该场次的记录数', 'uniqueBySignupOccupant vs sessionOccupiedCount'],
        ['截止后取消', '取消报名', '报名已截止，无法取消', 'cancelSignup closed'],
        ['发起人取消', '点取消', '与普通员工相同：弹窗确认后取消报名', '发起人是文本，不拦截'],
        ['批量发布无资格', '批量发布', '已选未发布活动均未审批通过… 或均已发布', 'ActivityListPage'],
        ['分类占用删除', '删除分类', '分类「」已被活动使用，无法删除', 'isCategoryInUse'],
        ['奖品导入非模板', '导入', '演示环境请下载 CSV 模板后导入', 'PrizeList'],
        ['未保存离开表单', '取消', '未保存的修改将丢失', 'dirty confirm'],
        ['已结束/已终止点编辑', '列表/详情编辑按钮 disabled', 'toast：活动已结束/已终止，不能编辑', 'canEditActivity'],
        ['装修去掉搜索块', '画布删除搜索', '首页无搜索也无「我的活动」图标', 'HomeMineBtn 只包在 search 块'],
        ['搜索/全部页找我的', '进 search 或 list', '无 c-home-mine-btn', 'H5ActivityHome 测试'],
        ['单次活动报名 Tab', '打开报名', '无场次筛、无人表场次列', 'needsSessionPick=false'],
        ['装修无轮播图', '去掉全部 imageUrl', 'HomeBanner return null', 'HomeBanner'],
        ['可见范围外用户', '打开列表/深链', '不出现；详情/报名/签到「活动不存在」', '5.1；原型未接'],
        ['司龄不足', '打开列表/报名', '不可见且不可报', '5.1 报名司龄限制'],
    ],
))
a('</section>')

a('<section id="non-functional"><h2>13. 非功能需求</h2>')
a('<ul><li>兼容：后台 Ant Design 桌面布局；H5 390 宽卡片；PC 宽屏双栏。' + todo + ' 具体浏览器矩阵。</li>')
a('<li>性能：活动列表 mock 28 条。首页条数由装修 latestCount（默认 H5 3 / PC 6）。</li>')
a('<li>安全：无鉴权、无 CSRF、签到 token 仅前端生成。' + todo + '</li>')
a('<li>无障碍：部分 role=dialog/tablist；H5 底栏 aria 点赞/收藏。</li>')
a('<li>错误：antd message / CEndToast；无全局错误页除活动不存在。</li></ul></section>')

a('<section id="analytics"><h2>14. 埋点与指标建议</h2><p><span class="status guess">建议补充</span> 代码无埋点 SDK。</p>')
a(table(
    ['事件名称', '触发动作', '关键属性', '业务目的'],
    [
        ['activity_publish', '发布成功', 'activity_id, schedule_type', '发布漏斗'],
        ['activity_signup_submit', '确认报名', 'id, session_ids, is_adjust', '报名转化'],
        ['activity_signup_cancel', '确认取消', 'id', '流失'],
        ['activity_checkin_result', '扫码结果', 'id, session_id, result', '核销率'],
        ['activity_cta_disabled_click', '点禁用 CTA', 'label', '发现规则误解'],
    ],
))
a('</section>')

a('<section id="acceptance"><h2>15. 验收标准</h2>')
a('<ul>')
a('<li>Given 未发布活动 When 员工打开 H5 列表 Then 不出现该活动。</li>')
a('<li>Given 可见范围=按部门 When 员工部门不在已选及下级 Then 列表/搜索/往期不出现；打开详情 hash 为「活动不存在」。</li>')
a('<li>Given 自定义人群不含当前姓名 When 打开 Then 同上。</li>')
a('<li>Given 导入人群不含当前姓名与手机 When 打开 Then 同上。</li>')
a('<li>Given 报名司龄限制=3 年且员工司龄&lt;3 When 打开 Then 不可见且不可报名。</li>')
a('<li>Given 发起人本人 When 可见范围不含自己 Then 仍可见自己发起的活动。</li>')
a('<li>Given 已发布可报活动 When 员工提交合法表单 Then toast 报名成功且后台报名 Tab 可见。</li>')
a('<li>Given 已报名且报名窗内 When 点取消报名 Then 弹窗确认后取消，发起人字段不拦截。</li>')
a('<li>Given 进行中已发布 When 点撤销 Then 按钮禁用并提示应终止。</li>')
a('<li>Given 开启静态签到 When 下载二维码 Then 成功提示二维码已下载。</li>')
a('<li>Given 动态码 When 过期再扫 Then 二维码无效或已刷新。</li>')
a('<li>Given 已结束或进行中且已通过报名 When 评分 Then 首次 toast 已评分，重复不可再评。</li>')
a('<li>Given 进行中已通过报名 When 打开详情 Then 可见活动评分区块。</li>')
a('<li>Given 报名已通过且活动进行中或已结束 When 打开发布瞬间 Then 可发布，且不限制条数。</li>')
a('<li>Given 分类被活动引用 When 删除 Then 无法删除提示。</li>')
a('<li>Given 已结束活动 When 点编辑 Then 禁用并提示活动已结束，不能编辑。</li>')
a('<li>Given 装修保存 When 打开 H5 首页 Then 标题与块顺序与画布一致（现状：草稿即可见，不点保存也会变）。</li>')
a('<li>Given 周期活动报名 Tab When 收起查询 Then 仍能看到场次 Select；单次活动无该筛、无人表场次列。</li>')
a('<li>Given 概览改日期范围 When 刷新 KPI Then 数字与待办/进行中表随范围变。</li>')
a('<li>Given 打开规则页 When 看标题与侧栏 Then 文案为「规则设置（仅演示）」。</li>')
a('<li>Given 打开活动装修 When 看侧栏 Then 「活动装修（仅演示）」；页内可见「仅演示样式、以首页装修为准」类说明。</li>')
a('<li>Given 规则页活动积分上限小于下限 When 失焦或保存 Then 「上限不能小于下限」。</li>')
a('<li>Given 规则页评论每日上限小于单次 When 保存 Then 「每日上限不能小于单次积分」。</li>')
a('<li>Given 活动积分开启且填出范围 When 保存活动 Then 「报名积分须在 min～max 之间」或表单项「须在 min～max 之间」。</li>')
a('<li>Given 周期报名页超过 5 场 When 未展开 Then 只显示 5 场且有「展开全部场次」。</li>')
a('<li>Given 评论 Tab 点回复 When 选马甲账号并填内容 Then toast 回复成功且员工端可见该回复。</li>')
a('<li>Given 装修关闭「报名按钮」When 打开 H5 首页 Then 活动卡无 CTA 文案。</li>')
a('<li>Given 搜索页或全部活动页 When 查看顶栏/搜索行 Then 无我的活动按钮。</li>')
a('</ul></section>')

a('<section id="risks"><h2>16. 风险与待确认问题</h2><ul>')
a('<li>真实组织树、导入模板列、推送渠道、积分入账账户 ' + todo + '。</li>')
a('<li>报名是否允许一人多场占多个名额、同行人是否占名额 ' + todo + '。</li>')
a('<li>活动审批默认关（activityApprovalEnabled=false），生产是否默认开 ' + todo + '。</li>')
a('<li>兴趣圈活动是否复用本 PRD 状态机——代码另有 interest-group-activity-*，本文件不覆盖。</li>')
a('<li>装修「保存」与 C 端读 draft 语义分裂。</li>')
a('<li>截图「签到码弹窗/截止确认」实际为更多菜单展开态；确认框与 QR Modal 以文案表为准。</li>')
a('</ul></section>')

html_body = '\n'.join(body)
g.write_prd('activity-app', '活动应用-PRD.html', '活动应用 产品需求文档', TOC, html_body)

# verify images
prd = Path(__file__).resolve().parent / '活动应用-PRD.html'
text = prd.read_text(encoding='utf-8')
import re
missing = []
for m in re.finditer(r'src="screenshots/([^"]+)"', text):
    p = Path(__file__).resolve().parent / 'screenshots' / m.group(1)
    if not p.exists():
        missing.append(m.group(1))
print('missing', missing or 'none', 'bytes', prd.stat().st_size)
