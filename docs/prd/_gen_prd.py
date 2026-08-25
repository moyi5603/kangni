#!/usr/bin/env python3
"""Generate html-to-prd style Chinese HTML PRDs for Kangni admin apps."""
from __future__ import annotations

from datetime import date
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
CSS = r'''
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.65; color: #1f2937; margin: 0; background: #f8fafc; }
    .layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
    .layout.toc-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
    .toc { position: sticky; top: 0; height: 100vh; overflow: auto; border-right: 1px solid #d1d5db; background: #fff; padding: 16px; }
    .layout.toc-collapsed .toc { transform: translateX(-100%); padding: 0; border: 0; }
    .toc-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
    .toc-title { margin: 0; font-size: 15px; font-weight: 700; }
    .icon-button { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; }
    .icon-button svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .toc ol { list-style: none; padding: 0; margin: 0; }
    .toc li { margin: 4px 0; }
    .toc a { display: block; color: #374151; text-decoration: none; padding: 6px 8px; border-radius: 6px; font-size: 14px; }
    .toc a:hover { background: #f3f4f6; color: #0f766e; }
    .toc .sub a { padding-left: 18px; font-size: 13px; color: #6b7280; }
    .content-wrap { min-width: 0; }
    .floating-toc-toggle { position: fixed; left: 12px; top: 12px; z-index: 20; box-shadow: 0 4px 12px rgba(15,23,42,.12); }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 24px 64px; background: #fff; }
    h1,h2,h3,h4 { color: #111827; line-height: 1.3; }
    h2 { margin-top: 40px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 13px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    figure { margin: 16px 0 24px; border: 1px solid #d1d5db; background: #f9fafb; padding: 12px; }
    figure img { max-width: 100%; height: auto; display: block; border: 1px solid #e5e7eb; background: #fff; }
    figcaption { margin-top: 8px; color: #4b5563; font-size: 13px; }
    .component-path { font-weight: 600; color: #0f766e; }
    .status { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #e0f2fe; color: #075985; font-size: 12px; margin-right: 4px; }
    .status.impl { background: #dcfce7; color: #166534; }
    .status.todo { background: #fee2e2; color: #991b1b; }
    .status.guess { background: #fef3c7; color: #92400e; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
    @media (max-width: 860px) {
      .layout { display: block; }
      .toc { position: fixed; z-index: 15; width: 280px; box-shadow: 0 12px 30px rgba(15,23,42,.18); }
      .layout.toc-collapsed .toc { transform: translateX(-100%); }
      main { padding-top: 56px; }
    }
'''

JS = r'''
  document.querySelectorAll('[data-toggle-toc]').forEach(function (button) {
    button.addEventListener('click', function () {
      var layout = document.getElementById('prdLayout');
      var collapsed = layout.classList.toggle('toc-collapsed');
      document.querySelectorAll('[data-toggle-toc]').forEach(function (btn) {
        btn.setAttribute('aria-label', collapsed ? '显示目录' : '隐藏目录');
        btn.setAttribute('title', collapsed ? '显示目录' : '隐藏目录');
      });
    });
  });
'''


def fig(path: str, caption: str) -> str:
    return f'''<figure>
        <img src="screenshots/{path}" alt="{caption}截图">
        <figcaption><span class="component-path">{caption}</span></figcaption>
      </figure>'''


def wrap(title: str, toc_items: list[tuple[str, str]], body: str) -> str:
    toc_html = '\n'.join(f'<li><a href="#{aid}">{label}</a></li>' for aid, label in toc_items)
    return f'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>{CSS}</style>
</head>
<body>
<div class="layout" id="prdLayout">
<aside class="toc" aria-label="PRD目录">
  <div class="toc-header">
    <p class="toc-title">目录</p>
    <button class="icon-button toc-toggle" type="button" data-toggle-toc aria-label="隐藏目录" title="隐藏目录">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>
    </button>
  </div>
  <nav><ol>{toc_html}</ol></nav>
</aside>
<div class="content-wrap">
<button class="icon-button floating-toc-toggle" type="button" data-toggle-toc aria-label="显示目录" title="显示目录">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path></svg>
</button>
<main>
  <h1>{title.replace(' 产品需求文档', '')} 产品需求文档</h1>
  {body}
