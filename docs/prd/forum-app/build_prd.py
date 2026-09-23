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
    ('ia', '3. 页面结构 / 信息架构'),
    ('implemented-features', '4. 已实现功能清单'),
    ('flows', '5. 用户流程'),
    ('page-requirements', '6. 页面级需求说明'),
    ('page-admin', '6.A 后台'),
    ('page-h5', '6.B H5'),
    ('page-pc', '6.C PC'),
    ('data-fields', '7. 数据字段与枚举'),
    ('apis', '8. API / 数据接口清单'),
    ('non-functional', '9. 非功能需求'),
    ('analytics', '10. 埋点与指标建议'),
    ('acceptance', '11. 验收标准'),
    ('risks', '12. 风险与待确认问题'),
]

body: list[str] = []
a = body.append

a('<section id="doc-note"><h2>1. 文档说明</h2><ul>')
a('<li>文档来源：基于康尼论坛应用 React/TypeScript 原型反向分析（html-to-prd）。截图为 2026-09-21 起本地 <code>http://127.0.0.1:5173/</code> 实机渲染；匿名相关图为 2026-09-22 补拍。</li>')
a('<li>分析范围：管理后台 <code>#/forum/*</code>；员工 H5 <code>#/c/h5/forum*</code>；员工 PC <code>#/c/pc/forum*</code>。信箱应用（mailbox）与论坛共用部分页面组件，本文只写论坛 kind=<code>forum</code> 路径。</li>')
a('<li>生成日期：2026-09-21；对照增量日期：2026-09-22</li>')
a('<li>本次对照增量：① C 端匿名展示改为 <code>【匿名用户】</code>+四位序号（同帖同作者稳定、尽量不撞号）；当前登录周敏看自己的匿名显示「我」，头像「我」/他人「匿」。② 允许匿名的板块：发帖勾「匿名发帖」，评论勾「匿名」（aria 匿名评论）。③ 种子「闲置27英寸显示器转让」及该帖评/回均为匿名。④ 后台发帖人仍 <code>匿名（真名）</code>。⑤ 论坛列表仍保留批量停用（信箱列表当日已去掉，不在本文）。</li>')
a('<li>可信度：按钮文案、校验、内存 store 行为以代码为准。无 HTTP。刷新页面会丢运行时改动。</li>')
a(f'<li>标记：{impl} {guess} {todo}</li>')
a('<li>组件一律使用 <code>页面-模块-组件名称</code>。</li></ul></section>')

a('<section id="overview"><h2>2. 产品概述</h2>')
a('<p><strong>产品定位：</strong>康尼「员工与组织」下的企业论坛：后台配置板块/标签/禁言并运营帖子；员工在 H5/PC 浏览、发帖、评论、点赞收藏。</p>')
a('<p><strong>目标用户：</strong>后台运营（演示顶栏账号语义为「陈产品」）；C 端员工（写操作用户写死为 <code>forumClientSelf = 周敏</code>）。</p>')
a('<p><strong>核心使用场景：</strong>① 运营新建「二手论坛」等板块并配图标/背景/可见范围/标签；② 员工进板块发帖、按标签筛、搜帖；③ 运营置顶/下架/指派回复人/禁言；④ 员工在帖内评论点赞，自己的帖可编辑删除。</p>')
a('<p><strong>页面/系统主要价值：</strong>把公司内部闲置转让、建议讨论从群聊收口到可运营的板块；C 端与后台共用 <code>forumStore</code>，停用板块、下架/驳回帖、禁言会立刻影响 H5 可见与发评。</p>')
a(fig('C端预览-入口页.png', 'C端预览-入口页-论坛入口', '门户卡片「论坛 H5 / 论坛 PC / 我的帖子 H5」跳到板块 id=1 与我的帖子。PC 无独立「我的帖子」门户卡片，但路由 <code>#/c/pc/forum-mine</code> 代码已实现。'))
a('</section>')

a('<section id="ia"><h2>3. 页面结构 / 信息架构</h2>')
a(fig('论坛应用-左侧菜单.png', '后台-框架-左侧菜单', '菜单：概览、论坛列表、标签管理、禁言管理。默认页 forum-overview。新建/编辑/详情/帖子详情侧栏仍高亮论坛列表。'))
a(table(
    ['端', '页面', 'Hash', '组件'],
    [
        ['后台', '概览', '#/forum/forum-overview', 'ForumOverviewPage'],
        ['后台', '论坛列表', '#/forum/forum-list', 'ForumBoardListPage kind=forum'],
        ['后台', '新建论坛', '#/forum/forum-create', 'ForumBoardFormPage create'],
        ['后台', '编辑论坛', '#/forum/forum-edit/{id}', 'ForumBoardFormPage edit'],
        ['后台', '论坛详情', '#/forum/forum-detail/{id}', 'ForumBoardDetailPage + 内嵌帖子表'],
        ['后台', '帖子详情', '#/forum/topic-detail/{id}', 'ForumTopicDetailPage kind=forum'],
        ['后台', '标签管理', '#/forum/forum-tags', 'ForumTagListPage'],
        ['后台', '禁言管理', '#/forum/forum-risk', 'ForumRiskPage'],
        ['H5', '板块', '#/c/h5/forum 或 /forum/{id}', 'H5ForumBoard，缺 id 默认 1'],
        ['H5', '帖子', '#/c/h5/forum-topic/{id}', 'H5ForumTopic'],
        ['H5', '我的帖子', '#/c/h5/forum-mine', 'H5ForumMine'],
        ['PC', '板块', '#/c/pc/forum/{id}', 'PcForumBoard'],
        ['PC', '帖子', '#/c/pc/forum-topic/{id}', 'PcForumTopic'],
        ['PC', '我的帖子', '#/c/pc/forum-mine', 'PcForumMine'],
    ],
))
a('<p>跳转：列表名称/详情 → 详情；帖子标题 → topic-detail；C 端帖卡片 href 进帖子；H5 帖子顶栏返回板块 hash；停用/不存在板块 H5 文案「论坛不存在或已停用」；不可见帖「帖子不存在」。</p>')
a('<p>种子数据：论坛板 二手论坛(id=1,允许匿名)、建议论坛(id=2)。「闲置27英寸显示器转让」(id=4) 发帖人唐宇但 authorAnonymous=true。标签闲置转让/求购等。C 端默认打开 id=1。</p>')
a('</section>')

