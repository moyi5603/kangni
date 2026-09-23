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
    ('overview', '2. 产品概述'),
    ('roles', '3. 用户角色与权限'),
    ('ia', '4. 页面结构 / 信息架构'),
    ('features', '5. 已实现功能清单'),
    ('flows', '6. 用户流程'),
    ('page-admin', '7. 后台页面需求'),
    ('page-h5', '8. H5 页面需求'),
    ('page-pc', '9. PC 页面需求'),
    ('data-fields', '10. 数据字段与枚举'),
    ('apis', '11. API / 数据接口清单'),
    ('non-functional', '12. 非功能需求'),
    ('analytics', '13. 埋点与指标建议'),
    ('acceptance', '14. 验收标准'),
    ('risks', '15. 风险与待确认问题'),
]

body: list[str] = []
a = body.append

a('<section id="doc-note"><h2>1. 文档说明</h2><ul>')
a('<li>文档来源：基于康尼即时激励 React/TSX 原型反向分析（html-to-prd）。截图 2026-09-21 全量 + 2026-09-22 对照增量重拍。</li>')
a('<li>分析范围：管理后台 <code>#/incentive/*</code>；员工 H5 <code>#/c/h5/incentive/*</code>；员工 PC <code>#/c/pc/incentive/*</code>。不含勋章应用本体、积分商城、首页装修。</li>')
a('<li>生成日期：2026-09-22</li>')
a('<li>2026-09-22 增量：① 发放记录列表列名「表彰理由 / 认可理由」（概览表仍「事实描述」）；详情按类型显示认可理由/表彰理由，有附件则展示可下载链接并写入 <code>Recognition.attachments</code>。② 热门勋章 H5/PC 增加类型（全部/公司表彰/同事认可）、分类、时间范围（近一个月/三个月/半年）；公司表彰名单可进光荣事迹。③ PC 首页热门同样带类型/分类/时间筛选。H5 首页热门仍为同事认可本年 Top3。</li>')
a('<li>可信度：文案、校验、状态机以源码为准。数据为内存 mock（<code>incentiveStore</code> / <code>incentiveH5Data</code>），无 HTTP。接口列为建议而非已实现。</li>')
a(f'<li>标记：{impl} {guess} {todo}</li>')
a(f'<li>优先级：{p0} 主路径；{p1} 运营完整度；{p2} 可延后。</li>')
a('<li>组件一律使用 <code>页面-模块-组件名称</code>。</li></ul></section>')

a('<section id="overview"><h2>2. 产品概述</h2>')
a('<p><strong>产品定位：</strong>康尼「员工与组织」下的即时激励应用。后台配置勋章、额度、审核与风控；员工在 H5/PC 发放同事认可、浏览热门勋章与动态、查看个人勋章墙并接收勋章消息。当前为可交互原型（内存 mock），用于评审交互而非生产账本。</p>')
a('<p><strong>目标用户：</strong>① 运营/HR（后台配置与公司表彰、审核队列）；② 普通员工（C 端发放与被认可）。原型无登录，后台演示用户顶栏为「陈产品」，审核权限常量 <code>DEMO_CURRENT_USER=陈佳</code>，C 端当前用户 <code>ME_ID</code> 对应林晓云。</p>')
a('<p><strong>核心场景：</strong>① 配置归属/分类/勋章与月度积分额度；② 员工选勋章、多人、原因、附件提交同事认可；③ 审核员通过并发放或驳回；④ 管理员发布公司表彰直接入账；⑤ 员工看动态、热门排行、个人中心与消息。</p>')
a('<p><strong>主要价值：</strong>把口头表扬收成可追溯的勋章+积分发放，并用审核/风控提示约束互刷，不在提交时硬拦截。</p></section>')

a('<section id="roles"><h2>3. 用户角色与权限</h2>')
a('<p>原型<strong>无</strong>登录鉴权、菜单 ACL、集团/单位管理员切换（设计稿曾提角色 Select，当前概览页无该控件）。下表为产品语义 + 代码条件。</p>')
a(table(
    ['角色', '入口', '代码证据', '可做', '限制'],
    [
        ['后台运营', '#/incentive/*', '无 permission 判断', '勋章 CRUD、归属分类、额度、填写/风控、发布公司表彰、导出发放记录（toast）', '打开后台即可全部菜单'],
        ['审核员', '发放记录 / 概览待办', 'canReviewPeerRecords：personalReviewEnabled 且 reviewerIds 含 DEMO_CURRENT_USER=陈佳', '待审核行显示「审核」；详情抽屉「驳回」「通过并发放」', '非审核员点审核 toast「当前账号不是审核员，无审核权限」'],
        ['C 端当前员工', '#/c/h5|pc/incentive', 'ME_ID / 林晓云；组织树排除自己', '发同事认可、看动态/排行/个人中心/消息', '不可给自己发；公司表彰仅后台'],
        ['被指定审核员', '规则设置-审核员 TreeSelect', 'INCENTIVE_PEOPLE_TREE 叶子为人名', '被勾选后拥有发放记录审核能力', '关闭审核后新提交直接发放'],
    ],
))
a('<p class="note">C 端额度展示写死「本月额度 200 / 已发 50 / 可用 150」。与后台配额表未打通。{todo}</p></section>')