</main>
</div>
</div>
<script>{JS}</script>
</body>
</html>
'''


def write_prd(folder: str, filename: str, title: str, toc: list[tuple[str, str]], body: str) -> None:
    out_dir = ROOT / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    html = wrap(title, toc, body)
    path = out_dir / filename
    path.write_text(html, encoding='utf-8')
    missing = []
    for m in re.finditer(r'src="screenshots/([^"]+)"', html):
        if not (out_dir / 'screenshots' / m.group(1)).exists():
            missing.append(m.group(1))
    print(path.name, 'bytes', path.stat().st_size, 'missing', missing or 'none')


TOC = [
    ('doc-note', '1. 文档说明'),
    ('overview', '2. 产品概述'),
    ('ia', '3. 页面结构 / 信息架构'),
    ('implemented-features', '4. 已实现功能清单'),
    ('flows', '5. 用户流程'),
    ('page-requirements', '6. 页面级需求说明'),
    ('data-fields', '7. 数据字段与枚举'),
    ('apis', '8. API / 数据接口清单'),
    ('non-functional', '9. 非功能需求'),
    ('analytics', '10. 埋点与指标建议'),
    ('acceptance', '11. 验收标准'),
    ('risks', '12. 风险与待确认问题'),
]

TODAY = date.today().isoformat()


def activity_body() -> str:
    return f'''
  <section id="doc-note">
    <h2>1. 文档说明</h2>
    <ul>
      <li>文档来源：基于康尼管理后台 React/TSX 原型反向分析（html-to-prd）</li>
      <li>分析范围：应用「活动」(<code>activities</code>)：概览、活动管理、新建/编辑、详情（含报名等 Tab）、分类管理、规则设置</li>
      <li>生成日期：{TODAY}</li>
      <li>可信度：界面与交互以源码为准（<span class="status impl">代码已实现</span>）；无后端/权限处标 <span class="status todo">待确认</span></li>
      <li>组件命名：<code>页面-模块-组件名称</code></li>
    </ul>
  </section>
  <section id="overview">
    <h2>2. 产品概述</h2>
    <p><strong>产品定位：</strong>企业员工活动运营后台，覆盖活动创建、审批发布、报名审核、评论/瞬间/奖品运营与积分规则。</p>
    <p><strong>目标用户：</strong>活动运营 / 审批人（代码审核人常量 <code>activityReviewer='苏然'</code>）。角色分权 <span class="status todo">待确认</span>。</p>
    <p><strong>核心场景：</strong>建活动→（可选）提交审批→发布→管理报名/评论/瞬间/奖品；配置积分规则与活动分类。</p>
  </section>
  <section id="ia">
    <h2>3. 页面结构 / 信息架构</h2>
    {fig('活动应用-左侧菜单.png', '活动应用-导航-左侧菜单')}
    <ul>
      <li>侧栏：概览 / 活动管理 / 分类管理 / 规则设置</li>
      <li>Hash：<code>#/activities/activity-overview|activity-list|activity-categories|activity-rules</code></li>
      <li>隐藏页：<code>activity-create</code>、<code>activity-edit/:id</code>、<code>activity-detail/:id/:tab?</code></li>
      <li>详情 Tab：detail / signups / comments / moments / prizes</li>
    </ul>
  </section>
  <section id="implemented-features">
    <h2>4. 已实现功能清单</h2>
    <table>
      <thead><tr><th>模块</th><th>功能点</th><th>说明</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>概览</td><td>KPI/图表/待办表</td><td>待审活动/报名、发布率、关注列表</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>活动列表</td><td>筛选/批量/行操作</td><td>提交审批、审核、发布/撤销、置顶、分类批量</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>活动表单</td><td>创建/编辑/复制</td><td>封面、时间、可见范围、报名设置、积分、报名字段</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>活动详情</td><td>五 Tab</td><td>详情/报名/评论/瞬间/奖品 + 头区审批发布</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>分类/规则</td><td>CRUD + 积分上下限</td><td>分类启用禁用；活动积分规则</td><td><span class="status impl">代码已实现</span></td></tr>
      </tbody>
    </table>
  </section>
  <section id="flows">
    <h2>5. 用户流程</h2>
    <ol>
      <li>活动管理 → 新建 → 填表保存（默认 auditStatus 常为无需审核）→ 列表草稿/未发布</li>
      <li>若开启活动审批：提交审批 → 审核通过 → 发布</li>
      <li>发布后员工端可见（文案）；可撤销、截止报名、管理报名审核</li>
    </ol>
  </section>
  <section id="page-requirements">
    <h2>6. 页面级需求说明</h2>
    <h3>6.1 概览</h3>
    {fig('概览-页面整体.png', '概览-页面布局-页面整体')}
    <p>KPI：待审核活动、待审核报名、报名中活动、总报名人数、已发布。图表：状态分布、报名构成、发布率。待办关注表可跳详情（报名待审带 tab=signups）。</p>
    <h3>6.2 活动管理</h3>
    {fig('活动管理-页面整体.png', '活动管理-页面布局-页面整体')}
    {fig('活动管理-查询筛选.png', '活动管理-查询筛选-搜索面板')}
    {fig('活动管理-列表表格.png', '活动管理-列表表格-活动表格')}
    <p>筛：标题/分类/活动时间/审核状态/生命周期/创建与发布时间。行操作：详情、编辑、提交审批|审核|发布|撤销、置顶。批量：提交审批/发布/撤销/设分类。</p>
    <h3>6.3 新增活动</h3>
    {fig('新增活动-表单页.png', '新增活动-表单页-页面整体')}
    <p>必填：封面、标题(≤20)、分类、报名时段、活动时段、地点、报名总名额、组织人、详情。高级：可见范围、报名审批流、瞬间审核、活动积分、报名字段编辑器。保存会清空 itinerary/extraFeeRule/tags。</p>
    <h3>6.4 活动详情</h3>
    {fig('活动详情-页面整体.png', '活动详情-页面布局-页面整体')}
    {fig('活动详情-报名Tab.png', '活动详情-报名Tab-面板')}
    <p>头区：审核/提交审批/预览/编辑/复制/截止报名/删除。统计条含报名使用率、评论、瞬间、评分。报名 Tab 管理报名审核状态。</p>
    <h3>6.5 分类管理 / 规则设置</h3>
    {fig('分类管理-页面整体.png', '分类管理-页面布局-页面整体')}
    {fig('规则设置-页面整体.png', '规则设置-页面布局-页面整体')}
    <p>分类：名称≤10、启用/禁用、占用不可删。规则：报名积分区间、首评/评分/瞬间积分上限。</p>
  </section>
  <section id="data-fields">
    <h2>7. 数据字段与枚举</h2>
    <table>
      <thead><tr><th>枚举</th><th>取值</th></tr></thead>
      <tbody>
        <tr><td>auditStatuses</td><td>待提交 / 待审核 / 已通过 / 已驳回 / 无需审核</td></tr>
        <tr><td>publishStatuses</td><td>未发布 / 已发布</td></tr>
        <tr><td>activityStatuses / lifecycle</td><td>未开始/进行中/已结束；展示含未发布</td></tr>
        <tr><td>visibilityOptions</td><td>全员 / 按部门 / 自定义人群 / 导入人群</td></tr>
        <tr><td>signupStatuses</td><td>待审核 / 已通过 / 已驳回 / 已取消</td></tr>
        <tr><td>activityTypes</td><td>公司/疗休养/体检/项目（表单不暴露，保存默认或继承）</td></tr>
      </tbody>
    </table>
  </section>
  <section id="apis">
    <h2>8. API / 数据接口清单</h2>
    <p>无 HTTP。内存 <code>activityStore</code> / <code>categoryStore</code> / <code>activityPointRulesStore</code>。<strong>无 localStorage</strong>，刷新丢变更。</p>
    <p><span class="status todo">建议接口</span>：活动 CRUD、审批流、报名审核、文件上传、人群导入解析。</p>
  </section>
  <section id="non-functional">
    <h2>9. 非功能需求</h2>
    <ul>
      <li>窄屏列表布局自适应（代码有 breakpoint）。</li>
      <li>危险操作确认弹窗（删除/撤销等）。</li>
      <li>审计日志、权限、并发 <span class="status todo">待确认</span>。</li>
    </ul>
  </section>
  <section id="analytics">
    <h2>10. 埋点与指标建议</h2>
    <p><span class="status">建议补充</span></p>
    <table>
      <thead><tr><th>事件</th><th>触发</th><th>目的</th></tr></thead>
      <tbody>
        <tr><td>activity_publish</td><td>发布</td><td>发布转化</td></tr>
        <tr><td>activity_approve</td><td>审核通过</td><td>审批时效</td></tr>
        <tr><td>signup_review</td><td>报名通过/驳回</td><td>运营效率</td></tr>
      </tbody>
    </table>
  </section>
  <section id="acceptance">
    <h2>11. 验收标准</h2>
    <ol>
      <li>Given 可发布条件（已通过/无需审核），When 发布，Then publishStatus=已发布。</li>
      <li>Given 分类被活动引用，When 删除分类，Then 拦截。</li>
      <li>Given 报名 Tab 有待审，When 通过，Then 状态变为已通过。</li>
    </ol>
  </section>
  <section id="risks">
    <h2>12. 风险与待确认问题</h2>
    <ul>
      <li>无持久化；导入人群只存文件名不解析。</li>
      <li><code>activityApprovalEnabled</code> 文案与活动审核门禁共用，易混。</li>
      <li>表单不维护 type/tags/itinerary；疗休养扩展字段保存被清空。</li>
      <li>概览 KPI 跳转列表不带筛选条件。</li>
    </ul>
  </section>