a('<section id="implemented-features"><h2>4. 已实现功能清单</h2>')
a(table(
    ['模块', '功能点', '功能说明', '页面/区域', '状态'],
    [
        ['板块配置', '新建/编辑', '图标必填(仅新建)、背景图必填(仅新建)、名称、简介、可见范围、管理员、帖子标签、允许匿名', '后台-新建/编辑论坛', impl],
        ['板块配置', '启停', '确认后 setForumBoardStatus；停用后 H5/PC 板页当不存在', '后台-论坛列表/详情', impl],
        ['板块配置', '查看链接', '弹窗展示 currentForumBoardClientUrl（本机 origin + #/c/h5/forum/{id}），复制 clipboard', '后台-论坛列表/详情', impl],
        ['帖子运营', '列表/详情', '内嵌于论坛详情；置顶 pinScope=board；下架 shelfStatus=off；指派回复人', '后台-论坛详情-帖子表', impl],
        ['帖子运营', '回复', '马甲账号：陈产品（个人）/论坛小助手/官方客服；主评分页 10 条', '后台-帖子详情', impl],
        ['标签', 'CRUD/排序/启停', '名称≤20、重名校验；禁用后发帖不可再选；删标签从帖子移除', '后台-标签管理', impl],
        ['风控', '禁言', '添加立即生效；重复禁言报「该成员已处于禁言中」；周敏发主评时拦「你已被禁言」', '后台-禁言管理 + C 端发评', impl],
        ['C 端发现', '板块浏览', '头图、简介展开、搜索、标签 Tab、最新回复/最新发布、帖卡片', 'H5/PC-板块页', impl],
        ['C 端生产', '发帖/改删', '标题必填；图最多 9；标签单选可选；匿名仅板块 anonymous 且新建', 'H5/PC 发布浮层', impl],
        ['C 端匿名', '匿名展示与发评', '他人【匿名用户】+4 位序号；自己显示「我」；评/回可勾匿名（板允许时）', 'H5/PC 列表+详情', impl],
        ['C 端互动', '赞藏评', '帖赞/藏、评论赞、回复；自己的评/帖可删', 'H5/PC-帖子详情', impl],
        ['可见性', '下架/审核', 'C 端 isClientForumTopicVisible：shelf≠off 且 audit 非待审核/已驳回', 'forumStore + clientForum', impl],
        ['可见范围', 'C 端按人过滤', '后台存 visibility，C 端板页只看 kind=forum 且 status=enabled，不读当前员工部门', 'H5/PC-板块页', f'{todo} 代码未按人过滤'],
    ],
))
a('</section>')

a('<section id="flows"><h2>5. 用户流程</h2>')
a('<h3>5.1 运营建板</h3><p>后台-论坛列表-新建论坛 → 填图标/背景/名称/简介/可见范围/管理员 → 创建。成功 toast「已创建论坛」回列表。脏数据点取消弹「离开当前页？」。重名 saveForumBoard 失败，错误打在名称。</p>')
a('<h3>5.2 员工发帖</h3><p>H5 底栏「立即发布」或 PC 侧栏同文案 → 浮层填标题内容图标签；板允许匿名且非编辑时勾「匿名发帖」→ 提交。publishClientTopic 标题空则 toast「请填写标题」，成功「发布成功」。内容可空。作者仍写 forumClientSelf，展示走 authorAnonymous。</p>')
a('<h3>5.2.1 匿名阅读</h3><p>C 端 forumActorName：非匿名=真名；匿名且作者=周敏→「我」；其他匿名→【匿名用户】+ forumAnonSerial(topicId, author) 四位（1000–9999，同帖撞号则 +1 环绕）。后台 topicAuthorAdminText 仍「匿名（真名）」。</p>')
a('<h3>5.3 下架联动</h3><p>后台帖子「下架」确认：下架后 C 端用户将无法看到。setTopicShelf off。H5 列表 visibleClientForumTopics 过滤；直链帖详情 hidden →「帖子不存在」。</p>')
a('<h3>5.4 禁言拦评</h3><p>禁言管理添加周敏 → 周敏在帖内发主评 addClientTopicComment 返回「你已被禁言」。楼层回复 addClientTopicReply、发帖 publishClientTopic 代码路径不查禁言表，{todo}</p>')
a('<h3>5.5 指派待回复</h3><p>后台指派周敏 → C 端该帖 clientNeedsReply 为真，列表加 is-need-reply，PC 侧栏「待你回复」。周敏留下评论或回复后横幅消失。</p>')
a('</section>')

a('<section id="page-requirements"><h2>6. 页面级需求说明</h2>')

a('<article id="page-admin"><h3>6.A 后台</h3>')