a('<section id="ia"><h2>4. 页面结构 / 信息架构</h2>')
a(table(
    ['端', '页面', 'Hash', '组件'],
    [
        ['后台', '概览', '#/incentive/incentive-dashboard', 'IncentiveDashboardPage'],
        ['后台', '勋章管理', '#/incentive/incentive-badges?treeId=', 'IncentiveBadgeListPage；treeId 同步当前归属 Tab'],
        ['后台', '新建/编辑勋章', '#/incentive/incentive-badge-create | incentive-badge-edit/{id}', 'IncentiveBadgeFormPage'],
        ['后台', '发放记录', '#/incentive/incentive-records', 'IncentiveRecordListPage'],
        ['后台', '规则设置', '#/incentive/incentive-settings?tab=points|content|risk', 'IncentiveSettingsPage'],
        ['H5/PC', '首页', '#/c/{surface}/incentive', 'IncentiveHome；PC 另渲染 IncentivePcAside'],
        ['H5/PC', '发放勋章', '.../issue', 'IncentiveIssue 两步：选勋章 → 填对象/原因/附件'],
        ['H5/PC', '热门勋章', '.../ranking[/{badgeId}]', 'IncentiveRanking；筛选全部/公司表彰/同事认可 + 分类 + 近一个月/三个月/半年'],
        ['H5/PC', '个人中心', '.../profile', 'IncentiveProfile'],
        ['H5/PC', '消息 / 勋章获得页', '.../messages | /award', 'IncentiveMessages / IncentiveAwardView'],
        ['H5/PC', '个人勋章墙', '.../person/{id}', 'IncentivePersonHonor'],
        ['H5/PC', '公司表彰事迹', '.../company/{id}', 'IncentiveCompanyStory；排行选公司表彰后点获得人进入'],
    ],
))
a(fig('即时激励-左侧菜单.png', '后台-导航-左侧菜单', '一级菜单：概览、勋章管理、发放记录、规则设置。'))
a('</section>')

a('<section id="features"><h2>5. 已实现功能清单</h2>')
a(table(
    ['模块', '功能点', '说明', '端', '优先级', '状态'],
    [
        ['概览', 'KPI/饼图/待办/近期发放', '默认近 30 天；KPI 点击进发放记录或勋章管理，不带筛参', '后台', p1, impl],
        ['勋章', '归属 Tab + 分类分组卡片', '空分类不展示；编辑/删除勋章', '后台', p0, impl],
        ['勋章', '归属与分类管理抽屉', '增删改、上下移；勋章占用不可删；至少保留 1 个归属', '后台', p0, impl],
        ['勋章', '新建/编辑表单', '图标、归属、分类、名称 max20 同归属不重复、组织、积分≥1、启用、四段描述', '后台', p0, impl],
        ['发放', '查询/导出/详情', '列表代码列名「表彰理由 / 认可理由」但当前宽度 0 看不见；详情按类型改 label 且可下附件；导出仅 toast', '后台', p0, impl],
        ['发放', '审核通过/驳回/撤回', '驳回必填意见；通过确认弹窗；撤回扣积分文案、保留日志', '后台', p0, impl],
        ['表彰', '发布公司表彰抽屉', '多人、公司勋章、月份、事由字数、证明材料转 DataURL 写入 attachments；免审核直接发放', '后台', p0, impl],
        ['规则', '积分额度', '按组织/人；新增/调整/批量；月度总额=人数×单人额度；已用 Progress', '后台', p0, impl],
        ['规则', '填写设置', '最少字数≥1、placeholder；同事认可与表彰共用', '后台', p0, impl],
        ['规则', '审核+风控', '同事认可审核开关与审核员；重复/频率/互认仅提示不拦截', '后台', p0, impl],
        ['发现', '热门勋章+认可动态', 'H5 首页 Top3（本年同事认可）+查看全部；PC 首页可筛类型/分类/时间；点接收人进勋章墙', 'H5/PC', p0, impl],
        ['发放C', '两步发放', '额度条、分类选勋章、详情、对象树、原因、附件、额度校验', 'H5/PC', p0, impl],
        ['排行', '热门筛选+获得名单', '类型/分类横向滚动（H5 group）或 Tabs（PC）；时间 Dropdown；同事认可进个人墙，公司表彰进光荣事迹', 'H5/PC', p0, impl],
        ['我的', '个人中心勋章墙', '公司表彰/同事认可 Tab；H5 轮播+分类折叠；PC 网格+累计积分', 'H5/PC', p0, impl],
        ['消息', '助手会话+获得页', '未读红点；分享按钮无实现', 'H5/PC', p1, impl],
        ['侧栏', 'PC 与我相关', '勋章/可用积分/本月已发、发放按钮、最近获得 3 条', 'PC', p1, impl],
    ],
))
a('</section>')

a('<section id="flows"><h2>6. 用户流程</h2>')
a('<h3>6.1 同事认可（主路径）</h3>')
a('<p>入口：H5 首页 FAB「发放勋章」或 PC 侧栏「发放勋章」→ 选同事认可勋章 → 选 ≥1 人（组织树，排除自己）→ 填原因（≥ minimumReasonLength，默认 10）→ 上传 1～5 个附件（单文件 ≤20MB）→ 确认发放。系统 toast「已提交 N 条认可记录」，重置到选勋章步。若后台开启审核则记录为待审核，否则 {todo} C 端提交不写后台 store，仅为 message.success。</p>')
a('<h3>6.2 审核发放</h3>')
a('<p>审核员在发放记录点编号/详情/审核 → 抽屉「认可详情」→ 通过并发放（二次确认：向对象发放勋章及积分）或驳回（Modal 必填审核意见）。成功 toast「已通过并发放」/「已驳回」，关抽屉。</p>')
a('<h3>6.3 公司表彰</h3>')
a('<p>发放记录「发布公司表彰」→ 选人、公司勋章、月份、事由、证明材料 → 确认发放。证明材料经 FileReader 转 DataURL 写入每条记录 attachments。Alert 写明免审核。每人一条记录。发布范围「指定部门」时必选部门 TreeSelect。</p>')
a('<h3>6.4 员工浏览</h3>')
a('<p>首页热门 → 排行（可选类型/分类/近一个月等）→ 同事认可点人进个人勋章墙，公司表彰点人进光荣事迹。动态卡片点接收人进墙。消息卡片进获得页。个人中心看已获得/未获得（locked）。</p></section>')

# ---- admin pages ----
a('<section id="page-admin"><h2>7. 后台页面需求</h2>')

