#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import _gen_prd as g

impl = '<span class="status impl">代码已实现</span>'
guess = '<span class="status guess">根据页面推测需要</span>'
todo = '<span class="status todo">待确认</span>'


def fig(src: str, path: str, desc: str) -> str:
    return (
        f'<figure><img src="screenshots/{src}" alt="{path}截图">'
        f'<figcaption><span class="component-path">{path}</span>：{desc}</figcaption></figure>'
    )


def table(headers: list[str], rows: list[list[str]]) -> str:
    head = ''.join(f'<th>{h}</th>' for h in headers)
    body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows)
    return f'<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'


TOC = [
    ('doc-note', '1. 文档说明'),
    ('overview', '2. 产品概述'),
    ('ia', '3. 页面结构 / 信息架构'),
    ('implemented-features', '4. 已实现功能清单'),
    ('flows', '5. 用户流程'),
    ('page-requirements', '6. 页面级需求说明'),
    ('h5', '6.1 H5装修'),
    ('pc', '6.2 PC装修'),
    ('data-fields', '7. 数据字段与枚举'),
    ('apis', '8. API / 数据接口清单'),
    ('non-functional', '9. 非功能需求'),
    ('analytics', '10. 埋点与指标建议'),
    ('acceptance', '11. 验收标准'),
    ('risks', '12. 风险与待确认问题'),
]