a(' <h4>6.A.1 概览</h4>')
a('<p>页面目标：看板块数、帖量、评量、生效禁言，以及帖子分布与最新帖。</p>')
a(fig('后台-概览-页面整体.png', '后台-概览-页面整体', '面包屑 论坛>概览；副标题「论坛运营数据总览与最新帖子」；日期范围筛 scoped 数据。'))
a(fig('后台-概览-KPI指标卡.png', '后台-概览-KPI指标卡', '四卡：论坛数、帖子数、评论数、生效禁言。点论坛数/帖子数 goToPage(forum-list)；点生效禁言 go forum-risk。评论数无跳转。'))
a(fig('后台-概览-日期筛选.png', '后台-概览-日期筛选', 'OverviewDateRange，默认 defaultForumOverviewDateRange。改范围重算 KPI/图/表。'))
a(fig('后台-概览-帖子论坛分布.png', '后台-概览-帖子论坛分布', '饼图 forumBoardSegments(boardCounts)。空数据走 OverviewPie 空态。'))
a(fig('后台-概览-互动热度分层.png', '后台-概览-互动热度分层', '饼图 forumHeatSegments(heatCounts)。'))
a(fig('后台-概览-最新帖子表.png', '后台-概览-最新帖子表', '列：标题(置顶 Tag)、论坛、发帖人、发布时间、操作「查看」→ topic-detail。无分页。空 Empty「暂无帖子」。'))
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['查看最新帖', '后台-概览-最新帖子表-查看', '链接按钮查看', '行存在', '始终可点', '点击', 'onNavigate topic-detail', '路由变', '打开帖详情', '无', '内存 getForumTopic'],
        ['点论坛数', '后台-概览-KPI指标卡-论坛数', 'KPI 卡', '无', '可点', '点击', '进论坛列表', '路由', '列表页', '无', '无筛参'],
    ],
))

a(' <h4>6.A.2 论坛列表</h4>')
a(fig('后台-论坛列表-页面整体.png', '后台-论坛列表-页面整体', '只列出 kind=forum（filterBoards）。种子 2 条。无名称/状态搜索面板。'))
a(fig('后台-论坛列表-工具栏.png', '后台-论坛列表-工具栏', '「共 N 条」；主按钮「新建论坛」。勾选启用行后出现「批量停用」。'))
a(fig('后台-论坛列表-列表表格.png', '后台-论坛列表-列表表格', '列：论坛名称(图标+链接)、可见范围、管理员、帖子标签、状态 Badge、创建时间、操作。分页 pageSize 来自 b2bStandards。'))
a(fig('后台-论坛列表-行操作.png', '后台-论坛列表-行操作', '可见三项：详情、查看链接、编辑。溢出「更多」含停用/启用。actionsMaxVisible=3。'))
a(fig('后台-论坛列表-查看链接弹窗.png', '后台-论坛列表-查看链接弹窗', '标题「查看链接」；只读 Input C 端 URL；「复制链接」成功 message「链接已复制」，失败「复制失败，请手动复制链接」；底栏「关闭」。'))
a(fig('后台-论坛列表-批量停用.png', '后台-论坛列表-批量停用', '行选择 checkbox。未选出启用记录点批量停用会 warning「请选择已启用的记录」。确认文案：停用后前台不可访问，历史数据保留。'))
a(table(
    ['列名', '组件路径', '数据含义', '格式', '是否可排序', '是否可筛选', '行操作'],
    [
        ['论坛名称', '后台-论坛列表-列表表格-论坛名称', 'board.name', '图标+链接', '否', '否', '进详情'],
        ['可见范围', '后台-论坛列表-列表表格-可见范围', 'organizationText', '全员/部门串/自定义人群：共N人/导入人群：文件', '否', '否', '—'],
        ['管理员', '后台-论坛列表-列表表格-管理员', 'manager 顿号拼接', '文本省略', '否', '否', '—'],
        ['帖子标签', '后台-论坛列表-列表表格-帖子标签', 'board.tags', 'Tag，空为 —', '否', '否', '—'],
        ['状态', '后台-论坛列表-列表表格-状态', 'enabled/disabled', '已启用/已停用 Badge', '否', '否', '停用/启用'],
        ['创建时间', '后台-论坛列表-列表表格-创建时间', 'createdAt', 'YYYY-MM-DD HH:mm', '否', '否', '—'],
    ],
))
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['新建论坛', '后台-论坛列表-工具栏-新建论坛', '主按钮', '无', '始终', '点击', 'go forum-create', '路由', '打开表单', '无', '无接口'],
        ['详情', '后台-论坛列表-行操作-详情', '链接/按钮', '记录存在', '始终', '点击', 'forum-detail/{id}', '路由', '详情页', '无', 'getForumBoard'],
        ['查看链接', '后台-论坛列表-行操作-查看链接', '按钮', '非信箱', '始终', '点击', '打开 ForumLinkModal', '弹窗', '可复制', 'clipboard 失败 toast', 'forumBoardClientUrl'],
        ['编辑', '后台-论坛列表-行操作-编辑', '按钮', '存在', '始终', '点击', 'forum-edit/{id}', '路由', '表单回填', 'id 无效 Empty「论坛不存在或已删除」', '无'],
        ['停用/启用', '后台-论坛列表-行操作-停用', '更多菜单', '有记录', '始终', '确认框确定', 'setForumBoardStatus', 'status 翻转', '已停用/已启用', '取消无变化', '内存'],
        ['批量停用', '后台-论坛列表-工具栏-批量停用', '危险按钮', '已选且含启用', '未选不出现', '确认停用', 'setForumBoardStatuses disabled', '清空勾选', '已停用 N 个论坛', '未选启用 warning', '内存'],
    ],
))