a('<article id="admin-overview"><h3>7.1 概览</h3>')
a('<p><strong>页面目标：</strong>按统计周期掌握待审、已发、积分、异常、启用勋章，并处理待办。</p>')
a(fig('后台-概览-页面整体.png', '概览-页面-整体布局', '标题行含统计周期；下为 KPI、双饼图、待办关注、近期发放。'))
a(fig('后台-概览-KPI指标卡.png', '概览-KPI模块-指标卡', '待审核/已发放/累计发放积分/异常记录/启用勋章。前四张点击 onNavigate(incentive-records)，启用勋章进 incentive-badges。'))
a(fig('后台-概览-发放状态分布.png', '概览-图表模块-发放状态分布', '饼图分段：已发放绿、待审核黄、已驳回红、已撤回灰。数据=周期内 recognitions 按 status 计数。'))
a(fig('后台-概览-勋章分布.png', '概览-图表模块-勋章分布', '仅统计状态=已发放的 badgeName 计数。'))
a(fig('后台-概览-待办关注.png', '概览-待办模块-待审核表', '过滤 status=待审核；空态「暂无待审核记录」。列与发放记录共用组件但 reasonLabelByType 默认 false，理由列标题仍为「事实描述」；操作列仅详情。'))
a(fig('后台-概览-近期发放.png', '概览-近期模块-已发放表', '已发放按 time 降序；分页走 b2bStandards.table。空态「周期内暂无已发放记录」。'))
a(fig('后台-概览-认可详情抽屉.png', '概览-待办模块-认可详情抽屉', '与发放记录共用 RecognitionDetailDrawer；待审核且当前用户是审核员时底栏有驳回/通过并发放。'))
a('<h4>组件显示逻辑</h4>')
a(table(
    ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
    [
        ['概览-标题行-统计周期', 'RangePicker', '近 29 天～今天', '始终显示', '可改', 'defaultOverviewDateRange', '改范围重算 KPI/表', '日期非法则 inRange 视为命中', '无'],
        ['概览-KPI模块-待审核卡', 'OverviewKpiCard', '数字', '始终', '可点', 'computeIncentiveOverviewStats.pendingCount', '点进发放记录', '0 仍展示', '无'],
        ['概览-待办模块-表格', 'Table', '有数据则表', 'attentionRows.length', '行内详情', 'scoped 中待审核', '开抽屉', 'Empty 暂无待审核记录', '审核按钮不在此表 extraActions'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['进入发放记录', '概览-KPI模块-指标卡', 'KPI 卡片', '无', '始终可点', '点击', 'onNavigate incentive-records', '离开本页', '无 toast', '无', 'hash 切换，无查询参数'],
        ['打开详情', '概览-待办模块-编号链接', '编号 Button link', '有记录', '始终', '点击', 'setActiveId', '开抽屉', '无', '关联记录不存在时 warning', '内存'],
    ],
))
a('</article>')

a('<article id="admin-badges"><h3>7.2 勋章管理</h3>')
a(fig('后台-勋章管理-页面整体.png', '勋章管理-页面-整体布局', 'Tabs 为归属（公司表彰 / 同事认可）；右上「归属与分类管理」「新增勋章」。'))
a(fig('后台-勋章管理-归属Tabs.png', '勋章管理-归属模块-Tabs', 'activeKey=scopeId，写入 hash treeId。分类下无勋章的分组不渲染。'))
a(fig('后台-勋章管理-勋章目录.png', '勋章管理-目录模块-勋章卡片', '卡片含图标、名称、定义摘要、积分、已启用/停用、编辑、删除。'))
a(fig('后台-勋章管理-分类抽屉.png', '勋章管理-分类模块-归属与分类管理', '右侧 Drawer 760px。统计归属/分类数；每归属可上移下移编辑删除、新增分类；分类同样排序与删除。'))
a('<h4>字段说明</h4>')
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['名称', '勋章管理-分类模块-新增/编辑弹窗', 'Input', '是', '空/原名', 'trim 非空', '—', '归属或分类显示名'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['新增勋章', '勋章管理-标题操作-新增勋章', 'primary Button', '无', '始终', '点击', 'onNavigate incentive-badge-create', '进表单', '无', '无', 'hash'],
        ['编辑勋章', '勋章管理-目录模块-编辑', '编辑', '卡片存在', '始终', '点击', 'incentive-badge-edit/{id}', '进表单', '无', '无', 'hash'],
        ['删除勋章', '勋章管理-目录模块-删除', '删除', '无', '始终', '确认弹窗', 'deleteBadge', '卡片消失', '勋章“x”已模拟删除', '取消关闭', '内存；历史认可保留'],
        ['删除归属', '勋章管理-分类模块-删除', '删除', '无勋章占用', '有勋章则先 warning 不弹确认；至少留 1 个归属', '确认删除', 'deleteScope', 'Tab 消失', '已删除', '仍被使用 / 至少保留一个归属', '内存'],
        ['上移/下移', '勋章管理-分类模块-排序', '箭头', '非首/末', '首禁用上、末禁用下', '点击', '交换 sort', '列表重排', '已上移/已下移', '无', '内存'],
    ],
))
a('</article>')

