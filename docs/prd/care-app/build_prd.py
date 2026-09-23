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
    ('overview-page', '6.1 概览'),
    ('rules', '6.2 关怀规则'),
    ('rule-form', '6.3 新建/编辑规则'),
    ('records', '6.4 关怀记录'),
    ('templates', '6.5 关怀模板'),
    ('settings', '6.6 关怀设置'),
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
      <li>文档来源：基于现有 React/TypeScript（<code>src/features/care</code>）反向分析（html-to-prd）。数据层为内存 mock（<code>careStore.ts</code>），无 HTTP。</li>
      <li>分析范围：<strong>仅后台</strong>。应用键 <code>care</code>，顶栏「员工关怀」。页面：概览、关怀规则、新建/编辑规则、关怀记录、关怀模板、关怀设置。不含员工端「我的关怀」（<code>#/c/pc/profile/care</code>）。</li>
      <li>生成日期：2026-09-22。</li>
      <li>2026-09-22 增量（今日改动，本稿重点）：① 新建规则隐藏「节气关怀」：<code>DEFERRED_CREATE_TYPES=['节气关怀']</code>，<code>sceneSelectOptions(..., hideDeferred: mode==='create')</code>；hash <code>#/care/care-rule-create/节气关怀</code> 视为延迟类型，回落到「节日关怀」。② 关怀记录筛选项去掉「发送人」（页面无「请输入发送人姓名」）；列表仍保留发送人列；数据源固定筛 <code>source==='系统关怀'</code>。③ 「同事祝福」列 <code>align:'right'</code> + 单元格 <code>justify-content:flex-end</code>；副标题改为「查看系统发送的关怀，以及同事祝福次数。」。</li>
      <li>可信度：表单、筛选、下拉、列对齐以页面与测试（<code>CarePages.test.tsx</code>、<code>care.test.ts</code>）为准（{impl}）。真实推送/天气/考勤/权限 {todo}。</li>
      <li>组件命名一律 <code>页面-模块-组件名称</code>。</li>
      <li>标记：{impl} {guess} {todo}</li>
    </ul>
  </section>

  <section id="overview">
    <h2>2. 产品概述</h2>
    <p><strong>产品定位：</strong>员工关怀后台。运营配置个人/固定日期/事件三类关怀规则，绑定贺卡模板，查看系统发出的关怀记录与同事祝福次数，并维护展示名单与同事关怀表情。</p>
    <p><strong>目标用户：</strong>原型顶栏固定「陈产品 / 产品管理员」。RBAC {todo}。</p>
    <p><strong>核心使用场景：</strong>① 按场景新建规则（本期新建不可选节气）；② 已有节气规则仍可编辑；③ 筛查系统关怀发送结果并点开同事祝福明细；④ 维护模板与设置。</p>
    <p><strong>页面/系统主要价值：</strong>把节日/生日等自动关怀做成可配置规则，而不是一次性群发。当前为可交互原型，保存仅写内存 store。</p>
  </section>

  <section id="ia">
    <h2>3. 页面结构 / 信息架构</h2>
    {fig('员工关怀-左侧菜单.png', '员工关怀-导航-左侧菜单', '侧栏五项：概览、关怀规则、关怀记录、关怀模板、关怀设置。高亮随 hash。')}
    <ul>
      <li>页面清单：<code>#/care/care-overview</code>、<code>care-rules</code>、<code>care-rule-create</code>[/<code>类型</code>]、<code>care-rule-edit/:id</code>、<code>care-records</code>、<code>care-templates</code> 及模板新建/编辑/详情、<code>care-settings</code>。</li>
      <li>兼容旧 hash：<code>care-info</code>→概览，<code>care-plans</code>→规则，<code>care-types</code>→设置。</li>
      <li>规则列表 Tab 写入 <code>?tab=个人关怀|固定日期关怀|事件关怀</code>。</li>
      <li>组件命名规则：所有组件描述必须使用 <code>页面-模块-组件名称</code>。</li>
    </ul>
  </section>

  <section id="implemented-features">
    <h2>4. 已实现功能清单</h2>
    {table(
        ['模块', '功能点', '功能说明', '页面/区域', '状态'],
        [
            ['壳层', '菜单', '员工关怀五叶子菜单', '员工关怀-导航-左侧菜单', impl],
            ['概览', '完善度+运营 KPI', '生日/入职/入党档案完善；规则/模板/发送记录统计', '概览-人员信息完善 / 运营数据', impl],
            ['规则列表', '分类 Tab + CRUD', '个人/固定日期/事件；新建/编辑/启停/删除', '关怀规则-列表表格', impl],
            ['规则表单', '场景联动', '节日/周年/天气/强度等动态字段；保存走 validateRuleDraft', '新建规则-规则设置', impl],
            ['规则表单', '节气延迟开放', '新建下拉不含节气；编辑下拉仍含节气；URL 节气回落节日', '新建规则-场景下拉', impl],
            ['记录', '系统关怀列表', '仅系统关怀；筛选无发送人；同事祝福右对齐可点开抽屉', '关怀记录-查询筛选 / 列表表格', impl],
            ['记录', '导出 CSV', '前端 Blob 下载「关怀记录.csv」，含发送人列', '关怀记录-工具栏-导出', impl],
            ['模板', '分类卡片', '按 CARE_CATEGORIES 分 Tab；占用中的模板不可删', '关怀模板-页面整体', impl],
            ['设置', '名单+表情', '隐藏高管；同事关怀表情 CRUD/排序', '关怀设置-页面整体', impl],
        ],
    )}
  </section>

  <section id="flows">
    <h2>5. 用户流程</h2>
    <h3>新建规则（含今日节气约束）</h3>
    <ol>
      <li>关怀规则 Tab 点「新建」→ <code>onNavigate('care-rule-create', defaultCreateType(category, rules))</code>。</li>
      <li>打开「关怀场景」下拉：固定日期组仅「节日关怀」「其他」，无「节气关怀」。</li>
      <li>若直接打开 <code>#/care/care-rule-create/节气关怀</code>：<code>isDeferredCreateType</code> 为真，忽略该类型，表单默认「节日关怀」。</li>
      <li>填主题、场景专属字段、模板后点保存；校验失败 <code>message.error</code>；成功 toast「关怀规则已创建并启用」并返回列表。</li>
    </ol>
    <h3>编辑已有节气规则</h3>
    <ol>
      <li>编辑页 <code>hideDeferred</code> 为 false，下拉仍展示「节气关怀」。</li>
      <li>选中节气时出现「具体节气」磁贴（<code>solarTermRadioOptions</code>）。mock 种子无节气规则行；模板 t6「冬至安康」类型为节气。</li>
    </ol>
    <h3>查看系统关怀与同事祝福</h3>
    <ol>
      <li>进入关怀记录：副标题说明系统发送 + 祝福次数；筛选项无发送人。</li>
      <li>次数&gt;0 显示右对齐链接数字，点击打开「{{姓名}}的同事祝福」抽屉；为 0 显示文本 0，不可点。</li>
      <li>导出当前筛选结果 CSV（UTF-8 BOM）。</li>
    </ol>
  </section>