a(' <h4>6.A.3 新建/编辑论坛</h4>')
a(fig('后台-新建论坛-表单页.png', '后台-新建论坛-表单页', '标题「新建论坛」。编辑页同等字段，图标/背景新建 required，编辑可不改。'))
a(fig('后台-新建论坛-图标上传.png', '后台-新建论坛-图标上传', 'picture-card maxCount=1，accept 图片。新建 hidden icon required「请上传论坛图标」。hint SQUARE_IMAGE_UPLOAD_HINT。beforeUpload 返回 false，本地 FileReader DataURL。'))
a(fig('后台-新建论坛-背景图上传.png', '后台-新建论坛-背景图上传', '仅论坛（信箱无此字段）。新建必填「请上传背景图」。COVER_IMAGE_UPLOAD_HINT。'))
a(fig('后台-新建论坛-可见范围.png', '后台-新建论坛-可见范围', 'Radio：全员 / 按部门 / 自定义人群 / 导入人群。默认全员。'))
a(fig('后台-新建论坛-按部门.png', '后台-新建论坛-按部门', '切到按部门出现 TreeSelect 选择部门，必填「请选择部门」，orgDepartmentTree，SHOW_PARENT。'))
a(fig('后台-新建论坛-自定义人群.png', '后台-新建论坛-自定义人群', 'TreeSelect 人员，必填「请选择人员」，orgPeoplePickerTree，SHOW_CHILD。'))
a(fig('后台-新建论坛-导入人群.png', '后台-新建论坛-导入人群', 'csv/xlsx 一个文件；下载模板「可见人群导入模板.csv」列：工号,姓名,部门。未上传「请导入人群文件」。importedPeople 编辑时保留，新建路径代码未解析文件名单，{todo}。'))
a(fig('后台-新建论坛-底栏操作.png', '后台-新建论坛-底栏操作', 'sticky：创建/保存 + 取消。dirty 取消二次确认。'))
a(fig('后台-编辑论坛-表单页.png', '后台-编辑论坛-表单页', '回填二手论坛。保存 toast「已保存论坛」。改名 saveForumBoard 级联帖子 boardName（见 store）。'))
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['论坛图标', '后台-新建论坛-图标上传', 'Upload picture-card', '新建是/编辑否', '空', '请上传论坛图标', '本地图', 'C 端头像位'],
        ['背景图', '后台-新建论坛-背景图上传', 'Upload', '新建是', '空', '请上传背景图', '本地图', 'C 端头图'],
        ['论坛名称', '后台-新建论坛-论坛名称', 'Input maxWidth 360', '是', '空', '请输入论坛名称；重名错误', '自由文本', '板块名且帖子归属键'],
        ['论坛简介', '后台-新建论坛-论坛简介', 'TextArea 3 行', '是', '空', '请输入论坛简介', '自由文本', 'C 端可展开简介'],
        ['可见范围', '后台-新建论坛-可见范围', 'Radio.Group', '是', '全员', '请选择可见范围', '全员/按部门/自定义人群/导入人群', '后台展示；C 端未按此过滤'],
        ['管理员', '后台-新建论坛-管理员', 'TreeSelect 多选人员', '是', '空', '请选择管理员', 'forumPeoplePickerTree 仅人可选', 'C 端 PC 侧栏展示'],
        ['帖子标签', '后台-新建论坛-帖子标签', 'Select multiple', '否', '空', '仅启用中标签', 'enabledForumTagNames scope=forum', 'C 端 Tab 与发帖单选'],
        ['允许匿名', '后台-新建论坛-允许匿名', 'Switch', '否', 'false（论坛）；二手种子 true', '无', '开/关', '开则发帖「匿名发帖」、评论「匿名」'],
    ],
))
a(table(
    ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
    [
        ['后台-新建论坛-选择部门', 'TreeSelect', '隐藏', 'visibility===按部门', '始终可编', 'orgDepartmentTree', '切 Radio 显隐', '未选提交红字', '无角色'],
        ['后台-新建论坛-选择人员', 'TreeSelect', '隐藏', '自定义人群', '始终', 'orgPeoplePickerTree', '切 Radio', '请选择人员', '部门节点不可勾'],
        ['后台-新建论坛-导入人群', 'Upload', '隐藏', '导入人群', '始终', '本地文件名', '切 Radio', '请导入人群文件', '无解析校验'],
        ['后台-编辑论坛-记录不存在', 'Empty', '不显示', 'edit 且 getForumBoard 空', '返回按钮', '无', '—', '论坛不存在或已删除', '无'],
    ],
))