a('<article id="admin-badge-form"><h3>7.3 新建 / 编辑勋章</h3>')
a(fig('后台-新建勋章-表单页.png', '新建勋章-表单模块-整页', '横向表单 label 112px。未保存离开走 modal「确认离开？」。'))
a(fig('后台-新建勋章-图标上传.png', '新建勋章-表单模块-勋章图标', 'picture-card，maxCount=1，beforeUpload 拦真传，读 DataURL。新建必填「请上传勋章图标」。'))
a(fig('后台-新建勋章-底栏操作.png', '新建勋章-底栏模块-取消保存', '取消 leave；保存 validateFields 后 saveBadge。'))
a(fig('后台-编辑勋章-表单页.png', '编辑勋章-表单模块-整页', '预填 b1 主动补位。编辑模式图标非必填。勋章不存在则 Empty「勋章不存在或已删除」。'))
a('<h4>字段说明</h4>')
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['勋章图标', '新建勋章-表单模块-勋章图标', 'Upload', '新建是/编辑否', '编辑已有 url', '新建 required', '图片', '展示用 DataURL'],
        ['勋章归属', '新建勋章-表单模块-勋章归属', 'Select', '是', 'hash tree 或首个 scope', 'required', 'scopes', '公司表彰则 riskLabel=直接发放，否则低风险'],
        ['分类', '新建勋章-表单模块-分类', 'Select', '是', 'tree 分类或空', 'required；随归属过滤', '该归属 categories', '卡片分组'],
        ['勋章名称', '新建勋章-表单模块-勋章名称', 'Input', '是', '空', '非空 trim；max 20；同归属名称不重复', '—', '发放展示名'],
        ['适用组织', '新建勋章-表单模块-适用组织', 'TreeSelect 多选', '是', '康尼集团', '数组 min 1', 'BADGE_ORG_TREE', 'C 端过滤 {todo} 未接'],
        ['积分', '新建勋章-表单模块-积分', 'InputNumber', '是', '1', 'min 1 整数', '—', '单次发放扣额/入账'],
        ['启用状态', '新建勋章-表单模块-启用状态', 'Switch', '否', '启用', '—', '启用/停用', '计入概览启用勋章'],
        ['描述', '新建勋章-表单模块-描述', 'TextArea 12 行', '是', '四段标题模板', 'validateBadgeDescription 须含【行为定义】【积分认定标准】【典型场景说明】【不计分情形】', '—', '认定口径'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['保存', '新建勋章-底栏模块-保存', 'primary 保存', '校验通过', 'loading=submitting', '点击', 'saveBadge 内存', 'dirty=false 回列表', '已创建勋章/已保存勋章', '校验失败滚到首错', '无 HTTP'],
        ['取消', '新建勋章-底栏模块-取消', '取消', '无', '始终', '点击', 'dirty 则确认离开', '回列表或留页', '无', '点取消留页', 'onBack'],
    ],
))
a('</article>')

a('<article id="admin-records"><h3>7.4 发放记录</h3>')
a(fig('后台-发放记录-页面整体.png', '发放记录-页面-整体布局', '查询区 + 共 N 条 + 导出 + 发布公司表彰 + 表格。'))
a(fig('后台-发放记录-查询筛选.png', '发放记录-查询模块-默认筛选项', '默认三字段：认可编号、认可对象、发起人 + 查询/重置/展开。'))
a(fig('后台-发放记录-查询筛选展开.png', '发放记录-查询模块-展开筛选项', '展开后增加认可类型、所属部门、发起时间、状态、异常标识。点查询才写入 query。'))
a(fig('后台-发放记录-列表表格.png', '发放记录-列表模块-表格', '可见列：编号、类型、发起人、认可对象、部门、勋章、积分、状态、异常、时间、操作。代码第 8 列为「表彰理由 / 认可理由」，无 width 且 scroll.x=1280 时该列宽度为 0，表内看不到文案。'))
a(fig('后台-发放记录-表头.png', '发放记录-列表模块-表头', 'DOM 含「表彰理由 / 认可理由」，截图中积分与状态相邻，与 0 宽列一致。理由全文在详情抽屉。'))
a(fig('后台-发放记录-发布表彰抽屉.png', '发放记录-表彰模块-发布公司表彰', 'Alert「公司表彰免审核」。表彰对象 TreeSelect、公司勋章、月份、事由、证明材料、发布范围。确认发放在对象/勋章/附件皆有值时才启用。'))
a(fig('后台-发放记录-认可详情.png', '发放记录-详情模块-同事认可详情', '同事认可：理由字段为「认可理由」；有附件时 Descriptions 增加「附件」下载链（RecognitionMaterials，download=文件名）。已发放底栏关闭+撤回认可。'))
a(fig('后台-发放记录-详情附件.png', '发放记录-详情模块-附件行', 'RK20260826004 附件「现场照片.jpg」，aria-label「下载 现场照片.jpg」。不渲染图片缩略，仅链接。'))
a(fig('后台-发放记录-表彰详情.png', '发放记录-详情模块-公司表彰详情', '公司表彰：理由字段为「表彰理由」；附件可多条（客户感谢信.png、交付确认函.pdf）。处理线：发布公司表彰 → 授权管理员直接发放 → 积分已发放。'))
a(fig('后台-发放记录-撤回确认.png', '发放记录-列表模块-撤回确认', '「确认撤回该发放？将扣回对象已入账积分，并保留发放日志。」确认撤回 danger。'))
a('<h4>字段说明</h4>')
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['认可编号', '发放记录-查询模块-认可编号', 'Input', '否', '空', 'trim 包含匹配', '—', '记录 id'],
        ['认可对象', '发放记录-查询模块-认可对象', 'Input', '否', '空', '姓名或工号包含', '—', 'receiver'],
        ['发起人', '发放记录-查询模块-发起人', 'Input', '否', '空', '包含', '—', 'giver；公司表彰为「系统」'],
        ['认可类型', '发放记录-查询模块-认可类型', 'Select', '否', '全部', '—', '全部/同事认可/公司表彰', 'type'],
        ['所属部门', '发放记录-查询模块-所属部门', 'TreeSelect', '否', '空', '康尼集团不过滤', 'ORG_TREE', 'department includes'],
        ['发起时间', '发放记录-查询模块-发起时间', 'RangePicker', '否', '空', '日界', '—', 'time inRange'],
        ['状态', '发放记录-查询模块-状态', 'Select', '否', '全部', '用 displayRecognitionStatus', '已发放/待审核/已驳回/已撤回', '展示态'],
        ['异常标识', '发放记录-查询模块-异常标识', 'Select', '否', '全部', 'recognitionMatchesRiskFlag', '全部/异常/正常', '仅统计已开启规则的 hits'],
        ['表彰对象', '发放记录-表彰模块-表彰对象', 'TreeSelect 多选', '是', '[]', '至少 1 人', 'INCENTIVE_PEOPLE_TREE', '每人一条'],
        ['公司勋章', '发放记录-表彰模块-公司勋章', 'Select', '是', '空', 'required', '归属=公司表彰的徽章', 'badgeId'],
        ['表彰月份', '发放记录-表彰模块-表彰月份', 'MonthPicker', '是', '当天月份', 'required', '—', '页面字段；issueCommendation 是否写入 {todo}'],
        ['表彰事由', '发放记录-表彰模块-表彰事由', 'TextArea', '是', '空', '≥ minimumReasonLength', 'placeholder 来自填写设置', 'description'],
        ['证明材料', '发放记录-表彰模块-证明材料', 'Upload.Dragger', '是', '[]', '1～5；单文件 ≤20MB；jpg/png/pdf/doc/xls', '—', '提交时 proofFilesToAttachments 转 DataURL，kind 按扩展名 image|file'],
        ['发布范围', '发放记录-表彰模块-发布范围', 'Radio', '否', 'all', 'org 时 orgIds 必填', '全员可见/指定部门', 'C 端可见 {todo} 未接'],
        ['审核意见', '发放记录-驳回模块-审核意见', 'TextArea', '驳回时是', '空', 'trim 非空否则 warning', '—', '写入处理记录'],
        ['认可理由/表彰理由', '发放记录-详情模块-理由', '文本', '否', 'record.description', 'recognitionReasonLabel(type)', '同事认可→认可理由；公司表彰→表彰理由', '详情展示；列表共用一列标题'],
        ['附件', '发放记录-详情模块-附件', '下载链接列表', '有 attachments 才显示', '种子记录含证明文件', '空则整行不渲染', 'name/url/kind', '点击 a[download] 本地下载 DataURL'],
    ],
))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['查询/重置', '发放记录-查询模块-查询', '查询/重置', '无', '始终', '点击', '写入/清空 query', '表格过滤', '无', '无', '前端 filter'],
        ['导出', '发放记录-工具栏-导出', '导出', '无', '始终', '点击', 'message.success', '无文件', '已导出发放记录', '无', '无 blob'],
        ['发布公司表彰', '发放记录-工具栏-发布公司表彰', 'primary', '无', '始终可开抽屉；确认发放需人+勋章+附件', '填表提交', 'issueCommendation 含 attachments', '关抽屉刷新表', '已生成 N 条公司表彰记录', '字数/对象/勋章/附件 warning；转码失败则请上传证明材料', '内存'],
        ['下载附件', '发放记录-详情模块-附件链接', '文件名 a', 'record.attachments 非空', '始终', '点击', '浏览器 download', '无状态变', '无 toast', 'url 空则提交时已跳过该文件', '无 HTTP'],
        ['审核', '发放记录-列表模块-审核', '审核', '展示态待审核且 canReview', '非审核员仍可能点到，warning', '点击=开详情', '同详情', '开抽屉', '无', '当前账号不是审核员', '内存'],
        ['通过并发放', '发放记录-详情模块-通过并发放', 'primary', '待审核且可审', '显示 showPendingReview', '二次确认', 'approveRecognition', '已发放，关抽屉', '已通过并发放', '取消', '内存'],
        ['驳回', '发放记录-详情模块-驳回', 'danger', '同上', '同上', '开 Modal 填意见', 'rejectRecognition', '已驳回', '已驳回', '驳回须填写审核意见', '内存'],
        ['撤回', '发放记录-列表模块-撤回', 'danger 撤回', '展示态已发放', '始终对该态', '确认', 'withdrawRecognition', '已撤回', '已撤回', '取消', '内存'],
    ],
))
a('</article>')