'''


def exam_body() -> str:
    return f'''
  <section id="doc-note">
    <h2>1. 文档说明</h2>
    <ul>
      <li>来源：原型代码反向分析（html-to-prd）</li>
      <li>范围：应用「考试练习」(<code>exam</code>)：概览、考试管理、试题库、试卷、证书、习题库及创建/详情页</li>
      <li>日期：{TODAY}</li>
      <li>试题库 vs 习题库：同一套页面组件，<code>QuestionBankScope</code> = exam | practice，数据 store 分离</li>
    </ul>
  </section>
  <section id="overview">
    <h2>2. 产品概述</h2>
    <p><strong>定位：</strong>考试与练习题库运营后台：考试发布、组卷、证书、成绩/排行查看。</p>
    <p><strong>用户：</strong>培训/考试管理员。<span class="status todo">待确认</span>与课程应用权限边界。</p>
  </section>
  <section id="ia">
    <h2>3. 页面结构 / 信息架构</h2>
    {fig('考试应用-左侧菜单.png', '考试应用-导航-左侧菜单')}
    <ul>
      <li>侧栏：概览；考试组（考试管理/试题库/试卷/证书）；练习组（习题库）</li>
      <li>默认落地：<code>exam-list</code>（非 overview）</li>
      <li>Hash 形如 <code>#/exam/exam-detail/1/records</code></li>
    </ul>
  </section>
  <section id="implemented-features">
    <h2>4. 已实现功能清单</h2>
    <table>
      <thead><tr><th>模块</th><th>功能</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>概览</td><td>进行中/待发布/及格率等 KPI 与列表</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>考试</td><td>分类树、发布、表单绑试卷/证书、详情记录&排行</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>试题/习题</td><td>多题型 CRUD、启禁用、分类；导入/AI=开发中 toast</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>试卷</td><td>随机/固定、按题库或指定题目、题型分值</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>证书</td><td>证书模板列表/编辑；页有迁移遮罩文案</td><td><span class="status impl">代码已实现</span></td></tr>
      </tbody>
    </table>
  </section>
  <section id="flows">
    <h2>5. 用户流程</h2>
    <ol>
      <li>试题库录入 → 组卷（抽题规则）→ 新建考试绑定试卷与证书 → 发布</li>
      <li>详情查看考试记录/排行（导出仅 toast）</li>
    </ol>
  </section>
  <section id="page-requirements">
    <h2>6. 页面级需求说明</h2>
    <h3>6.1 概览</h3>
    {fig('概览-页面整体.png', '概览-页面布局-页面整体')}
    <h3>6.2 考试管理</h3>
    {fig('考试管理-页面整体.png', '考试管理-页面布局-页面整体')}
    {fig('考试管理-分类树.png', '考试管理-分类树-面板')}
    {fig('考试管理-列表表格.png', '考试管理-列表表格-考试表')}
    <p>筛名称/考试状态/发布状态；行：详情编辑发布撤销删除（仅未发布可删）；批量发布/撤销/设分类。</p>
    <h3>6.3 新增考试 / 详情</h3>
    {fig('新增考试-表单页.png', '新增考试-表单页-页面整体')}
    {fig('考试详情-页面整体.png', '考试详情-页面布局-页面整体')}
    <p>表单：名称、分类、时段、时长、学分、证书、试卷、及格分、次数、标签、人群、说明。详情 Tab：detail / records / ranking。</p>
    <h3>6.4 试题库 / 习题库 / 试卷 / 证书</h3>
    {fig('试题库-页面整体.png', '试题库-页面布局-页面整体')}
    {fig('习题库-页面整体.png', '习题库-页面布局-页面整体')}
    {fig('试卷管理-页面整体.png', '试卷管理-页面布局-页面整体')}
    {fig('证书管理-页面整体.png', '证书管理-页面布局-页面整体')}
  </section>
  <section id="data-fields">
    <h2>7. 数据字段与枚举</h2>
    <table>
      <thead><tr><th>枚举</th><th>取值</th></tr></thead>
      <tbody>
        <tr><td>examPublishStatuses</td><td>未发布 / 已发布</td></tr>
        <tr><td>examStatuses</td><td>未开始 / 进行中 / 已结束</td></tr>
        <tr><td>questionTypes</td><td>单选/多选/判断/填空/问答题</td></tr>
        <tr><td>paperGenerationModes</td><td>随机出题 / 固定出题</td></tr>
        <tr><td>certificateCoverThemes</td><td>gold / purple / teal</td></tr>
      </tbody>
    </table>
  </section>
  <section id="apis">
    <h2>8. API / 数据接口清单</h2>
    <p>内存 store：exam / question(exam|practice) / paper / certificate。<strong>无 localStorage</strong>。attempts 为只读常量 <code>initialExamAttempts</code>。</p>
  </section>
  <section id="non-functional"><h2>9. 非功能需求</h2><p>分类最多 3 级；危险删除确认。权限与真实导出 <span class="status todo">待确认</span>。</p></section>
  <section id="analytics"><h2>10. 埋点与指标建议</h2><p><span class="status">建议补充</span> exam_publish / paper_save / question_import。</p></section>
  <section id="acceptance">
    <h2>11. 验收标准</h2>
    <ol>
      <li>Given 未发布考试，When 删除，Then 可删；已发布不可删。</li>
      <li>Given 启用试卷，When 考试表单选择，Then 总分只读来自试卷。</li>
      <li>Given 试题库与习题库，When 分别新增，Then 数据互不影响。</li>
    </ol>
  </section>
  <section id="risks">
    <h2>12. 风险与待确认问题</h2>
    <ul>
      <li>导入/AI 出题、导出仅为 toast。</li>
      <li>examStatus 表单不编辑，未见按时间自动推进。</li>
      <li>证书页迁移遮罩；自定义有效期无日期字段。</li>
      <li>组卷选题仅绑考试试题库，不绑习题库。</li>
    </ul>
  </section>