def body() -> str:
    a: list[str] = []
    a.append(f'''
  <section id="doc-note">
    <h2>1. 文档说明</h2>
    <ul>
      <li>文档来源：基于现有 HTML/CSS/JavaScript 反向分析（html-to-prd）。壳层为 React 工作台；装修画布为独立 HTML（<code>public/decoration/h5.html</code>、<code>pc.html</code>）经 iframe 嵌入。</li>
      <li>分析范围：<strong>仅后台</strong>。应用键 <code>workbench</code>（顶栏文案「工作台」，<code>hiddenFromSwitcher: true</code>）。页面：H5装修 <code>#/workbench/h5-decoration</code>、PC装修 <code>#/workbench/pc-decoration</code>。不含员工端 React 门户（<code>#/c/h5</code>、<code>#/c/pc</code>）及组织管理占位页。</li>
      <li>生成日期：2026-09-21；对照更新：2026-09-22。</li>
      <li>2026-09-22 对照增量：① 装修源 <code>public/decoration/h5.html</code>、<code>pc.html</code>、<code>article-picker.js</code>、<code>activity-picker.js</code> 自 2026-09-20 未改，交互条款与 9-21 稿一致。② 壳层 <code>App.tsx</code> / <code>styles.css</code> 有改动，已重截全页与组件图（iframe <code>HTML_STUDIO_REV</code> 仍为 <code>20260904-activity-no-jump</code>）。③ 今日其他会话改动（即时激励热门勋章筛选、发放记录附件、关怀节气隐藏、信箱列宽、论坛「我的*」去右栏等）不在本后台装修范围内，不写入本稿。</li>
      <li>可信度：按钮绑定、组件库、字段开关、选择器以装修 HTML / <code>article-picker.js</code> / <code>activity-picker.js</code> 为准（{impl}）。无 HTTP、无鉴权、无真实发布。保存/持久化/权限标 {todo}。</li>
      <li>组件命名一律 <code>页面-模块-组件名称</code>。</li>
      <li>标记：{impl} {guess} {todo}</li>
    </ul>
  </section>

  <section id="overview">
    <h2>2. 产品概述</h2>
    <p><strong>产品定位：</strong>员工应用（微页面）后台装修工作台。运营在 H5 / PC 两端拖放或点选组件，配置标题、样式、内容来源与字段显隐，预览员工门户首页版面。</p>
    <p><strong>目标用户：</strong>原型顶栏固定「陈产品 / 产品管理员」。RBAC {todo}。</p>
    <p><strong>核心使用场景：</strong>① 配置 H5 微页面首页文章/问卷/活动等区块；② 配置 PC「默认门户」三栏版面；③ 用自定义选择器从 mock 目录挑文章或活动。</p>
    <p><strong>页面/系统主要价值：</strong>把员工门户首页做成可视化拼装，而不是写死模板。当前为可交互原型，预览即时、不落库。</p>
  </section>

  <section id="ia">
    <h2>3. 页面结构 / 信息架构</h2>
    {fig('员工应用-左侧菜单.png', '员工应用-导航-左侧菜单', '壳层 Ant Design 侧栏仅两项：H5装修、PC装修。高亮随 hash。')}
    <ul>
      <li>页面清单：H5装修、PC装修。无概览/列表/详情 CRUD。</li>
      <li>导航结构：工作台 → 一级叶子菜单。默认页 <code>h5-decoration</code>。未知 hash 回工作台 H5装修。</li>
      <li>页面区域：壳层 Header（应用切换、通知、用户）+ Sider + Content iframe（<code>HtmlStudioPage</code>，<code>HTML_STUDIO_REV=20260904-activity-no-jump</code>）。</li>
      <li>跳转：侧栏切两端装修；PC 装修内「返回」走 <code>history.back()</code>，无历史则跳 <code>PC页面装修.html</code>（相对路径，嵌入后台时 {todo} 是否可达）。</li>
    </ul>
  </section>

  <section id="implemented-features">
    <h2>4. 已实现功能清单</h2>
    {table(
        ['模块', '功能点', '功能说明', '页面/区域', '状态'],
        [
            ['壳层', '菜单与 iframe', '加载 /decoration/h5.html 或 pc.html', '工作台-内容区-HtmlStudioPage', impl],
            ['H5 组件库', '三组折叠', '基础 / 用户 / 应用；默认展开应用组件，文章高亮', 'H5装修-组件库', impl],
            ['H5 画布', '手机预览', '375 宽；默认文章选中；宫格/图片/常用应用为静态占位', 'H5装修-画布', impl],
            ['H5 内容配置', '文章/问卷/服务/荣誉/活动类', '标题栏、样式、选择方式、字段开关；拖放上屏', 'H5装修-右侧配置', impl],
            ['选择器', '文章/活动/瞬间/投票/兴趣圈', '自定义时打开 mock 弹窗', 'H5/PC-选择弹窗', impl],
            ['PC 工作台', '三栏门户', '左话题、中插槽、右发帖/快捷/公告/内刊/积分榜', 'PC装修-画布', impl],
            ['PC 页面设置', '背景色/图', '色值默认 #0f5c49；本地 blob 图，刷新丢失', 'PC装修-页面设置', impl],
            ['PC 保存', 'Toast', '点击「保存」仅 toast「已保存」，无 localStorage/HTTP', 'PC装修-顶栏-保存', impl],
            ['基础组件占位', '轮播/图片/课程等', 'PC 点选 toast「基础组件占位」或「可后续扩展」；H5 拖放除已接线组件外无效果', '组件库', impl],
        ],
    )}
  </section>

  <section id="flows">
    <h2>5. 用户流程</h2>
    <h3>H5 主流程</h3>
    <ol>
      <li>进入 <code>#/workbench/h5-decoration</code> → iframe 加载 H5 工作室。</li>
      <li>默认选中「文章」；右侧「内容」Tab 可改标题/样式/最新条数/字段。</li>
      <li>从组件库拖到手机或点击应用组件 → <code>placeApp</code> / <code>placeSurvey</code> 等，区块 <code>hidden=false</code> 并选中。</li>
      <li>自定义选择 → 打开 picker → 确认写入 picked 数组（仅内存）。</li>
      <li>删除按钮隐藏区块并 <code>fallbackSelect</code> 下一个可见组件。上移/下移/复制无脚本绑定。</li>
    </ol>
    <h3>PC 主流程</h3>
    <ol>
      <li>进入 <code>#/workbench/pc-decoration</code>。中栏提示「点击左侧组件，添加到预览区」。</li>
      <li>点组件库「文章/公告/与我相关/问卷/活动…」→ 对应 wrap 显示并选中，右侧切「组件设置」。</li>
      <li>「页面设置」改背景色或上传背景图（ObjectURL）。</li>
      <li>「保存」toast；刷新后配置丢失。</li>
    </ol>
    <p>异常：选择器在非自定义模式会 toast「请先选择自定义」（文章 picker <code>open()</code>）。兴趣圈无跳转链接行。</p>
  </section>
''')

    a.append(f'''
  <section id="page-requirements">
    <h2>6. 页面级需求说明</h2>

    <article class="page-requirement" id="h5">
      <h3>6.1 H5装修</h3>
      <h4>页面目标</h4>
      <p>在手机画布上拼装「微页面首页」，配置文章及业务应用区块的展示与数据挑选规则。</p>
      <h4>页面布局</h4>
      {fig('H5装修-页面整体.png', 'H5装修-页面布局-页面整体', '后台壳 + iframe 工作室。')}
      {fig('H5装修-工作台整体.png', 'H5装修-工作台-三栏布局', '左组件库 260px、中预览、右配置 360px。')}
      {fig('H5装修-组件库.png', 'H5装修-组件库-分组列表', 'GROUPS：基础组件 15 项、用户组件 5 项、应用组件 7 项（文章/问卷/课程/活动/精彩瞬间/兴趣圈/投票）。')}
      {fig('H5装修-画布.png', 'H5装修-画布-中栏', '顶右工具「页面设置」「悬浮按钮」无 click 监听。')}
      {fig('H5装修-工具栏.png', 'H5装修-画布-工具栏', '两个 ghost 按钮；代码无绑定，点击无系统响应。')}
      {fig('H5装修-手机预览.png', 'H5装修-画布-手机预览', '状态栏 9:41；标题「微页面首页」；胶囊「全部/通知公告/企业文化」为静态；文章默认 sel。')}

      <h4>组件截图与需求描述</h4>
      {fig('H5装修-文章-选中态.png', 'H5装修-画布-文章区块', '默认可见。角标「文章」。操作条 ↑↓⧉✕，仅 ✕（data-act=del）绑定：hidden=true 并 fallbackSelect。')}
      {fig('H5装修-文章-右侧内容.png', 'H5装修-文章导航-内容Tab', 'rightTitle 默认「文章导航」。Tab：内容 / 样式。')}
      {fig('H5装修-文章-展示样式.png', 'H5装修-文章导航-展示样式', 'STYLES：标题列表/大图/一行两列/左图右文/左文右图/横向滑动。默认 left。')}
      {fig('H5装修-文章-字段设置.png', 'H5装修-文章导航-字段设置', '标题、创建时间、阅读量、互动数，开关默认 on，控制骨架条。')}
      {fig('H5装修-文章-样式Tab.png', 'H5装修-右侧-样式Tab', '文案「颜色与间距等样式可在此扩展。」无控件。')}
      {fig('H5装修-文章-自定义选择.png', 'H5装修-文章导航-选择方式', '最新 N 篇（预览 clamp 1–4）或自定义后显示「添加文章」。')}
      {fig('H5装修-文章-选择文章弹窗.png', 'H5装修-文章导航-选择文章弹窗', 'mountArticlePicker：分类树、标题/状态筛选、排序、分页 6 条、右侧已选。目录 8 篇 mock。')}
      {fig('H5装修-调查问卷-画布选中.png', 'H5装修-画布-调查问卷', '点击或拖放「调查问卷」placeSurvey。样式仅标题列表一种。')}
      {fig('H5装修-调查问卷-右侧配置.png', 'H5装修-调查问卷-内容配置', '默认自定义+添加问卷按钮；sJumpRow 下拉为静态「请选择」，无选项数据。')}
      {fig('H5装修-用户服务-画布选中.png', 'H5装修-画布-用户服务', '4 列宫格预览。')}
      {fig('H5装修-用户服务-右侧配置.png', 'H5装修-用户服务-字段开关', '标题默认「应用服务」max 40。SVC_ITEMS 11 项默认全开。')}
      {fig('H5装修-荣誉组件-画布选中.png', 'H5装修-画布-荣誉组件', '预览「共1枚, 100积分」与 4 枚「卓越贡献」骨架。')}
      {fig('H5装修-荣誉组件-右侧配置.png', 'H5装修-荣誉组件-字段开关', '我的积分卡 / 我的勋章。关积分卡时副标题去掉积分。')}
      {fig('H5装修-活动-画布选中.png', 'H5装修-画布-活动', '默认大图、3 条、字段全开。')}
      {fig('H5装修-活动-右侧配置.png', 'H5装修-活动导航-内容配置', '跳转：活动 / 兴趣圈活动。选择来源同。自定义打开 activityPicker。无标题列表样式。')}
      {fig('H5装修-精彩瞬间-画布选中.png', 'H5装修-画布-精彩瞬间', '默认横向滑动、5 条。')}
      {fig('H5装修-精彩瞬间-右侧配置.png', 'H5装修-精彩瞬间导航-内容配置', '跳转：活动-精彩瞬间 / 兴趣圈-精彩瞬间。')}
      {fig('H5装修-兴趣圈-画布选中.png', 'H5装修-画布-兴趣圈', '默认横向滑动、5 条。')}
      {fig('H5装修-兴趣圈-右侧配置.png', 'H5装修-兴趣圈导航-内容配置', 'hideJump：无跳转链接行；无「选择兴趣圈」来源链。')}
      {fig('H5装修-投票-画布选中.png', 'H5装修-画布-投票', '默认左图右文、count 99、标题栏/更多默认关。')}
      {fig('H5装修-投票-右侧配置.png', 'H5装修-投票导航-内容配置', '无选择来源链；自定义 votePicker。')}

      <h4>组件显示逻辑</h4>
      {table(
          ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
          [
              ['H5装修-组件库-分组', '折叠', '应用组件 open，文章 on', 'acc-h toggle open', '始终可点', 'GROUPS 常量', '展开网格 3 列', '无空态', '无'],
              ['H5装修-画布-文章区块', '区块', '可见+选中', 'del 后 hidden；拖「文章」再显示', '始终可点选', '内存 listStyle/字段开关', 'sel 红虚线', '无真实文章空态，仅骨架', '无'],
              ['H5装修-画布-应用区块', '区块', 'hidden', 'placeApp / drop 显示', '库内点击即放置（即使已在画布）', 'appState', '选中 art-tag', 'picked 空时仍按 count 画骨架', '无'],
              ['H5装修-右侧-内容/样式', 'Tab', '内容 on', 'currentTab 控制 pane', '始终', 'DOM hidden', '样式 pane 仅说明文字', '无', '无'],
              ['H5装修-文章导航-查看更多行', '开关组', '显示', '标题栏 off 则 moreRow/jumpRow display:none', '标题栏开关', 'titleSwitch', '预览隐藏更多', '无', '无'],
              ['H5装修-文章导航-添加文章', '按钮', 'hidden', 'pickMode=custom 才显示', 'articlePicker.open 校验自定义', 'mock CATALOG', '弹窗 mask.show', 'toast 请先选择自定义', '无'],
              ['H5装修-画布-工具栏', '按钮', '可见', '始终', '无脚本=点击无响应', '无', '无', '无', '无'],
          ],
      )}

      <h4>字段说明</h4>
      {table(
          ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
          [
              ['标题名称', 'H5装修-文章导航-标题名称', 'color+text', '否', '文章 / #111111', 'maxlength 40，计数 n/40', '自由文本', '区块标题'],
              ['标题栏', 'H5装修-文章导航-标题栏', 'switch', '否', 'on', '无', 'on/off', '关则藏标题与更多/跳转'],
              ['查看更多', 'H5装修-文章导航-查看更多', 'color+switch', '否', 'on / #b0b0b0', '无', 'on/off', '预览「更多 >」'],
              ['跳转链接', 'H5装修-文章导航-跳转链接', '级联下拉', '否', '空', '先板块再分类/专栏', '企业动态/知识库/劳模风采', '预览不消费该值 {todo} 生产跳转'],
              ['展示样式', 'H5装修-文章导航-展示样式', '缩略图单选', '否', 'left', '无', 'title/big/two/left/right/slide', '列表骨架布局'],
              ['选择方式', 'H5装修-文章导航-选择方式', 'radio+数字', '否', 'latest / 2', '预览 parseInt clamp 1–4', 'latest/custom', '最新条数或自定义列表'],
              ['字段-标题等', 'H5装修-文章导航-字段设置', 'switch×4', '否', '全 on', '无', 'on/off', '骨架是否画对应条'],
              ['问卷标题', 'H5装修-调查问卷-标题名称', 'color+text', '否', '调查问卷', 'max 40', '—', '区块标题'],
              ['问卷选择方式', 'H5装修-调查问卷-选择方式', 'radio', '否', 'custom', 'sLatestN 预览 1–4', 'latest/custom', '自定义显示添加按钮'],
              ['服务标题', 'H5装修-用户服务-标题', 'text', '否', '应用服务', 'max 40', '—', '宫格上方标题'],
              ['服务项开关', 'H5装修-用户服务-字段开关', 'switch×11', '否', '全 on', '无', '见枚举 SVC_ITEMS', '关则宫格不渲染该项'],
              ['荣誉标题', 'H5装修-荣誉组件-标题', 'text', '否', '我的荣誉', 'max 40', '—', '区块标题'],
              ['活动标题', 'H5装修-活动导航-标题名称', 'color+text', '否', '活动 / #171A1D', 'max 40', '—', 'appState.title'],
              ['活动条数', 'H5装修-活动导航-选择方式', 'number 文本', '否', '3 / max 20', 'fillAppPane 写入 count', 'unit 个活动', '骨架条数'],
              ['活动字段', 'H5装修-活动导航-字段设置', 'switch×10', '否', '全 true', '无', '置顶/分类/举办方式/状态/点赞/标题/时间/地点/报名进度/报名按钮', '预览条带'],
          ],
      )}

      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['展开组件组', 'H5装修-组件库-分组标题', '.acc-h', '无', '始终', '点击', 'toggle class open', '网格显隐', '无', '无', '无'],
              ['拖放组件', 'H5装修-组件库-组件卡片', '.comp dragstart', 'draggable', '始终', '拖到 .center', 'drop 调 place*', '区块显示并选中', 'phone drop-over 高亮', '未接线名称无操作', '无 API'],
              ['点击应用组件', 'H5装修-组件库-活动等', '.comp click', 'APP_BLOCKS 匹配', '始终', '点击', 'placeApp 即使已显示', '选中配置', '无 toast', '课程无 place', '无'],
              ['删除区块', 'H5装修-画布-删除', '[data-act=del]', '区块可见', '始终', '点击 ✕', 'hidden + fallbackSelect', '选中下一个可见', '无确认框', '全删后 rightTitle=页面装修', '无'],
              ['切内容/样式', 'H5装修-右侧-Tab', 'button[data-tab]', '无', '始终', '点击', 'currentTab + showRightPane', 'pane hidden 切换', '无', '无', '无'],
              ['添加文章', 'H5装修-文章导航-添加文章', '#addNews', 'custom', '非 custom 隐藏', '点击', 'picker.open', 'mask.show', '弹窗', '非 custom toast', '无 HTTP'],
              ['确认选文', 'H5装修-文章导航-选择文章弹窗', '#pickOk', '弹窗打开', '始终', '确定', 'picked=draft, close', '右侧 picked 卡片', '关弹窗', '无校验必选', '无'],
              ['上移下移复制', 'H5装修-画布-操作条', '↑↓⧉', '可见', '无 listener', '点击', '无', '无', '无', '无', '无'],
              ['页面设置/悬浮按钮', 'H5装修-画布-工具栏', '.ghost', '可见', '无 listener', '点击', '无', '无', '无', '无', '无'],
          ],
      )}

      <h4>交互规则</h4>
      <p>组件库点击「文章」仅 selectWidget，不创建第二份文章。问卷/服务/荣誉需点击库或拖放才显示（默认 hidden）。应用组件点击即 placeApp。预览为骨架，不拉真实活动/文章接口。课程在库中但 drop/click 均不放置。</p>
      <h4>校验规则</h4>
      <p>标题 maxlength=40。latestN 非数字当 2。无必填拦截、无保存校验。picker 状态筛：全部/已发布/未发布。</p>
      <h4>异常/空状态</h4>
      <p>下拉无选项时菜单「暂无选项」。picker 未选列表「尚未选择文章」。H5 无全局保存失败态。</p>
      <h4>权限/状态控制</h4>
      <p>无登录、无角色。壳层用户仅为展示。</p>
      <h4>验收标准</h4>
      <p>Given 打开 H5装修，When 页面加载，Then 文章区块选中且右侧为文章导航内容 Tab。<br>
      Given 拖入活动，When drop，Then 活动区块可见且右侧为活动导航。<br>
      Given 选择方式=自定义，When 点添加文章，Then 出现选择文章弹窗。<br>
      Given 点删除文章，When 无其他区块，Then 右侧标题为「页面装修」。</p>
    </article>

    <article class="page-requirement" id="pc">
      <h3>6.2 PC装修</h3>
      <h4>页面目标</h4>
      <p>装修 PC「默认门户」：中栏插入内容组件，右栏为门户装饰，页面设置改背景。</p>
      <h4>页面布局</h4>
      {fig('PC装修-页面整体.png', 'PC装修-页面布局-页面整体', '壳层 + iframe。')}
      {fig('PC装修-工作台整体.png', 'PC装修-工作台-整体', '顶栏 + 左库 + 1080 宽 pc-stage + 右配置。')}
      {fig('PC装修-顶栏.png', 'PC装修-顶栏-返回保存', '返回、标题「默认门户」、橙色保存。')}
      {fig('PC装修-组件库.png', 'PC装修-组件库-基础与应用', 'BASE 5 + APPS 8。无用户组件分组。')}
      {fig('PC装修-画布.png', 'PC装修-画布-三栏门户', '左最热话题；中 slot-hint；右发帖/快捷（互动荣誉活动今日点赞积分关怀）/公告条/企业内刊/积分榜。左右轨道按钮收起侧栏。')}
      {fig('PC装修-右侧空态.png', 'PC装修-右侧-空提示', '未选组件且非页面设置时：「请选择预览区中的组件或从左侧添加」。')}

      <h4>组件截图与需求描述</h4>
      {fig('PC装修-文章-画布.png', 'PC装修-画布-文章', 'placeArticle 后中栏文章卡，操作复制/删除。复制按钮无绑定。')}
      {fig('PC装修-文章-组件设置.png', 'PC装修-文章-组件设置', 'Tab「组件设置」。样式 PC 用 title/big/cols/left（无 two/slide）。')}
      {fig('PC装修-页面设置.png', 'PC装修-页面设置-背景', '背景颜色 color + 重置；背景图片缩略图、更换、清除。')}
      {fig('PC装修-公告-画布.png', 'PC装修-画布-公告', 'noticeText 默认「本周五下午工会活动报名截止」。')}
      {fig('PC装修-公告-组件设置.png', 'PC装修-公告-组件设置', '内容 max 60；滚动播放、显示图标默认 on。')}
      {fig('PC装修-与我相关-画布.png', 'PC装修-画布-与我相关', '积分/报名活动/待填问卷默认开，考试默认关。')}
      {fig('PC装修-与我相关-组件设置.png', 'PC装修-与我相关-显示内容', '文案「最多同时开启 3 项」。')}
      {fig('PC装修-调查问卷-右侧配置.png', 'PC装修-调查问卷-组件设置', '与 H5 问卷字段同构。')}
      {fig('PC装修-活动-右侧配置.png', 'PC装修-活动-组件设置', '默认大图 3 条，字段集与 H5 活动一致。')}
      {fig('PC装修-精彩瞬间-右侧配置.png', 'PC装修-精彩瞬间-组件设置', '默认 cols、5 条。')}
      {fig('PC装修-兴趣圈-右侧配置.png', 'PC装修-兴趣圈-组件设置', '无跳转链接。')}
      {fig('PC装修-投票-右侧配置.png', 'PC装修-投票-组件设置', '默认 left、99。')}
      {fig('PC装修-保存Toast.png', 'PC装修-顶栏-保存Toast', 'btnSave → toast「已保存」约 1.8s。不写存储。')}

      <h4>组件显示逻辑</h4>
      {table(
          ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
          [
              ['PC装修-画布-插槽提示', 'hint', '可见', '任一中栏组件显示则 hidden', '—', 'DOM', 'updateSlot', '引导文案', '无'],
              ['PC装修-右侧-空提示', 'empty', '可见', 'rightTab=page 或已选组件则藏', '—', 'selected', 'showRight', '提示添加', '无'],
              ['PC装修-工作台-左右栏', '侧栏', '展开', 'toggleLeft/Right 加 left-off/right-off', '始终', 'studio class', '栅格列变 0', '无', '无'],
              ['PC装修-与我相关-开关', 'switch', '积分/活动/问卷 on，考试 off', '始终显示四开关', 'relatedOnCount()>=3 时再开第 4 项拦截', '开关 class', '预览条目', '全关仍有卡片', '无'],
              ['PC装修-组件库-轮播图等', '按钮', '可见', '始终', '点击 toast 占位', 'BASE/APPS', '无画布块', 'toast', '无'],
          ],
      )}

      <h4>字段说明</h4>
      {table(
          ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
          [
              ['公告内容', 'PC装修-公告-公告内容', 'text', '否', '本周五下午工会活动报名截止', 'max 60', '—', '滚动条文案'],
              ['滚动播放', 'PC装修-公告-显示设置', 'switch', '否', 'on', '无', 'on 加 class scroll', '跑马灯'],
              ['显示图标', 'PC装修-公告-显示设置', 'switch', '否', 'on', '无', 'on/off', '喇叭图标'],
              ['背景颜色', 'PC装修-页面设置-背景颜色', 'color', '否', '#0f5c49', '无', '色盘', 'pc-stage 背景'],
              ['背景图片', 'PC装修-页面设置-背景图片', 'file image/*', '否', '空', '选文件即 ObjectURL', '本地图', 'cover 铺满，刷新丢失'],
          ],
      )}

      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['保存', 'PC装修-顶栏-保存', '#btnSave', '无', '始终', '点击', 'toast 已保存', '无持久化', 'Toast 1.8s', '无失败分支', '无接口'],
              ['返回', 'PC装修-顶栏-返回', '#btnBack', '无', '始终', '点击', 'history.back 或 href PC页面装修.html', '离开工作室', '无', '嵌入后台时可能 404', todo],
              ['收起左/右栏', 'PC装修-画布-轨道按钮', '#toggleLeft/#toggleRight', '无', '始终', '点击', 'studio class', '箭头文字切换', '无', '无', '无'],
              ['添加文章', 'PC装修-组件库-文章', '.comp[data-name=文章]', '无', '始终', '点击', 'placeArticle', '中栏显示、选中', '无', '无', '无'],
              ['重置背景色', 'PC装修-页面设置-重置', '#pageBgReset', '无', '始终', '点击', '色回 #0f5c49', '清图片后仍用色', '无', '无', '无'],
              ['清除背景图', 'PC装修-页面设置-清除', '#bgClear', '有缩略图', '始终可点', '点击 ×', '清 backgroundImage', '回纯色', '无', '无', '无'],
              ['开启第 4 项', 'PC装修-与我相关-显示内容', '第四个 switch', '已开 3 项', 'relatedOnCount>=3 拦截', '再开一项', 'toast 后 return', '开关不变', '无', '最多同时开启 3 项', '无'],
          ],
      )}

      <h4>交互规则</h4>
      <p>PC 组件库为 click 放置，无 drag。复制按钮无逻辑。课程/轮播/图片/图文导航/图文列表只 toast。保存不发布到员工端 React 页（C 端门户另实现）。</p>
      <h4>校验规则</h4>
      <p>公告 60 字。背景图类型由 accept=image/* 限制，无尺寸校验。</p>
      <h4>异常/空状态</h4>
      <p>未选组件：右侧空提示。中栏无组件：slot-hint。</p>
      <h4>权限/状态控制</h4>
      <p>无。</p>
      <h4>验收标准</h4>
      <p>Given PC装修，When 点文章，Then 中栏文章出现且右侧组件设置。<br>
      Given 点保存，When 点击，Then toast「已保存」且刷新后配置不保留。<br>
      Given 页面设置改背景色，When input，Then pc-stage 背景立即变。</p>
    </article>
  </section>
''')

    a.append(f'''
  <section id="data-fields">
    <h2>7. 数据字段与枚举</h2>
    {table(
        ['枚举/常量', '取值'],
        [
            ['H5 GROUPS.基础组件', '公告栏、菜单导航、宫格导航、列表导航、弹窗广告、悬浮按钮、常用应用、图标、图片展示、轮播图、标题栏、视频播放、分割线、广告魔方、热区'],
            ['H5 GROUPS.用户组件', '用户卡片、用户服务、用户互动、荣誉组件、用户组织'],
            ['H5 GROUPS.应用组件', '文章、调查问卷、课程、活动、精彩瞬间、兴趣圈、投票'],
            ['PC BASE', '轮播图、图片、图文导航、图文列表、公告'],
            ['PC APPS', '与我相关、文章、调查问卷、课程、活动、兴趣圈、精彩瞬间、投票'],
            ['文章样式 STYLES', 'title 标题列表、big 大图、two 一行两列（H5）、left 左图右文、right 左文右图（H5）、slide 横向滑动（H5）、cols 三列（PC 应用块）'],
            ['板块 PLATES', '企业动态、知识库、劳模风采'],
            ['文章 picker 状态', 'all / on 已发布 / off 未发布'],
            ['活动 picker life', '全部 / 未结束 / 已结束'],
            ['活动 picker 发布', '已发布 / 未发布'],
            ['活动跳转 jumpLink', 'activity 活动、ig 兴趣圈活动'],
            ['瞬间跳转', '活动-精彩瞬间、兴趣圈-精彩瞬间'],
            ['SVC_ITEMS', '福利申领、客服中心、收货地址、我的收藏、我的报名、我的LIFE、我的问卷、我的课程、我的建言、我的活动、我的考试'],
            ['用户展示', '陈产品 / 产品管理员'],
        ],
    )}
    <p>文章 picker 树：全部文章 / 企业动态（通知公告、企业文化）/ 知识库（制度流程、业务知识）/ 劳模风采（劳模事迹）。活动分类 mock：文化、体育、培训、公益、团建；兴趣圈侧运动健身等。</p>
  </section>

  <section id="apis">
    <h2>8. API / 数据接口清单</h2>
    <p>装修 HTML 与 picker <strong>无</strong> <code>fetch</code> / axios / form action / WebSocket。数据均为脚本常量或内存 <code>appState</code>。</p>
    {table(
        ['接口用途', '方法', '路径', '触发场景', '请求参数', '响应字段', '是否真实接口', '备注'],
        [
            ['嵌入装修页', 'GET（静态）', '/decoration/h5.html、/decoration/pc.html、article-picker.js、activity-picker.js', 'HtmlStudioPage iframe', 'rev 查询防缓存', 'HTML/JS', '静态资源', '非业务 API'],
            ['保存装修', '—', '—', 'PC 保存按钮', '—', '—', '否', todo + ' 建议 POST 页面 JSON'],
            ['文章列表', '—', '—', '选择文章弹窗', '分类/标题/状态/分页', 'CATALOG 8 条', '否', '建议 CMS 文章检索'],
            ['活动列表', '—', '—', 'activity/moments picker', '来源活动或兴趣圈活动、分类、发布、生命周期', 'ACTIVITY_CATALOG + IG mock', '否', '建议复用活动/兴趣圈查询'],
        ],
    )}
  </section>

  <section id="non-functional">
    <h2>9. 非功能需求</h2>
    <ul>
      <li>工作室 <code>html,body overflow:hidden</code>；PC 中栏可滚，画布宽 1080。</li>
      <li>H5 画布固定 375，非真实设备适配。</li>
      <li>iframe title「H5装修」「PC装修」。picker 有 dialog aria-labelledby。</li>
      <li>背景图用 blob URL，无上传安全扫描 {todo}。</li>
      <li>无审计日志、无并发锁、无版本回滚 {todo}。</li>
    </ul>
  </section>

  <section id="analytics">
    <h2>10. 埋点与指标建议</h2>
    <p><span class="status">建议补充</span> 代码无埋点。</p>
    {table(
        ['事件名称', '触发动作', '关键属性', '业务目的'],
        [
            ['studio_open', '进入 H5/PC 装修', 'surface=h5|pc', '使用率'],
            ['widget_place', '放置组件', 'widget_id', '组件采用'],
            ['widget_delete', '删除区块', 'widget_id', '弃用'],
            ['picker_confirm', '选择器确定', 'kind, count', '内容配置深度'],
            ['studio_save', '点保存', 'surface，是否有脏数据', '发布转化（现无真实保存）'],
        ],
    )}
  </section>

  <section id="acceptance">
    <h2>11. 验收标准</h2>
    <ol>
      <li>Given 工作台菜单，When 点 H5装修，Then iframe 出现三栏工作室且默认文章选中。</li>
      <li>Given H5 组件库，When 拖「荣誉组件」到手机，Then 荣誉区块显示且右侧可开关积分/勋章。</li>
      <li>Given 活动自定义，When 打开选择器，Then 可见 mock 活动标题（如春季员工开放日）。</li>
      <li>Given PC 点轮播图，When 点击，Then toast「「轮播图」为基础组件占位」。</li>
      <li>Given PC 保存，When 点击，Then toast「已保存」且无网络请求。</li>
      <li>Given 侧栏，When 在 H5/PC 间切换，Then 对应 iframe src 切换且壳菜单高亮正确。</li>
    </ol>
  </section>

  <section id="risks">
    <h2>12. 风险与待确认问题</h2>
    <ul>
      <li>产品名：侧栏叫「工作台」，本文按用户口令记为员工应用后台。对外名称 {todo}。</li>
      <li>H5 无保存；PC 保存空转。与员工端 React 门户是否同源 {todo}。</li>
      <li>大量基础/用户组件仅图标，易被当成已交付。</li>
      <li>上移/下移/复制、页面设置、悬浮按钮、问卷跳转、添加调查问卷未接线。</li>
      <li>兴趣圈无跳转；投票/兴趣圈无来源下拉。</li>
      <li>PC 返回链到独立 HTML 文件名，后台 hash 路由下行为 {todo}。</li>
      <li>与我相关：第 4 项开启 toast「最多同时开启 3 项」并 return（{impl}）。</li>
      <li>组织管理员工/部门页仍是 PlaceholderPage，不在本次范围。</li>
    </ul>
  </section>
''')
    return '\n'.join(a)


def main() -> None:
    g.write_prd('employee-app', '员工应用后台-PRD.html', '员工应用后台 产品需求文档', TOC, body())


if __name__ == '__main__':
    main()