a('<article id="admin-settings"><h3>7.5 规则设置</h3>')
a(fig('后台-规则设置-积分设置.png', '规则设置-积分模块-额度列表', 'Tab 积分设置。月份选择器目前只进 draft，过滤实际只按关键词（月份未参与 filter）{todo}。'))
a(fig('后台-规则设置-查询筛选.png', '规则设置-积分模块-查询筛选', '统计月份 DatePicker month allowClear=false 默认 2026-08；关键词对象名称。'))
a(fig('后台-规则设置-额度表格.png', '规则设置-积分模块-额度表格', '对象、人数、单人月度积分额度、月度积分总额度、已用额度 Progress、调整额度。可勾选，未选时批量调整禁用。'))
a(fig('后台-规则设置-新增额度弹窗.png', '规则设置-积分模块-新增弹窗', '对象 TreeSelect（组织或人）、单人月度积分额度必填、原因选填。重复对象 error「该对象已存在额度，请直接调整」。'))
a(fig('后台-规则设置-填写设置.png', '规则设置-填写模块-表单', '最少字数 InputNumber min=1；输入框填写提示 TextArea；保存写 settings。副文案：同事认可原因与公司表彰事由共用。'))
a(fig('后台-规则设置-风控设置.png', '规则设置-风控模块-整页 Tab', '审核设置 + 异常监控设置。'))
a(fig('后台-规则设置-审核设置.png', '规则设置-风控模块-审核设置', '同事认可审核 Switch 默认开；审核员 TreeSelect 默认陈佳。关审核二次确认「关闭后新提交的同事认可将直接发放」。开且审核员空 warning。'))
a(fig('后台-规则设置-异常监控.png', '规则设置-风控模块-异常监控设置', '文案：仅提醒不禁止。三项 Switch+阈值：相似度默认 85%；频率 3 次/30天；互认 3 次/30天。改开关立即 setIncentiveSettings。'))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['保存填写', '规则设置-填写模块-保存', '保存', 'minLength≥1', '始终', '点击', 'setIncentiveSettings', '内存设置更新', '已保存填写设置', '最少字数须大于等于 1', '无 HTTP'],
        ['批量调整', '规则设置-积分模块-批量调整', '批量调整', '已勾选', '无勾选禁用；点时若未选 warning', '填统一额度', 'applyQuotaBudgetsByKeys', '清空勾选', '已批量调整 N 条', '请先勾选要调整的对象', '内存'],
        ['调整额度', '规则设置-积分模块-调整额度', '行操作', '有行', '始终', '弹窗对象 disabled', 'updateQuota', '预算更新', '已调整额度', '校验失败', '内存'],
        ['切换风控规则', '规则设置-风控模块-异常监控', 'Switch', '无', '始终', '切换', '立即写入 rules', '详情异常标识随之变', '无 toast', '无', '内存'],
    ],
))
a('</article></section>')