'''


def ig_body() -> str:
    return f'''
  <section id="doc-note">
    <h2>1. 文档说明</h2>
    <ul>
      <li>范围：应用「兴趣小组」：小组管理、活动管理、分类；概览为 PlaceholderPage</li>
      <li>日期：{TODAY} · html-to-prd 反向分析</li>
    </ul>
  </section>
  <section id="overview">
    <h2>2. 产品概述</h2>
    <p>员工兴趣社群运营：小组资料与成员审核、小组活动（单次/周期/系列）审批发布、评论与精彩瞬间。</p>
  </section>
  <section id="ia">
    <h2>3. 页面结构 / 信息架构</h2>
    {fig('兴趣小组-左侧菜单.png', '兴趣小组-导航-左侧菜单')}
    <ul>
      <li>侧栏：概览(占位) / 小组管理 / 活动管理 / 分类管理</li>
      <li>详情 Tab：小组 acts|members|comments|moments；活动 detail|signups|comments|moments</li>
    </ul>
  </section>
  <section id="implemented-features">
    <h2>4. 已实现功能清单</h2>
    <table>
      <thead><tr><th>模块</th><th>功能</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>概览</td><td>占位页</td><td><span class="status guess">根据页面推测需要</span>后续 KPI</td></tr>
        <tr><td>小组</td><td>列表/Drawer 创建编辑/详情成员评论瞬间</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>活动</td><td>三种类型、审批发布、报名只读、AI 策划入口</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>分类</td><td>CRUD、排序、启禁用</td><td><span class="status impl">代码已实现</span></td></tr>
      </tbody>
    </table>
  </section>
  <section id="flows">
    <h2>5. 用户流程</h2>
    <ol>
      <li>建小组 → 成员审核加入 → 建活动 → 提交审批 → 发布</li>
      <li>运营评论与精彩瞬间审核</li>
    </ol>
  </section>
  <section id="page-requirements">
    <h2>6. 页面级需求说明</h2>
    <h3>6.1 小组管理 / 详情</h3>
    {fig('小组管理-页面整体.png', '小组管理-页面布局-页面整体')}
    {fig('小组详情-页面整体.png', '小组详情-页面布局-页面整体')}
    <p>Drawer 字段：封面、名称、分类、负责人、加入方式(free/approve)、区域、标签、简介(+AI)。成员：通过/驳回/移出/导入导出。</p>
    <h3>6.2 活动管理 / 表单</h3>
    {fig('活动管理-页面整体.png', '活动管理-页面布局-页面整体')}
    {fig('新增活动-表单页.png', '新增活动-表单页-页面整体')}
    <p>类型 once/recurring/series；审批发布撤销；有报名不可删。</p>
    <h3>6.3 分类管理</h3>
    {fig('分类管理-页面整体.png', '分类管理-页面布局-页面整体')}
  </section>
  <section id="data-fields">
    <h2>7. 数据字段与枚举</h2>
    <table>
      <thead><tr><th>枚举</th><th>取值</th></tr></thead>
      <tbody>
        <tr><td>JoinMode</td><td>free / approve</td></tr>
        <tr><td>ActivityType</td><td>once / recurring / series</td></tr>
        <tr><td>Audit/Publish</td><td>同活动域：待提交… / 未发布|已发布</td></tr>
        <tr><td>MemberStatus</td><td>待审核 / 已通过 / 已驳回</td></tr>
      </tbody>
    </table>
  </section>
  <section id="apis"><h2>8. API / 数据接口清单</h2><p>内存 <code>interestGroupStore</code>，无 localStorage。AI 草稿 <code>pendingAiActivityDraft</code> 一次性内存。</p></section>
  <section id="non-functional"><h2>9. 非功能需求</h2><p>删除保护（进行中活动/有报名）。权限 <span class="status todo">待确认</span>。</p></section>
  <section id="analytics"><h2>10. 埋点与指标建议</h2><p><span class="status">建议补充</span> group_create / activity_publish / member_approve。</p></section>
  <section id="acceptance">
    <h2>11. 验收标准</h2>
    <ol>
      <li>Given 小组有进行中活动，When 删除小组，Then 禁用删除。</li>
      <li>Given 活动有报名，When 删除活动，Then 不可删。</li>
    </ol>
  </section>
  <section id="risks">
    <h2>12. 风险与待确认问题</h2>
    <ul>
      <li>概览占位；报名情况只读无审核动作。</li>
      <li>成员表「手机号」列与模型字段声明不一致风险。</li>
      <li>删小组后活动 groupId→null 产品意图待确认。</li>
    </ul>
  </section>