a(' <h4>6.A.4 论坛详情</h4>')
a(fig('后台-论坛详情-页面整体.png', '后台-论坛详情-页面整体', '上头信息卡 + 下方帖子表。id 无效 Empty + 返回论坛列表。'))
a(fig('后台-论坛详情-标题与操作.png', '后台-论坛详情-标题与操作', '图标、名称、状态 Badge；按钮查看链接、编辑、停用/启用。停用确认同列表。'))
a(fig('后台-论坛详情-基本信息.png', '后台-论坛详情-基本信息', 'Descriptions：背景图缩略、可见范围、管理员、匿名、帖子标签、创建时间、简介 span3。'))
a(fig('后台-论坛详情-帖子表.png', '后台-论坛详情-帖子表', 'embedded 列表无所属论坛列。列：帖子(置顶 Tag+标题链)、帖子内容、帖子标签、发帖人、评论数、发布时间、操作。空「暂无帖子」。pageSize 20。'))
a(fig('后台-论坛详情-指派回复人弹窗.png', '后台-论坛详情-指派回复人弹窗', '显示当前指派；TreeSelect 回复人 extra「按组织架构展开后勾选人员，不能选部门」。确定 setTopicAssignees，有人 toast「已指派回复人」，清空「已取消指派」。'))
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['置顶/取消置顶', '后台-论坛详情-帖子表-置顶', '更多菜单', '论坛帖', '始终', '确认', 'setTopicPin board 或空', 'pinScope；列表置顶 Tag；排序置顶优先', '已设为置顶/已取消置顶', '取消无变化', '内存'],
        ['下架/重新上架', '后台-论坛详情-帖子表-下架', '更多菜单危险', '论坛帖', '始终', '确认', 'setTopicShelf', 'off 则 C 端不可见', '已下架，C 端不可见 / 已重新上架', '取消无变化', '内存'],
        ['指派回复人', '后台-论坛详情-指派回复人弹窗', '行按钮', '论坛帖', '始终', '勾人选确定', 'setTopicAssignees', 'replyAssignees', '已指派/已取消指派', '无校验失败', '内存'],
    ],
))

a(' <h4>6.A.5 帖子详情</h4>')
a(fig('后台-帖子详情-页面整体.png', '后台-帖子详情-页面整体', '面包屑 论坛 > 板块名 > 帖子详情。种子帖「九成新人体工学椅转让，可自提」。'))
a(fig('后台-帖子详情-标题与操作.png', '后台-帖子详情-标题与操作', 'H1 标题；查看链接；下架(danger)/重新上架。'))
a(fig('后台-帖子详情-基本信息.png', '后台-帖子详情-基本信息', '标题、发帖人（匿名帖为「匿名（真名）」如匿名（唐宇））、发帖人部门、时间、所属论坛、帖子标签、点赞/收藏/评论/浏览数。C 端不展示真名。'))
a(fig('后台-帖子详情-内容与评论.png', '后台-帖子详情-内容与评论', '正文、图片 PreviewGroup 无图显示「暂无图片」；主评线程；置顶/回复；超过 10 条「加载更多」。'))
a(fig('后台-帖子详情-回复帖子表单.png', '后台-帖子详情-回复帖子表单', '点「回复帖子」展开 MomentInlineReplyForm。账号 forumCommentReplyAccountOptions。成功「已回复帖子」。内容校验 validateForumComment：空且无图「请输入回复内容」；≤200 字。'))
a(fig('后台-帖子详情-回复评论.png', '后台-帖子详情-回复评论', '点回复评论/回复楼层，表单锚到该层。成功「已回复评论」。addTopicReply。'))
a(fig('后台-帖子详情-查看链接弹窗.png', '后台-帖子详情-查看链接弹窗', 'URL 为 #/c/h5/forum-topic/{id}。'))
a('<p>置顶评论：确认框后 setTopicCommentPin。审核记录 Card 仅 auditHistory 有数据时出现（种子多数论坛帖无此卡）。</p>')

a(' <h4>6.A.6 标签管理</h4>')
a(fig('后台-标签管理-页面整体.png', '后台-标签管理-页面整体', '副标题：维护帖子标签，禁用后发帖不可再选。C 端按标签筛选。'))
a(fig('后台-标签管理-查询筛选.png', '后台-标签管理-查询筛选', '标签名称 Input；状态 Select 启用/禁用。查询写 query，重置清空。'))
a(fig('后台-标签管理-列表表格.png', '后台-标签管理-列表表格', '标签名称、帖子数、状态 Tag、操作：编辑/上移/下移/启用禁用/删除。首行上移 disabled，末行下移 disabled。勾选后批量启用/禁用。'))
a(fig('后台-标签管理-新建弹窗.png', '后台-标签管理-新建弹窗', '标签名称必填空白校验、max20 showCount、重名 validateForumTagName。确认 upsertForumTag。'))
a(fig('后台-标签管理-删除确认.png', '后台-标签管理-删除确认', '有引用则写将从 N 个帖子中移除；无引用「当前无关联帖子」。删除不可恢复。'))

a(' <h4>6.A.7 禁言管理</h4>')
a(fig('后台-禁言管理-页面整体.png', '后台-禁言管理-页面整体', '副标题：添加后立即生效并记录禁言时间，解除后写入解除时间。无分页。'))
a(fig('后台-禁言管理-列表表格.png', '后台-禁言管理-列表表格', '禁言成员、所属部门、禁言原因、禁言时间、解除时间(空 —)、状态 生效中/已解除、操作人、操作。仅生效中有「解除禁言」。空「暂无禁言成员」。'))
a(fig('后台-禁言管理-添加弹窗.png', '后台-禁言管理-添加弹窗', '禁言成员 Select 搜索 FORUM_USER_OPTIONS「姓名 · 部门」；原因 TextArea max 100 showCount。确定 addMute，operator 默认管宁。'))
a(fig('后台-禁言管理-解除确认.png', '后台-禁言管理-解除确认', '文案：解除后该成员可重新发帖。releaseMute 写 releasedAt，active=false。toast「已解除禁言」。'))
a(table(
    ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
    [
        ['禁言成员', '后台-禁言管理-添加弹窗-禁言成员', 'Select showSearch', '是', '空', '请选择禁言成员', 'FORUM_USER_OPTIONS', '对被禁人名拦截发评'],
        ['禁言原因', '后台-禁言管理-添加弹窗-禁言原因', 'TextArea', '是', '空', '请输入禁言原因；≤100', '自由文本', '列表展示'],
    ],
))
a('</article>')