# ---- H5 ----
a('<section id="page-h5"><h2>8. H5 页面需求</h2>')
a('<article><h3>8.1 首页</h3>')
a(fig('H5-首页-页面整体.png', 'H5首页-页面-整体布局', '热门勋章 Top3 + 累计获得数 + 查看全部；认可动态 Feed；底栏；右下 FAB。'))
a(fig('H5-首页-热门勋章.png', 'H5首页-热门模块-热门勋章', 'hotBadges(本年,同事认可) 前 3，无类型/分类筛。点勋章 goH5Incentive(ranking, badgeId)。'))
a(fig('H5-首页-认可动态.png', 'H5首页-动态模块-认可动态', 'status=已发放 的记录卡片。点卡片/接收人进 person 墙。空态「暂无认可动态」。'))
a(fig('H5-首页-底栏导航.png', 'H5首页-导航模块-底栏', '首页/消息/个人中心。消息未读 class has-unread。仅 home/messages/profile 显示底栏。'))
a(fig('H5-首页-发放FAB.png', 'H5首页-发放模块-悬浮按钮', '仅 home 显示；aria 发放勋章；进 issue。'))
a('</article>')

a('<article><h3>8.2 发放勋章</h3>')
a(fig('H5-发放勋章-选勋章.png', 'H5发放勋章-选勋章模块-分类列表', '仅同事认可勋章按 category 分组。'))
a(fig('H5-发放勋章-月度额度.png', 'H5发放勋章-额度模块-本月可发放', '硬编码：可发放 150、额度 200、已发放 50。'))
a(fig('H5-发放勋章-勋章详情抽屉.png', 'H5发放勋章-详情模块-勋章详情', '定义/积分；底「发放勋章」进入填写步。'))
a(fig('H5-发放勋章-填写表单.png', 'H5发放勋章-填写模块-表单', '已选勋章、认可对象、原因（字数+认可规则）、附件必填。'))
a(fig('H5-发放勋章-认可对象.png', 'H5发放勋章-填写模块-认可对象', '可多选；空态「请选择认可对象」；有值显示姓名顿号与人数。'))
a(fig('H5-发放勋章-对象选择树.png', 'H5发放勋章-对象模块-组织树', '底部 Drawer。仅可选 E 开头员工节点。确认选择（N）无选人禁用。'))
a(fig('H5-发放勋章-确认发放.png', 'H5发放勋章-底栏模块-确认发放', '校验：勋章、≥1 人、原因字数、≥1 附件、cost≤150。成功 toast 已提交 N 条并重置 step=0。'))
a('<h4>操作说明</h4>')
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['选勋章', 'H5发放勋章-选勋章模块-勋章卡片', '勋章按钮', 'step=0', '始终', '点击', 'setBadge+step=1', '进表单', '无', '无', '本地 state'],
        ['确认发放', 'H5发放勋章-底栏模块-确认发放', '确认发放', 'step>0', '始终可点，内部校验', '点击', 'message；不写 incentiveStore', '重置表单', '已提交 N 条认可记录', '缺勋章/人/字数/附件/额度不足 warning', '无后台接口'],
        ['查看规则', 'H5发放勋章-填写模块-认可规则', '认可规则 link', '已选勋章', '始终', '点击', '底部 Drawer BadgeRules', '开规则', '无', '无', '本地'],
    ],
))
a('</article>')

a('<article><h3>8.3 热门勋章 / 个人勋章墙</h3>')
a(fig('H5-热门勋章-页面整体.png', 'H5热门勋章-页面-整体布局', '筛选条 + 勋章条 + 获得名单。数据 badgesByType(period, 全部类型)，默认 period=近一个月、scopeFilter=全部、category=全部。'))
a(fig('H5-热门勋章-筛选条.png', 'H5热门勋章-筛选模块-类型分类时间', '类型 role=group：全部/公司表彰/同事认可（aria-pressed）。右侧时间 Dropdown「近一个月」可选三个月/半年。下一行分类横向滚动，随类型变化。改类型若当前分类不属于新类型则回到全部，并 focus 第一条勋章改 hash。'))
a(fig('H5-热门勋章-勋章条.png', 'H5热门勋章-勋章模块-Tab 条', '仅展示当前筛选 visible 列表。点勋章更新 selected 并改 hash ranking/{id}。'))
a(fig('H5-热门勋章-获得名单.png', 'H5热门勋章-名单模块-获得员工', 'recipientsFor(badge.scope, period, month, name)。同事认可点行进个人墙。'))
a(fig('H5-热门勋章-公司表彰.png', 'H5热门勋章-筛选模块-公司表彰', '切到公司表彰后分类变为竞赛与评比成果等；名单点人进光荣事迹。'))
a(fig('H5-公司表彰-光荣事迹.png', 'H5光荣事迹-页面-公司表彰故事', 'MobileBackbar 标题公司表彰；肖像+勋章；光荣事迹与勋章说明。'))
a(fig('H5-热门勋章-指定勋章.png', 'H5热门勋章-勋章模块-指定 P02', 'hash ranking/P02 预选「问题解决与闭环」（仍受当前筛选是否包含该勋章影响）。'))
a(fig('H5-个人勋章墙-页面整体.png', 'H5个人勋章墙-页面-整体布局', 'person/E001 林晓云。按月分组获奖记录。'))
a(fig('H5-个人勋章墙-页头.png', 'H5个人勋章墙-页头模块-身份与统计', '个人荣誉档案、部门、勋章数、累计积分。'))
a('</article>')