''')

    a.append(f'''
  <section id="page-requirements">
    <h2>6. 页面级需求说明</h2>

    <article class="page-requirement" id="overview-page">
      <h3>6.1 概览</h3>
      <h4>页面目标</h4>
      <p>展示档案完善度与所选日期范围内的规则/模板/发送概况。</p>
      <h4>页面布局</h4>
      {fig('后台-概览-页面整体.png', '概览-页面布局-页面整体', '标题「概览」；上人员信息完善，下运营数据。')}
      {fig('后台-概览-人员信息完善.png', '概览-人员信息完善-三卡', '生日信息 / 入职时间 / 入党时间：已设置人数、未完善人数、比例进度条。文案「按当前档案，不随日期变化」。')}
      <h4>组件显示逻辑</h4>
      {table(
          ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
          [
              ['概览-人员信息完善-三卡', 'Card×3', '始终显示', '始终', '始终', 'completionStats(employees)', 'percent 100 时 Progress success', '无单独空态', '无'],
              ['概览-运营数据-日期范围', 'DateRange', 'defaultCareOverviewDateRange', '始终', '始终', '本地 state', '改范围重算 scopedRecords', '无', '无'],
              ['概览-最新记录-查看', '链接按钮', '每行显示', '始终', '始终', 'onNavigate 关怀记录页', '跳转记录页，不带行 id', '无', '无'],
          ],
      )}
      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['查看记录', '概览-最新记录-查看', 'Button type=link', '有行', '始终', '点击', 'onNavigate 到 care-records', '切记录页', '无 toast', '无', '无 API'],
          ],
      )}
      <h4>验收标准</h4>
      <p>Given 概览，When 改日期，Then 仅发送记录统计变化，人员完善卡不变。</p>
    </article>

    <article class="page-requirement" id="rules">
      <h3>6.2 关怀规则</h3>
      <h4>页面目标</h4>
      <p>按三类场景管理规则生命周期。</p>
      <h4>页面布局</h4>
      {fig('后台-关怀规则-页面整体.png', '关怀规则-页面布局-页面整体', '副标题覆盖个人、固定日期及天气、工作强度。默认 Tab「个人关怀」。')}
      {fig('后台-关怀规则-查询筛选.png', '关怀规则-查询筛选-搜索区', '字段：关怀主题、规则状态（全部/已启用/未启用/已过期）。查询/重置。无发送人。')}
      {fig('后台-关怀规则-列表表格.png', '关怀规则-列表表格-数据表', '列：主题（链到编辑）、场景、规则状态 Tag、具体场景、关联模板、规则时效、推送时间、关怀积分（天气显示 —）、操作。')}
      <h4>字段说明</h4>
      {table(
          ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
          [
              ['关怀主题', '关怀规则-查询筛选-关怀主题', 'Input', '否', '空', 'includes 模糊', '自由文本', '筛 name'],
              ['规则状态', '关怀规则-查询筛选-规则状态', 'Select', '否', 'all', '无', '全部/已启用=执行中/未启用=未开始/已过期', '筛 displayRuleStatus'],
          ],
      )}
      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['新建', '关怀规则-工具栏-新建', 'primary Button', '无', '始终', '点击', '带 defaultCreateType 进创建页', '打开表单', '无', '无', '无 API'],
              ['停用/启用', '关怀规则-行操作-启停', '更多菜单', '非已过期', '已过期不出现该项', '确认弹窗', 'setRuleStatus 执行中↔未开始', 'Tag 文案切换已启用/未启用', 'toast 已停用/已启用', '取消无变化', '内存 store'],
              ['删除', '关怀规则-行操作-删除', '危险项', '无', '始终', '确认删除', 'removeRule', '行消失', 'toast 已删除', '取消无变化', '内存；文案：历史记录不受影响'],
          ],
      )}
      <h4>验收标准</h4>
      <p>Given 固定日期 Tab，When 点新建，Then 创建页场景可选节日/其他，不可选节气。</p>
    </article>

    <article class="page-requirement" id="rule-form">
      <h3>6.3 新建/编辑规则</h3>
      <h4>页面目标</h4>
      <p>配置触发场景、推送时间并关联模板。今日约束：新建不开放节气。</p>
      <h4>页面布局</h4>
      {fig('后台-新建规则-表单页.png', '新建规则-页面布局-表单页', '面包屑 员工关怀 &gt; 关怀规则 &gt; 新建规则。标题「新建关怀规则」。单卡「规则设置」。')}
      {fig('后台-新建规则-规则设置.png', '新建规则-规则设置-表单卡', '默认场景节日关怀；关怀主题计数 50；具体节日磁贴；规则时效/推送/积分/模板。')}
      {fig('后台-新建规则-场景下拉.png', '新建规则-规则设置-场景下拉', '分组：个人关怀（生日/周年庆/入党）、固定日期关怀（节日关怀、其他）、事件关怀（天气、工作强度）。固定日期组无「节气关怀」。')}
      {fig('后台-新建规则-节气URL回落.png', '新建规则-规则设置-节气URL回落', '打开 create/节气关怀 后场景仍为节日关怀，出现「具体节日」而非「具体节气」。')}
      {fig('后台-新建规则-节气URL场景下拉.png', '新建规则-规则设置-节气URL场景下拉', '即便 URL 带节气，下拉仍 hideDeferred，无节气选项。')}
      {fig('后台-编辑规则-节日页.png', '编辑规则-规则设置-节日页', '编辑 r4 等已有节日规则。保存文案「关怀规则已更新」。')}
      {fig('后台-编辑规则-场景下拉含节气.png', '编辑规则-规则设置-场景下拉含节气', 'mode=edit 时固定日期组含「节气关怀」。代码注释：本期新建不开放；编辑已有规则仍保留当前类型。')}
      <h4>组件显示逻辑</h4>
      {table(
          ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
          [
              ['新建规则-规则设置-场景下拉', 'Select 分组', '节日关怀', '始终', '生日/入党若已占用则 disabled 并标（已配置）', 'SCENE_OPTIONS 过滤 DEFERRED', 'onChange 清空模板与场合字段', '无', 'create 隐藏节气'],
              ['新建规则-规则设置-具体节日', '磁贴单选', '节日类型显示', 'type===节日关怀', '已配置节日 disabled', 'festivalRadioOptions', '写入 festival', '必填提示请选择一个具体节日', '每节日仅一次'],
              ['编辑规则-规则设置-具体节气', '磁贴', '仅 type===节气关怀', '选节气后显示', '已配置节气 disabled', 'solarTermRadioOptions', '写入 solarTerm', '请选择一个具体节气', '新建路径不可达除非改类型（编辑）'],
              ['新建规则-规则设置-开启同事祝福', 'Switch', '关', 'isPersonalType', '始终', 'coworkerEnabled', '开则显示范围与祝福推送时间', '无', '仅个人关怀'],
          ],
      )}
      <h4>字段说明</h4>
      {table(
          ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
          [
              ['关怀场景', '新建规则-规则设置-关怀场景', 'Select', '是', '节日关怀（create）；URL 延迟类型忽略', 'required', '见 CARE_TYPES，新建排除节气', '决定后续字段'],
              ['关怀主题', '新建规则-规则设置-关怀主题', 'Input', '是', '常等于类型名', 'required max 50', '自由文本', '列表展示名'],
              ['周年数', '新建规则-规则设置-周年数', 'Select', '周年庆时是', '无', '1–20，已配置 disabled', 'N周年', '按入职日触发'],
              ['具体节日', '新建规则-规则设置-具体节日', 'CareFestivalPicker', '节日时是', '无', '恰好 1 个且未占用', '中外节日常量', '每年日历执行'],
              ['具体节气', '编辑规则-规则设置-具体节气', 'CareOptionTiles', '节气时是', '无', '恰好 1 个且未占用', 'SOLAR_TERM_DEFS', '本期仅编辑可达'],
              ['开启同事祝福', '新建规则-规则设置-开启同事祝福', 'Switch', '否', 'false', '个人类型才渲染', 'on/off', '是否邀请同事送祝福'],
          ],
      )}
      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['保存新建', '新建规则-底栏-保存', 'primary Button', '表单可提交', '始终可点，校验在 submit', '点击', 'validateFields + validateRuleDraft + saveRule', 'status 默认执行中', 'toast 已创建并启用', 'message.error 校验文案', '内存；无 HTTP'],
              ['返回', '新建规则-底栏-返回', 'Button', '无', '始终', '点击', 'onBack', '回规则列表', '无', '未保存丢失 {impl}', '无'],
          ],
      )}
      <h4>交互规则</h4>
      <ul>
        <li>新建：<code>hideDeferred: true</code> 从下拉剔除 <code>DEFERRED_CREATE_TYPES</code>。</li>
        <li>createType：<code>isCareType(recordId) &amp;&amp; !isDeferredCreateType(recordId)</code> 才采纳 URL 类型；否则节日关怀。若该唯一场景已占用，改用 <code>defaultCreateType</code>。</li>
        <li>切场景会清空 templateKeys、occasion、festival、solarTerm、天气/强度场景。</li>
        <li>编辑页仍列出节气，便于维护历史规则；种子规则列表无节气行，模板 t6 仍为节气类型。</li>
      </ul>
      <h4>校验规则</h4>
      <p>见 <code>validateRuleDraft</code>：主题非空、至少一模板、生日/入党全局唯一、周年数不重复、节日/节气单选且不重复、其他时效日期格式、天气/强度各单选一场景。</p>
      <h4>验收标准</h4>
      <p>Given 新建页，When 打开场景下拉，Then 无「节气关怀」。Given URL 带节气，When 进入创建，Then 场景=节日关怀。Given 编辑页，When 打开下拉，Then 含「节气关怀」。</p>
    </article>

    <article class="page-requirement" id="records">
      <h3>6.4 关怀记录</h3>
      <h4>页面目标</h4>
      <p>只读查看系统发出的关怀，并统计同事祝福次数。今日：去掉发送人筛选项；祝福数列右对齐。</p>
      <h4>页面布局</h4>
      {fig('后台-关怀记录-页面整体.png', '关怀记录-页面布局-页面整体', '副标题「查看系统发送的关怀，以及同事祝福次数。」无用户关怀 Tab。')}
      {fig('后台-关怀记录-查询筛选.png', '关怀记录-查询筛选-搜索区', '展开后字段：关怀主题、接收人、部门、关怀积分、发送日期、发送状态。无「发送人」、无「请输入发送人姓名」。')}
      {fig('后台-关怀记录-列表表格.png', '关怀记录-列表表格-数据表', '列含发送人（系统）、积分右对齐、同事祝福右对齐（2/1 为链接，0 为文本）。发送状态列在表更右侧，需横向滚动。')}
      {fig('后台-关怀记录-同事祝福抽屉.png', '关怀记录-同事祝福-抽屉', '标题「{{接收人}}的同事祝福」；摘要「主题 · 共 N 次」；列：发送人、部门、祝福内容、发送时间。空态「暂无同事祝福」。')}
      <h4>组件显示逻辑</h4>
      {table(
          ['组件路径', '组件类型', '默认状态', '显示/隐藏逻辑', '启用/禁用逻辑', '数据来源', '状态变化', '空/错/加载状态', '权限/条件控制'],
          [
              ['关怀记录-查询筛选-发送人', '已移除', '不渲染', '代码无 SearchField 发送人', '—', 'RecordQuery.sender 仍存在但页面恒为空串', 'filterRecords 的 sender 条件实际不生效', '—', '今日改动'],
              ['关怀记录-列表表格-发送人列', 'Table 列', '显示', '始终', '不可筛', 'record.sender', '仅展示', '无', '导出 CSV 仍含发送人'],
              ['关怀记录-列表表格-同事祝福', '数字/链接', '右对齐', '始终', 'count=0 纯文本；&gt;0 Button link', 'colleagueBlessingsFor(id).length', '点击打开抽屉', '0 显示 0', '用户关怀行不进本页'],
              ['关怀记录-列表表格', 'Table', '系统关怀全量', 'rows.filter source===系统关怀', '导出在 filtered.length=0 时 disabled', 'useRecords mock', '查询写入 query 后重算', '无查询：暂无关怀记录；有查询：没有符合条件的关怀记录', '无'],
          ],
      )}
      <h4>字段说明</h4>
      {table(
          ['字段名称', '组件路径', '控件类型', '是否必填', '默认值', '校验规则', '选项值', '业务含义'],
          [
              ['关怀主题', '关怀记录-查询筛选-关怀主题', 'Input', '否', '空', 'includes', '—', '筛 ruleName'],
              ['接收人', '关怀记录-查询筛选-接收人', 'Input', '否', '空', 'includes 姓名', '—', '筛 name'],
              ['部门', '关怀记录-查询筛选-部门', 'Select', '否', '空', '精确匹配', '系统关怀行去重部门', '筛 department'],
              ['关怀积分', '关怀记录-查询筛选-关怀积分', 'InputNumber', '否', '空', 'min 0 整数，字符串相等匹配', '—', '筛 points'],
              ['发送日期', '关怀记录-查询筛选-发送日期', 'DatePicker', '否', '空', 'pushTime startsWith YYYY-MM-DD', '—', '按日'],
              ['发送状态', '关怀记录-查询筛选-发送状态', 'Select', '否', 'all', '无', '全部/已发送', '选项仅已发送，无失败态'],
          ],
      )}
      <h4>列表列</h4>
      {table(
          ['列名', '组件路径', '数据含义', '格式', '是否可排序', '是否可筛选', '行操作'],
          [
              ['关怀主题', '关怀记录-列表表格-关怀主题', 'ruleName', '省略号', '否', '查询区', '无'],
              ['发送人', '关怀记录-列表表格-发送人', 'sender', '文本', '否', '否（今日去掉筛选项）', '无'],
              ['接收人', '关怀记录-列表表格-接收人', 'name', '文本', '否', '查询区', '无'],
              ['部门', '关怀记录-列表表格-部门', 'department', '文本', '否', '查询区', '无'],
              ['关怀内容', '关怀记录-列表表格-关怀内容', 'content', '省略号', '否', '否', '无'],
              ['关怀积分', '关怀记录-列表表格-关怀积分', 'points', '右对齐', '否', '查询区', '无'],
              ['同事祝福', '关怀记录-列表表格-同事祝福', '祝福条数', '右对齐；&gt;0 链接', '否', '否', '打开抽屉'],
              ['发送时间', '关怀记录-列表表格-发送时间', 'pushTime', '日期时间', '否', '按日', '无'],
              ['发送状态', '关怀记录-列表表格-发送状态', 'status', '文本', '否', '查询区', '无'],
          ],
      )}
      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['查询', '关怀记录-查询筛选-查询', 'SearchPanel onSearch', '无', '始终', '点击查询', 'draft→query', '表格刷新；工具栏「共找到 n / m」', '无', '空表 Empty', '无 API'],
              ['重置', '关怀记录-查询筛选-重置', 'onReset', '无', '始终', '点击', 'draft/query 回 EMPTY（source 仍系统关怀）', '全量系统行', '无', '无', '无'],
              ['查看祝福', '关怀记录-列表表格-同事祝福', 'aria-label 查看{{名}}的同事祝福', 'count&gt;0', '0 不可点', '点击数字', 'setBlessingRecord', '抽屉宽 720', '无 toast', '空抽屉 Empty', '内存 colleagueBlessingsFor'],
              ['导出', '关怀记录-工具栏-导出', 'Download Button', 'filtered.length&gt;0', '空结果 disabled', '点击', 'CSV Blob 下载', '无行变化', 'toast 已导出关怀记录', '无失败分支', '无服务端接口'],
          ],
      )}
      <h4>交互规则</h4>
      <ul>
        <li>页面强制 <code>source: '系统关怀'</code>。用户关怀 mock 行（如赵宁）不出现；测试断言无「用户关怀」、无「查看赵宁的同事祝福」。</li>
        <li>同事祝福单元格 <code>display:flex; justify-content:flex-end</code>，与积分列同为右对齐。</li>
        <li><code>filterRecords</code> 仍读取 <code>query.sender</code>，但 UI 不提供输入，恒为空。</li>
      </ul>
      <h4>验收标准</h4>
      <p>Given 记录页，When 查看筛选，Then 无发送人输入。Given 有祝福的行，When 看「同事祝福」列，Then 数字靠右且可点开抽屉。Given 无祝福行，Then 显示 0 且无按钮。</p>
    </article>

    <article class="page-requirement" id="templates">
      <h3>6.5 关怀模板</h3>
      <h4>页面目标</h4>
      <p>按三类场景维护消息推送与贺卡（个人类型另含同事祝福消息推送）。</p>
      {fig('后台-关怀模板-页面整体.png', '关怀模板-页面布局-页面整体', '副标题「统一配置消息推送与贺卡内容。」Tab 个人/固定日期/事件；卡片封面 1068/455；新建模板。')}
      <h4>操作说明</h4>
      {table(
          ['操作名称', '组件路径', '触发元素', '前置条件', '启用/禁用逻辑', '用户动作', '系统响应', '状态变化', '成功反馈', '失败反馈', '跳转/接口'],
          [
              ['删除模板', '关怀模板-卡片-删除', '确认框', '未被规则引用', '占用则 warning 不删', '确认', 'removeTemplate', '卡片消失', 'toast 已删除', '占用：「请先从规则中移除」', '内存'],
          ],
      )}
      <p>模板表单/详情本次未逐控件截图；行为以 <code>CareTemplateFormPage</code> 为准：封面→标题→副标题顺序；个人模板含「同事祝福消息推送」Tab。{guess} 生产需对象存储。</p>
    </article>

    <article class="page-requirement" id="settings">
      <h3>6.6 关怀设置</h3>
      {fig('后台-关怀设置-页面整体.png', '关怀设置-页面布局-页面整体', 'Tab：名单展示设置、同事关怀表情。表情表操作含上移/下移，无单独「排序」按钮。')}
      <p>名单可隐藏高管并勾选人员（TreeSelect mock 组织）。表情图片使用共享 1:1 上传提示。持久化 {todo}（仅内存）。</p>
    </article>
  </section>