a('<article id="page-h5"><h3>6.B H5</h3>')
a(' <h4>6.B.1 板块页</h4>')
a(fig('H5-板块页-页面整体.png', 'H5-板块页-页面整体', '无传统顶栏标题，头图叠导航返回。种子二手论坛。'))
a(fig('H5-板块页-头图区.png', 'H5-板块页-头图区', 'headerImage、图标、名称+「N帖子」（可见帖计数）、简介按钮展开/收起 aria-label。无简介不渲染按钮。'))
a(fig('H5-板块页-搜索框.png', 'H5-板块页-搜索框', 'placeholder「搜索帖子」。匹配标题/标签/正文/作者名（含匿名展示名）。前端过滤无独立结果页。'))
a(fig('H5-板块页-标签Tab.png', 'H5-板块页-标签Tab', '全部 + board.tags。点 Tab 按 topic.tags includes。'))
a(fig('H5-板块页-排序.png', 'H5-板块页-排序', '默认「最新回复」is-on；可切「最新发布」。sortClientForumTopics。'))
a(fig('H5-板块页-帖子列表.png', 'H5-板块页-帖子列表', '作者、置顶/标签/标题、缩略图 ForumPhotoGrid、摘要、统计评论赞藏浏览。自己的帖 ForumOwnTopicActions 编辑/删除。待回复加 class 与横幅。'))
a(fig('H5-板块页-匿名作者.png', 'H5-板块页-匿名作者', '显示器帖展示【匿名用户】四位序号、头像「匿」、无部门。可同时出现「需要你回复」。不露唐宇真名。'))
a(fig('H5-板块页-发布按钮.png', 'H5-板块页-发布按钮', 'FAB「立即发布」打开 compose 新建。'))
a(fig('H5-发布帖子-表单.png', 'H5-发布帖子-表单', '标题、内容、图最多9、标签选填单选可取消、匿名发帖（仅板块允许匿名且非编辑）。提交；遮罩关闭 aria 关闭。'))
a(fig('H5-板块页-空态.png', 'H5-板块页-空态', '?empty=1 走 usePreviewList 空。文案「暂无帖子」。头图仍在。'))
a(fig('H5-板块页-不存在.png', 'H5-板块页-不存在', 'id 无效或停用：顶栏标题「论坛」，主文案「论坛不存在或已停用」。'))
a(table(
    ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
    [
        ['立即发布', 'H5-板块页-发布按钮', 'FAB', '板 enabled', '板不存在无 FAB', '点开表单提交', 'publishClientTopic', '列表前插新帖 audit 直接发布 shelf on', 'toast 发布成功', '请填写标题 / 禁言未拦发帖', '内存'],
        ['编辑自己的帖', 'H5-板块页-帖子列表-编辑', '操作', 'author===周敏', '他人无按钮', '提交', 'updateClientTopic', '改标题内容图表', '已保存', '只能编辑自己的帖子 / 请填写标题', '内存'],
        ['删除自己的帖', 'H5-板块页-帖子列表-删除', '操作', '自己的帖', '他人无', '底表确认删除后无法恢复', 'deleteClientTopic', '从 store 移除', '无成功 toast', '只能删除自己的帖子', 'H5DeleteSheet'],
        ['进帖', 'H5-板块页-帖子列表-标题区', 'a.href', '可见帖', '始终', '点击', 'hash forum-topic', '路由', '详情', '不可见直链空态', '无 API'],
    ],
))

a(' <h4>6.B.2 帖子详情</h4>')
a(fig('H5-帖子详情-页面整体.png', 'H5-帖子详情-页面整体', '顶栏返回到板块，标题为 boardName。'))
a(fig('H5-帖子详情-正文.png', 'H5-帖子详情-正文', '作者、置顶/标签/标题、正文、大图网格、ForumPostStats。'))
a(fig('H5-帖子详情-点赞收藏.png', 'H5-帖子详情-点赞收藏', '底栏：写评论输入、发送、赞数、星标收藏。toggleTopicLike / toggleTopicFavorite。'))
a(fig('H5-帖子详情-评论输入.png', 'H5-帖子详情-评论输入', '点评论回复展开 composer；可附图 cap 9。发送 addClientTopicComment 或 Reply。'))
a(fig('H5-帖子详情-匿名评论勾选.png', 'H5-帖子详情-匿名评论勾选', '二手论坛允许匿名时，展开评论区出现 checkbox 文案「匿名」，aria-label「匿名评论」。勾选后评论 authorAnonymous=true。'))
a(fig('H5-帖子详情-匿名帖.png', 'H5-帖子详情-匿名帖', 'id=4 显示器帖：楼主【匿名用户】+序号；评论人同样匿名序号（同帖内作者映射稳定）。'))
a(fig('H5-帖子详情-匿名评论人.png', 'H5-帖子详情-匿名评论人', '评论头像「匿」+【匿名用户】四位号，无部门。回复按钮 aria「回复 【匿名用户】xxxx」。'))
a(fig('H5-帖子详情-不存在.png', 'H5-帖子详情-不存在', '下架/驳回/待审/无板：「帖子不存在」。'))
a('<p>评论排序热度/时间代码状态 commentSort，默认 hot。删除自己的评/回复走确认 sheet。点赞评论 toggleClientTopicCommentLike。自己的匿名评显示「我」。</p>')

a(' <h4>6.B.3 我的帖子</h4>')
a(fig('H5-我的帖子-页面整体.png', 'H5-我的帖子-页面整体', 'myClientForumTopics：非信箱、可见、author 周敏。可编辑删除进详情。'))
a(fig('H5-我的帖子-空态.png', 'H5-我的帖子-空态', 'empty=1「暂无帖子」。'))
a('</article>')