a('<article><h3>8.4 个人中心 / 消息 / 获得页</h3>')
a(fig('H5-个人中心-页面整体.png', 'H5个人中心-页面-整体布局', '类型 Tab 默认同事认可；已获得轮播+获得于日期；分类网格，未获得 is-locked。'))
a(fig('H5-个人中心-类型Tab.png', 'H5个人中心-类型模块-公司表彰同事认可', '切换重置 picked 与折叠。'))
a(fig('H5-个人中心-勋章轮播.png', 'H5个人中心-轮播模块-已获得', '点当前张开详情；滑动切 picked。'))
a(fig('H5-个人中心-勋章详情.png', 'H5个人中心-详情模块-勋章详情抽屉', 'title 勋章详情；含获得时间。'))
a(fig('H5-消息-页面整体.png', 'H5消息-会话模块-即时激励助手', '官方 Tag。模拟今天 09:32 一条勋章通知。无底栏 FAB。'))
a(fig('H5-消息-勋章卡片.png', 'H5消息-会话模块-勋章卡片', '未读文案「你收到一枚新勋章」；点开 award 且 viewed=true，红点消失。'))
a(fig('H5-勋章详情-获得页.png', 'H5获得页-庆典模块-勋章详情', 'kicker 已获得勋章或恭喜你获得新勋章（isNew）；分享按钮无 onClick 业务。{todo}'))
a('</article></section>')

# ---- PC ----
a('<section id="page-pc"><h2>9. PC 页面需求</h2>')
a('<p>与 H5 共用屏幕组件，差异：PcActivityShell 顶栏导航；右侧 IncentivePcAside 常驻；发放详情/规则/选人为 Modal 而非全屏 Drawer；首页热门横向滚动且无「查看全部」，但 PC 首页热门有类型 Tabs + 分类 Tabs + 时间 Dropdown；个人中心为统计头+类型 Tab+分类网格（无 H5 轮播）。H5IncentiveApp 仍向 Ranking 传入无用 prop <code>scope=同事认可</code>，筛选状态在组件内，该 prop 不生效。</p>')
a(fig('PC-首页-页面整体.png', 'PC首页-页面-双栏布局', '主栏热门（含筛选）+动态；右栏与我相关。'))
a(fig('PC-首页-顶栏导航.png', 'PC首页-导航模块-顶栏', '首页/消息（未读红点）/个人中心。award 时消息高亮。'))
a(fig('PC-首页-热门勋章.png', 'PC首页-热门模块-热门勋章', 'badgesByType(当前 period, 全部类型) 后按类型/分类过滤，横向 is-scroll。'))
a(fig('PC-首页-热门筛选.png', 'PC首页-热门模块-筛选', '类型 tablist 全部/公司表彰/同事认可；时间「近一个月」下拉；分类 tablist 随类型变。H5 首页无此块。'))
a(fig('PC-首页-侧栏与我相关.png', 'PC首页-侧栏模块-与我相关', '姓名部门、勋章数、可用积分 150、本月已发 50、最近获得最多 3 条。空预览时积分/已发为 0。'))
a(fig('PC-首页-发放按钮.png', 'PC首页-侧栏模块-发放勋章', 'block primary，进 issue。H5 无此侧栏按钮。'))
a(fig('PC-发放勋章-页面整体.png', 'PC发放勋章-页面-主栏表单', '同 H5 两步，弹层为 Modal。'))
a(fig('PC-热门勋章-页面整体.png', 'PC热门勋章-页面-整体布局', '筛选 Tabs + 勋章条横向滚到 active。'))
a(fig('PC-热门勋章-筛选条.png', 'PC热门勋章-筛选模块-类型分类时间', '类型/分类为 tablist；时间 PeriodMenu。切筛时若当前勋章不在结果内，选第一条并改 hash。'))
a(fig('PC-个人中心-页面整体.png', 'PC个人中心-页面-勋章收藏', '我的勋章 + 分类下已获得/总数。'))
a(fig('PC-个人中心-统计头.png', 'PC个人中心-页头模块-统计', '勋章枚数与累计积分（次数×单枚积分）。'))
a(fig('PC-消息-页面整体.png', 'PC消息-会话模块-助手', '主栏会话，右栏仍在。'))
a(fig('PC-个人勋章墙-页面整体.png', 'PC个人勋章墙-页面-整体布局', 'PC 英雄区右侧直接展示勋章/积分 dl。'))
a(fig('PC-勋章详情-获得页.png', 'PC获得页-庆典模块-勋章详情', '与 H5 同组件，套在 PC 双栏内。'))
a('</section>')

a('<section id="data-fields"><h2>10. 数据字段与枚举</h2>')
a(table(
    ['实体', '字段', '取值/说明'],
    [
        ['BadgeScope', 'id/name/sort', '种子：company 公司表彰、peer 同事认可'],
        ['BadgeCategory', 'scopeId/name/sort', '卓越贡献/创新突破；团队协作/主动担当'],
        ['Badge', 'points/orgIds/enabled/definition/criteria/examples/exclusions/riskLabel', 'riskLabel 直接发放|低风险'],
        ['Recognition.status', '已发放|待审核|已驳回|已撤回', 'displayRecognitionStatus 可随审核开关改展示'],
        ['Recognition.type', '同事认可|公司表彰', '表彰 giver=系统'],
        ['RiskHit.rule', 'duplicate|frequency|mutual', '标签：认可原因重复 / 频率异常 / 双方互认频繁'],
        ['QuotaRow.objectType', '组织|个人', '个人 employees=1'],
        ['Recognition.attachments', 'name/url/kind', 'kind=image|file（按扩展名）；种子含 png/jpg/pdf/xls DataURL'],
        ['recognitionReasonLabel', '公司表彰→表彰理由；否则认可理由', '列表合成列名「表彰理由 / 认可理由」'],
        ['RankingPeriod', '近一个月|三个月|半年', 'rankingWindow 1/3/6 月，放大人次 mock'],
        ['RankingScope', '全部|公司表彰|同事认可', 'H5 排行/PC 首页热门/PC 排行'],
    ],
))
a('</section>')

a('<section id="apis"><h2>11. API / 数据接口清单</h2>')
a('<p>源码 incentive 与 C 端目录无 fetch/axios/XHR。全部内存 store / 常量。</p>')
a(table(
    ['接口用途', '方法', '路径', '触发场景', '请求参数', '响应字段', '是否真实接口', '备注'],
    [
        ['—', '—', '—', '—', '—', '—', '否', '无真实接口'],
    ],
))
a('<p>建议接口 / 待确认：勋章 CRUD；归属分类；发放查询分页导出；审核通过/驳回/撤回；公司表彰提交（含附件对象存储）；额度 CRUD；规则读取；C 端热门/动态/提交认可/消息已读；排行筛选条件；积分账本与额度扣减事务。</p></section>')