'''


def award_body() -> str:
    return f'''
  <section id="doc-note">
    <h2>1. 文档说明</h2>
    <ul>
      <li>范围：应用「评优」：评优管理、证书；概览与规则设置为 PlaceholderPage</li>
      <li>日期：{TODAY}</li>
    </ul>
  </section>
  <section id="overview">
    <h2>2. 产品概述</h2>
    <p>评优活动配置（提名/投票截止、名次奖励）、提名审核、结果公示与证书模板管理。</p>
  </section>
  <section id="ia">
    <h2>3. 页面结构 / 信息架构</h2>
    {fig('评优-左侧菜单.png', '评优应用-导航-左侧菜单')}
    <ul>
      <li>侧栏：概览(占位) / 评优管理 / 评优证书 / 规则设置(占位)</li>
      <li>详情 Tab：detail / nominations / comments（评论 Empty 占位）</li>
    </ul>
  </section>
  <section id="implemented-features">
    <h2>4. 已实现功能清单</h2>
    <table>
      <thead><tr><th>模块</th><th>功能</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>评优列表/表单/详情</td><td>创建编辑发布公示、提名审核、名次奖励配置</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>证书</td><td>证书模板 CRUD</td><td><span class="status impl">代码已实现</span></td></tr>
        <tr><td>概览/规则/评论</td><td>占位</td><td><span class="status guess">根据页面推测需要</span></td></tr>
      </tbody>
    </table>
  </section>
  <section id="flows">
    <h2>5. 用户流程</h2>
    <ol>
      <li>创建评优 → 配置范围与名次奖励 → 发布 → 审核提名 → 结束后结果公示</li>
    </ol>
  </section>
  <section id="page-requirements">
    <h2>6. 页面级需求说明</h2>
    <h3>6.1 评优管理</h3>
    {fig('评优管理-页面整体.png', '评优管理-页面布局-页面整体')}
    <p>筛名称/状态/类型/提名投票截止/是否公示。行：详情编辑发布撤销删除（征集中且未发布）、结果公示。</p>
    <h3>6.2 新增评优 / 详情</h3>
    {fig('新增评优-表单页.png', '新增评优-表单页-页面整体')}
    {fig('评优详情-页面整体.png', '评优详情-页面布局-页面整体')}
    <p>表单：名称、类型(个人/团队/项目)、提名/投票截止、标准列表、前 x 名奖励(积分/勋章/证书)、可见/提名人/被提范围、自动公示。详情提名 Tab 可新建与审核。</p>
    <h3>6.3 评优证书</h3>
    {fig('评优证书-页面整体.png', '评优证书-页面布局-页面整体')}
  </section>
  <section id="data-fields">
    <h2>7. 数据字段与枚举</h2>
    <table>
      <thead><tr><th>枚举</th><th>取值</th></tr></thead>
      <tbody>
        <tr><td>AwardType</td><td>个人 / 团队 / 项目</td></tr>
        <tr><td>AwardStatus（推导）</td><td>征集中 / 投票中 / 已结束</td></tr>
        <tr><td>PublishStatus</td><td>未发布 / 已发布</td></tr>
        <tr><td>NominationReviewStatus</td><td>待审核 / 已通过 / 已驳回</td></tr>
      </tbody>
    </table>
  </section>
  <section id="apis"><h2>8. API / 数据接口清单</h2><p>内存 awardStore / awardCertificateStore / awardNominationStore，无 localStorage。</p></section>
  <section id="non-functional"><h2>9. 非功能需求</h2><p>未保存离开确认；删除保护。投票计票 UI 未见。</p></section>
  <section id="analytics"><h2>10. 埋点与指标建议</h2><p><span class="status">建议补充</span> award_publish / nomination_approve / result_publicize。</p></section>
  <section id="acceptance">
    <h2>11. 验收标准</h2>
    <ol>
      <li>Given 征集中且未发布，When 删除，Then 可删。</li>
      <li>Given 已结束，When 结果公示，Then 公示标签更新。</li>
      <li>Given 个人类型提名，When 名单人数≠1，Then 校验失败。</li>
    </ol>
  </section>
  <section id="risks">
    <h2>12. 风险与待确认问题</h2>
    <ul>
      <li>概览/规则/评论占位；无投票与发奖流程页。</li>
      <li>状态由截止时间推导，无 collectStartAt/未开始。</li>
      <li>导入人群仅文件名；勋章复用活动 medalLibrary。</li>
    </ul>
  </section>
'''


def main() -> None:
    write_prd('activity-admin', '活动管理后台-PRD.html', '活动管理后台 产品需求文档', TOC, activity_body())
    write_prd('exam-admin', '考试练习后台-PRD.html', '考试练习后台 产品需求文档', TOC, exam_body())
    write_prd('interest-group-admin', '兴趣小组后台-PRD.html', '兴趣小组后台 产品需求文档', TOC, ig_body())
    write_prd('award-admin', '评优后台-PRD.html', '评优后台 产品需求文档', TOC, award_body())


if __name__ == '__main__':
    main()