a('<article id="page-pc"><h3>6.C PC</h3>')
a(fig('PC-板块页-页面整体.png', 'PC-板块页-页面整体', 'PcActivityShell 标题=板块名。左 feed 右 sidebar。'))
a(fig('PC-板块页-头图区.png', 'PC-板块页-头图区', '同 H5 头图+简介展开，h2 名称+帖数。'))
a(fig('PC-板块页-帖子列表.png', 'PC-板块页-帖子列表', '搜索/Tab/排序/帖列表逻辑与 H5 相同；缩略最多 5。匿名规则同 H5。'))
a(fig('PC-板块页-匿名作者.png', 'PC-板块页-匿名作者', '与 H5 同一套 topicAuthorName：【匿名用户】序号、头像匿。'))
a(fig('PC-板块页-侧栏.png', 'PC-板块页-侧栏', '当前用户周敏+部门；立即发布；管理员列表；待你回复；热门帖子；其他论坛。'))
a(fig('PC-板块页-立即发布.png', 'PC-板块页-立即发布', '侧栏主按钮，打开同一 H5ForumCompose。'))
a(fig('PC-板块页-热门帖子.png', 'PC-板块页-热门帖子', '按回复数再赞数取前 5，序号 1–5。'))
a(fig('PC-板块页-其他论坛.png', 'PC-板块页-其他论坛', '其他 enabled 论坛链到 #/c/pc/forum/{id}。'))
a(fig('PC-发布帖子-表单.png', 'PC-发布帖子-表单', '与 H5 同一浮层组件。'))
a(fig('PC-板块页-空态.png', 'PC-板块页-空态', 'empty=1 列表「暂无帖子」，侧栏仍在。'))
a(fig('PC-帖子详情-页面整体.png', 'PC-帖子详情-页面整体', '宽屏正文+评论+composer；板不存在/帖不可见走空文案。'))
a(fig('PC-帖子详情-匿名帖.png', 'PC-帖子详情-匿名帖', '显示器帖详情：楼主与评论均为【匿名用户】序号。'))
a(fig('PC-帖子详情-匿名评论勾选.png', 'PC-帖子详情-匿名评论勾选', '聚焦「写评论」后输入框内出现「匿名」勾选（aria 匿名评论）与附图、发布。placeholder「参与讨论，说说你的看法…」。'))
a(fig('PC-我的帖子-页面整体.png', 'PC-我的帖子-页面整体', '壳标题「我的帖子」。门户未放入口，hash 可开。'))
a('<p>PC 停用板：PcActivityShell 标题「论坛」+「论坛不存在或已停用」。</p>')
a('</article></section>')

a('<section id="data-fields"><h2>7. 数据字段与枚举</h2>')
a(table(
    ['字段', '取值', '说明'],
    [
        ['ForumKind', 'forum / mailbox', '本文仅 forum'],
        ['BoardStatus', 'enabled / disabled', '文案 已启用 / 已停用'],
        ['ForumVisibility', '全员 / 按部门 / 自定义人群 / 导入人群', 'FORUM_VISIBILITY_OPTIONS'],
        ['TopicAuditStatus', '直接发布 / 待审核 / 已通过 / 已驳回', 'C 端隐藏 待审核、已驳回'],
        ['PinScope', '空 / global / board', 'isTopicPinned 后两者都算置顶；后台置顶写入 board'],
        ['ShelfStatus', 'on / off', 'off=下架'],
        ['ForumTagStatus', '启用 / 禁用', ''],
        ['FORUM_COMMENT_MAX', '200', '后台回复字数'],
        ['FORUM_COMMENT_IMAGE_MAX / FORUM_COMPOSE_IMAGE_MAX', '9', ''],
        ['MUTE_REASON_MAX', '100', ''],
        ['FORUM_MAIN_COMMENT_PAGE_SIZE', '10', '后台主评分页'],
        ['forumAdminSelf', '陈产品', '后台回复默认账号'],
        ['forumClientSelf', '周敏', 'C 端写操作身份'],
        ['马甲', '论坛小助手、官方客服', '后台回复下拉'],
        ['匿名展示', '【匿名用户】+1000–9999 或「我」', 'forumActorName / forumAnonSerials；后台仍匿名（真名）'],
    ],
))
a('</section>')

a('<section id="apis"><h2>8. API / 数据接口清单</h2>')
a('<p>代码无 fetch/axios/XHR/WebSocket。数据全在 <code>forumStore</code> 内存 + 初始 seed。刷新丢失运行时变更。</p>')
a(table(
    ['接口用途', '方法', '路径', '触发场景', '请求参数', '响应字段', '是否真实接口', '备注'],
    [
        ['—', '—', '—', '—', '—', '—', '否', '无真实 HTTP'],
    ],
))
a('<p><strong>建议接口 / 待确认</strong>（页面需要但未实现）：</p>')
a(table(
    ['接口用途', '方法', '路径', '触发场景', '请求参数', '响应字段', '是否真实接口', '备注'],
    [
        ['板块 CRUD/启停', 'REST', '待确认', '后台列表表单', 'BoardDraft', 'Board', '建议', '需鉴权与重名'],
        ['帖子列表/详情/上下架/置顶/指派', 'REST', '待确认', '详情表', 'id, pin, shelf, assignees', 'Topic', '建议', ''],
        ['发帖/改删/评论', 'REST', '待确认', 'C 端', 'title, content, images, tags, anonymous', 'id/error', '建议', '禁言、可见范围服务端强制'],
        ['赞藏', 'POST', '待确认', 'C 端', 'topicId', 'counts, liked', '建议', '现为内存数组'],
        ['禁言', 'REST', '待确认', '风控', 'user, reason', 'MuteRecord', '建议', ''],
        ['标签', 'REST', '待确认', '标签管理', 'name, status, order', 'Tag', '建议', ''],
        ['C 端链接', '—', '前端拼 origin+#/c/h5/...', '查看链接', 'boardId/topicId', 'url', '代码已实现前端拼', '非后端短链'],
    ],
))
a('</section>')