a('<section id="non-functional"><h2>12. 非功能需求</h2>')
a('<ul>')
a('<li>后台表格分页、pageSizeOptions、行选择保留遵循 b2bStandards.table。{impl}</li>')
a('<li>表单 unsavedChangesGuard：勋章新建/编辑 dirty 离开确认。{impl}</li>')
a('<li>H5 视口按 390 宽演示；PC 1440。响应式断点以 CSS 为准。{impl}</li>')
a('<li>附件仅前端拦截体积与数量，无病毒扫描/对象存储。{todo}</li>')
a('<li>审计：处理时间线在详情展示，无独立审计日志表。{todo}</li>')
a('<li>无障碍：部分按钮有 aria-label（发放 FAB、排序、对象树）。分享无实现。{todo}</li>')
a('</ul></section>')

a('<section id="analytics"><h2>13. 埋点与指标建议</h2>')
a(f'<p>{guess} 代码无埋点 SDK。</p>')
a(table(
    ['事件名称', '触发动作', '关键属性', '业务目的'],
    [
        ['incentive_issue_click', '点 FAB / PC 发放勋章', 'surface', '发放入口转化'],
        ['incentive_issue_submit', '确认发放', 'badge_id,target_count,cost,success', '提交成功率'],
        ['incentive_review_approve', '通过并发放', 'record_id', '审核时效'],
        ['incentive_review_reject', '确认驳回', 'record_id', '驳回率'],
        ['incentive_commend_submit', '公司表彰确认发放', 'people_count,badge_id', '表彰规模'],
        ['incentive_ranking_filter', '改类型/分类/时间', 'scope,category,period,surface', '排行筛选使用'],
        ['incentive_message_open', '点勋章卡片', 'is_new', '通知打开率'],
    ],
))
a('</section>')

a('<section id="acceptance"><h2>14. 验收标准</h2>')
a('<ul>')
a('<li>Given 打开 #/incentive/incentive-dashboard，When 默认周期覆盖 8 月底 mock，Then KPI/待办/近期表有数，点待审核编号打开认可详情。</li>')
a('<li>Given 勋章管理，When 删除仍被占用的归属，Then warning 且不删；When 空归属删到只剩 1 个，Then 「至少保留一个归属」。</li>')
a('<li>Given 新建勋章同归属重名，When 保存，Then 「同一归属下勋章名称不能重复」。</li>')
a('<li>Given 描述缺四段标题，When 保存，Then 「请按四个分类标题完整填写描述」。</li>')
a('<li>Given 审核员陈佳且审核开启，When 待审核点通过并发放确认，Then toast 已通过并发放且状态已发放。</li>')
a('<li>Given 驳回不填意见，When 确认驳回，Then warning 驳回须填写审核意见。</li>')
a('<li>Given 发布表彰不传附件，When 确认发放，Then 按钮保持禁用或 warning 请上传证明材料。</li>')
a('<li>Given H5 发放 cost&gt;150，When 确认发放，Then 额度不足 warning。</li>')
a('<li>Given 发放记录列表，When 查看可见表头，Then 积分与状态相邻；DOM 仍有「表彰理由 / 认可理由」。When 打开详情，Then 同事认可显示认可理由、公司表彰显示表彰理由。</li>')
a('<li>Given 打开 RK20260826004 详情，When 查看字段，Then label 为认可理由且附件可下载现场照片.jpg；打开 RK20260826003 则为表彰理由及多附件。</li>')
a('<li>Given 发布表彰上传文件后确认，When 再开该条详情，Then attachments 出现对应文件名。</li>')
a('<li>Given H5 热门勋章，When 点公司表彰，Then 分类变为公司表彰分类且点获得人进入光荣事迹。</li>')
a('<li>Given H5 首页，When 点查看全部，Then 进入热门勋章且可见类型「全部 / 公司表彰 / 同事认可」与时间「近一个月」。</li>')
a('<li>Given PC 首页热门，When 切换类型或分类，Then 勋章条过滤；时间下拉含近一个月/三个月/半年。</li>')
a('<li>Given 消息未读，When 进入 award 返回，Then 消息 Tab 无 has-unread。</li>')
a('<li>Given PC 首页，When 查看侧栏最近获得，Then 最多 3 条，无「查看全部」文案。</li>')
a('</ul></section>')

a('<section id="risks"><h2>15. 风险与待确认问题</h2>')
a('<ol>')
a('<li>C 端提交认可不写入后台 recognitions，双端数据断裂。生产必须统一账本。</li>')
a('<li>C 端额度 200/50/150 写死，与规则设置配额表、扣减未打通。</li>')
a('<li>热门排行已可筛公司表彰并进光荣事迹；H5 首页热门仍只展示同事认可本年 Top3，与排行默认「全部 + 近一个月」口径不一致。</li>')
a('<li>规则设置「统计月份」不参与额度过滤。</li>')
a('<li>发放记录理由列无 width，1440/1920 下计算宽度 0，列表看不到理由文本。详情抽屉可见。是否给该列 minWidth 待确认。</li>')
a('<li>适用组织、表彰发布范围未作用于 C 端可见性。</li>')
a('<li>后台演示账号「陈产品」与审核员「陈佳」、C 端「林晓云」三人身份不一致，评审时易误解权限。</li>')
a('<li>无登录、无集团/单位管理员、无真实积分账本与消息推送。</li>')
a('<li>风控只展示不拦截，是否生产保持「仅提醒」需业务拍板。</li>')
a('<li>获得页分享、空预览开关（useCEndEmptyPreview）与门户联调范围 {todo}。</li>')
a('</ol></section>')

html_body = '\n'.join(body)
g.write_prd('incentive-app', '即时激励-PRD.html', '即时激励应用 产品需求文档', TOC, html_body)