''')

    a.append(f'''
  <section id="data-fields">
    <h2>7. 数据字段与枚举</h2>
    <ul>
      <li>CARE_TYPES：生日关怀、周年庆关怀、入党关怀、节日关怀、<strong>节气关怀</strong>、其他、天气关怀、工作强度关怀。</li>
      <li>DEFERRED_CREATE_TYPES：节气关怀（仅新建隐藏）。</li>
      <li>CARE_CATEGORIES：个人关怀、固定日期关怀、事件关怀。</li>
      <li>RULE_STATUSES：执行中、未开始、已过期（列表 Tag：已启用 / 未启用 / 已过期）。</li>
      <li>RECORD_SOURCES：系统关怀、用户关怀（记录页只展示前者）。</li>
      <li>PUSH_OFFSETS：前一天、当天。同事祝福偏移：提前1/2/3天、当天。</li>
      <li>WEATHER_SCENES / WORK_SCENES / WARNING_LEVELS：见 <code>care.ts</code> 常量。</li>
    </ul>
  </section>

  <section id="apis">
    <h2>8. API / 数据接口清单</h2>
    <p>代码中无 <code>fetch</code> / <code>axios</code>。{impl} 全部为 <code>careStore</code> 内存。</p>
    {table(
        ['接口用途', '方法', '路径', '触发场景', '请求参数', '响应字段', '是否真实接口', '备注'],
        [
            ['规则/记录/模板 CRUD', '—', '—', '保存/删除/导出', '—', '—' ,'否', '建议后续提供 REST；导出目前纯前端 CSV'],
            ['天气查询 / 考勤超时', '—', '—', '事件关怀触发', '—', '—', '否', todo + ' 推送文案写死每日 06:00、15:00、21:00 与 T+1'],
        ],
    )}
  </section>

  <section id="non-functional">
    <h2>9. 非功能需求</h2>
    <ul>
      <li>后台桌面宽度截图 1440；表格横向滚动（记录 scroll.x=1480）。</li>
      <li>无鉴权、无审计日志。{todo}</li>
      <li>刷新丢失内存改动。{impl}</li>
    </ul>
  </section>

  <section id="analytics">
    <h2>10. 埋点与指标建议</h2>
    <p><span class="status guess">建议补充</span> 代码无埋点。</p>
    {table(
        ['事件名称', '触发动作', '关键属性', '业务目的'],
        [
            ['care_rule_create_submit', '新建保存成功', 'type（不含节气）', '看运营实际启用场景'],
            ['care_record_blessing_open', '打开祝福抽屉', 'recordId, count', '祝福互动深度'],
            ['care_record_export', '导出 CSV', 'filteredCount', '运营取数'],
        ],
    )}
  </section>

  <section id="acceptance">
    <h2>11. 验收标准</h2>
    <ol>
      <li>Given 新建关怀规则，When 展开关怀场景，Then 固定日期组没有「节气关怀」。</li>
      <li>Given 访问 <code>#/care/care-rule-create/节气关怀</code>，When 表单加载，Then 场景为节日关怀且下拉仍无节气。</li>
      <li>Given 编辑规则，When 展开场景，Then 可见「节气关怀」。</li>
      <li>Given 关怀记录，When 看筛选区，Then 无发送人；副标题含「同事祝福次数」。</li>
      <li>Given 关怀记录表，When 看同事祝福列，Then 数字右对齐；有祝福可开抽屉，无祝福显示 0。</li>
      <li>Given 记录数据含用户关怀，When 打开本页，Then 只出现系统关怀行。</li>
    </ol>
  </section>

  <section id="risks">
    <h2>12. 风险与待确认问题</h2>
    <ul>
      <li>种子规则无节气行：编辑下拉里的「节气关怀」只能靠改类型进入，保存后才会有节气规则。是否需要示例数据 {todo}。</li>
      <li>filterRecords 仍支持 sender，UI 已隐藏：后续若加回筛选，模型已就绪。</li>
      <li>发送状态选项仅「已发送」，失败/待发送 {todo}。</li>
      <li>真实定时推送、天气、考勤、对象存储、RBAC 均未实现。</li>
      <li>员工端我的关怀不在本稿范围。</li>
    </ul>
  </section>
''')
    return '\n'.join(a)


def main() -> None:
    g.write_prd('care-app', '员工关怀后台-PRD.html', '员工关怀后台 产品需求文档', TOC, body())


if __name__ == '__main__':
    main()