a('<section id="non-functional"><h2>9. 非功能需求</h2>')
a('<ul>')
a('<li>布局：后台 1440 桌面 Ant Design；H5 390 壳 is-forum；PC 双栏 c-forum-pc-layout。</li>')
a('<li>上传：图片 beforeUpload false，DataURL 存内存，无对象存储。</li>')
a('<li>无障碍：部分按钮有 aria-label（返回、搜索帖子、上传图标、查看链接、禁言操作）。</li>')
a('<li>性能：帖列表全量内存过滤；后台主评手动加载更多。</li>')
a('<li>安全：无登录；clipboard 复制链接；可见范围未在 C 端强制，{todo}。</li>')
a('<li>错误：message/toast；无全局 HTTP 错误页。</li>')
a('</ul></section>')

a('<section id="analytics"><h2>10. 埋点与指标建议</h2>')
a(f'<p>{guess} 代码无埋点 SDK。</p>')
a(table(
    ['事件名称', '触发动作', '关键属性', '业务目的'],
    [
        ['forum_board_view', '打开 H5/PC 板块', 'board_id, surface', '曝光'],
        ['forum_topic_publish', '提交发帖', 'board_id, anonymous, has_image, tag', '生产'],
        ['forum_topic_click', '点帖卡片', 'topic_id, sort, tab', '消费'],
        ['forum_comment_submit', '发评/回复', 'topic_id, is_reply', '互动'],
        ['forum_like_toggle', '赞帖/评', 'target_type, id, on', '互动'],
        ['forum_topic_shelf', '后台下架/上架', 'topic_id, shelf', '治理'],
        ['forum_mute_add', '添加禁言', 'user', '风控'],
    ],
))
a('</section>')

a('<section id="acceptance"><h2>11. 验收标准</h2>')
a('<ul>')
a('<li>Given 启用中的二手论坛，When 打开 #/c/h5/forum/1，Then 见头图名称与可见帖列表，不含下架/待审/已驳回帖。</li>')
a('<li>Given 停用该板，When 再打开同 hash，Then 「论坛不存在或已停用」，无 FAB。</li>')
a('<li>Given 发帖标题为空，When 点提交，Then toast「请填写标题」，不写 store。</li>')
a('<li>Given 标题有值，When 提交，Then toast「发布成功」，列表可见，audit=直接发布。</li>')
a('<li>Given 二手论坛允许匿名且打开显示器帖，When 员工看 C 端，Then 楼主与评为人【匿名用户】四位号、头像「匿」、无部门；后台帖详情发帖人仍「匿名（唐宇）」。</li>')
a('<li>Given 周敏匿名发帖或发评，When 自己看 C 端，Then 名称显示「我」而非序号。</li>')
a('<li>Given 板允许匿名，When 展开 H5/PC 评论框，Then 出现「匿名」勾选。</li>')
a('<li>Given 后台下架该帖，When C 端刷新列表/直链，Then 列表无此帖，详情「帖子不存在」。</li>')
a('<li>Given 周敏被禁言，When 发主评，Then 「你已被禁言」。</li>')
a('<li>Given 指派周敏且其未回，When 打开板块，Then 帖带待回复样式；PC 侧栏「待你回复」有该标题。</li>')
a('<li>Given 新建论坛不传图标，When 创建，Then 字段「请上传论坛图标」。</li>')
a('<li>Given 重名「二手论坛」，When 创建，Then message.error 且名称红字。</li>')
a('<li>Given 标签禁用，When 打开发帖浮层，Then 选项不含该标签（板 tags 来自板块配置快照，改板 tags 才变；标签目录禁用影响新建板可选）。</li>')
a('</ul></section>')

a('<section id="risks"><h2>12. 风险与待确认问题</h2>')
a('<ul>')
a('<li>C 端不按可见范围/部门过滤员工，仅 status=enabled。生产是否要与活动应用 5.1 对齐？</li>')
a('<li>禁言拦 addClientTopicComment，不拦 addClientTopicReply 与 publishClientTopic。产品是否要求发帖+楼层一并拦截？</li>')
a('<li>导入人群只存文件名，新建不解析 CSV 人数。</li>')
a('<li>帖审核态有枚举，后台论坛无「审帖」操作；种子有已通过/已驳回。审核流是否要做？</li>')
a('<li>PinScope 含 global，后台确认置顶只写 board。</li>')
a('<li>PC 我的帖子无门户入口。</li>')
a('<li>后台论坛列表无搜索筛选，BoardQuery 能力未挂 UI。</li>')
a('<li>无持久化、无权限、无真实接口。</li>')
a('<li>H5/PC 发帖、评论匿名仅板 anonymous；作者字段仍写周敏，展示走 authorAnonymous。编辑帖无匿名勾选。</li>')
a('<li>匿名序号为前端 hash，非服务端发号；生产是否要持久化序号 {todo}。</li>')
a('</ul></section>')

html_body = '\n'.join(body)
g.write_prd('forum-app', '论坛应用-PRD.html', '论坛应用 产品需求文档', TOC, html_body)
