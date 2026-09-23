import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { SQUARE_IMAGE_UPLOAD_HINT } from '../../../shared/ui/imageUploadHint';
import { CARE_BANNERS } from '../model/care';
import { __resetCareStoreForTests } from '../model/careStore';
import { CareInfoPage } from './CareInfoPage';
import { CareOverviewPage } from './CareOverviewPage';
import { CareRecordListPage } from './CareRecordListPage';
import { CareRuleFormPage } from './CareRuleFormPage';
import { CareRuleListPage } from './CareRuleListPage';
import { CareEmojiFormFields, CareSettingsPage } from './CareSettingsPage';
import { CareTemplateDetailPage } from './CareTemplateDetailPage';
import { CareTemplateFormPage } from './CareTemplateFormPage';
import { CareTemplateListPage } from './CareTemplateListPage';

const noop = () => {};

describe('care admin pages', () => {
  beforeEach(() => {
    __resetCareStoreForTests();
  });

  it('renders 概览 with KPI, charts and latest records', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareOverviewPage onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('概览');
    expect(html).toContain('关怀规则');
    expect(html).toContain('执行中规则');
    expect(html).toContain('关怀记录');
    expect(html).toContain('关怀模板');
    expect(html).toContain('规则分类分布');
    expect(html).toContain('记录来源分布');
    expect(html).toContain('最近发送');
    expect(html).toContain('周可心');
    expect(html).toContain('个人关怀');
    expect(html).toContain('系统关怀');
    expect(html).toContain('运营数据');
    expect(html).toContain('人员信息完善');
    expect(html).toContain('按当前档案，不随日期变化');
    expect(html.indexOf('人员信息完善')).toBeLessThan(html.indexOf('运营数据'));
    expect(html.indexOf('人员信息完善')).toBeLessThan(html.indexOf('生日信息'));
    expect(html.indexOf('生日信息')).toBeLessThan(html.indexOf('运营数据'));
    expect(html.indexOf('运营数据')).toBeLessThan(html.indexOf('最近发送'));
    expect(html.indexOf('运营数据')).toBeLessThan(html.indexOf('概览日期范围'));
    expect(html.indexOf('生日信息')).toBeLessThan(html.indexOf('概览日期范围'));
    expect(html).toContain('入职时间');
    expect(html).toContain('入党时间');
    expect(html).toContain('人已设置');
    expect(html).toContain('overview-complete-card');
    expect(html).toContain('概览日期范围');
    expect(html).toContain('>日<');
    expect(html).toContain('>月<');
    expect(html).not.toContain('信息管理');
  });

  it('renders 信息管理 list', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareInfoPage />
      </App>,
    );
    expect(html).toContain('信息管理');
    expect(html).toContain('陈晨');
    expect(html).toContain('发送完善提醒');
    expect(html).toContain('批量修改');
  });

  it('renders 关怀规则 list with seed rules', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareRuleListPage onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('关怀规则');
    expect(html).toContain('个人关怀');
    expect(html).toContain('固定日期关怀');
    expect(html).toContain('事件关怀');
    expect(html).toContain('生日关怀');
    expect(html).toContain('入党关怀');
    expect(html).not.toContain('极端天气关怀');
    expect(html).not.toContain('中秋节关怀');
    expect(html).toContain('新建');
    expect(html).not.toContain('生日信息');
    expect(html).not.toContain('人已设置');
  });

  it('renders 关怀记录 export toolbar', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareRecordListPage />
      </App>,
    );
    expect(html).toContain('关怀记录');
    expect(html).toContain('同事祝福');
    expect(html).toContain('aria-label="查看陈晨的同事祝福"');
    expect(html).toContain('aria-label="查看王悦的同事祝福"');
    expect(html).not.toContain('aria-label="查看赵宁的同事祝福"');
    expect(html).not.toContain('周可心');
    expect(html).not.toContain('用户关怀');
    expect(html).toContain('导出');
    expect(html).not.toContain('请输入发送人姓名');
    expect(html).toContain('justify-content:flex-end');
  });

  it('renders 关怀模板 categories', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareTemplateListPage onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('关怀模板');
    expect(html).toContain('个人关怀');
    expect(html).toContain('生日暖心祝福');
    expect(html).toContain(CARE_BANNERS.birthday);
    expect(html).toContain('aspect-ratio:1068 / 455');
    expect(html).not.toContain('9 / 16');
  });

  it('shows message push preview beside 模板内容', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareTemplateFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('祝福消息推送预览');
    expect(html).toContain('模板内容');
    expect(html).toContain('祝福消息推送模板');
    expect(html).toContain('class="care-preview-title"');
    expect(html).toContain('填写消息标题');
    expect(html).toContain('填写消息副标题后将在这里实时预览');
    expect(html).toContain('请上传消息封面图');
    expect(html).not.toContain('care-msg-preview__app');
    expect(html).not.toContain('care-msg-preview__rule');
    expect(html).toContain('care-template-tablist');
    expect(html).toContain('care-template-content-card');
    expect(html).toContain('插入变量');
    expect(html).toContain('【员工姓名】');
    expect(html).toContain('rich-text');
    expect(html).toContain('aria-label="贺卡文案"');
    expect(html).toContain('加粗');
    expect(html).not.toContain('插入图片');
    expect(html).not.toContain('落款');
    expect(html).not.toContain('请输入落款');
    expect(html).toContain('提醒消息推送');
    expect(html).not.toContain('同事祝福消息推送');
    expect(html).not.toMatch(/>同事祝福消息</);
  });

  it('orders 祝福消息推送 and 提醒消息推送 as cover, title, subtitle', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareTemplateFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    const employeeCover = html.indexOf('上传消息封面图');
    const employeeTitle = html.indexOf('请输入消息标题');
    const employeeSubtitle = html.indexOf('请输入消息副标题');
    expect(employeeCover).toBeGreaterThan(-1);
    expect(employeeCover).toBeLessThan(employeeTitle);
    expect(employeeTitle).toBeLessThan(employeeSubtitle);

    const colleagueCover = html.indexOf('上传提醒消息推送封面图');
    const colleagueTitle = html.indexOf('请输入提醒消息推送标题');
    const colleagueSubtitle = html.indexOf('请输入提醒消息推送副标题');
    expect(colleagueCover).toBeGreaterThan(-1);
    expect(colleagueCover).toBeLessThan(colleagueTitle);
    expect(colleagueTitle).toBeLessThan(colleagueSubtitle);
  });

  it('mirrors saved 祝福消息推送 fields in the left preview', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareTemplateFormPage mode="edit" recordId="t1" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toMatch(/care-preview-title">生日快乐，愿美好如期而至/);
    expect(html).toMatch(/care-preview-summary">一张贺卡，一份专属于你的生日祝福/);
  });

  it('renders 模板详情 with the same layout as edit, read-only', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareTemplateDetailPage recordId="t1" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('模板详情');
    expect(html).toContain('祝福消息推送预览');
    expect(html).toContain('模板内容');
    expect(html).toContain('care-template-tablist');
    expect(html).toContain('祝福消息推送模板');
    expect(html).toContain('生日快乐，愿美好如期而至');
    expect(html).toContain('编辑模板');
    expect(html).not.toContain('>保存<');
    expect(html).not.toContain('插入变量');
    expect(html).toContain('disabled');
    expect(html).toContain('care-template-content-card');
    expect(html).toContain('aria-label="模板预览"');
  });

  it('renders 关怀设置 tabs', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareSettingsPage />
      </App>,
    );
    expect(html).toContain('关怀设置');
    expect(html).toContain('名单展示设置');
    expect(html).toContain('同事关怀表情');
    expect(html).toContain('aria-label="上移表情 暖心"');
    expect(html).toContain('aria-label="下移表情 暖心"');
    expect(html).toContain('aria-label="上移表情 礼盒"');
    expect(html).not.toMatch(/>排序</);
    expect(html).not.toContain('文件格式');
  });

  it('uses the shared 1:1 image hint for 表情图片', () => {
    const html = renderToStaticMarkup(
      <Form>
        <CareEmojiFormFields />
      </Form>,
    );
    expect(html).toContain(SQUARE_IMAGE_UPLOAD_HINT);
    expect(html).not.toContain('表情图片仅支持 PNG');
  });

  it('uses a month-day picker for 其他 yearly fixed date', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareRuleFormPage mode="create" recordId="其他" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('固定日期');
    expect(html).toContain('每年按该月日执行');
    expect(html).toContain('aria-label="每年固定日期"');
    expect(html).not.toContain('placeholder="MM-DD"');
  });

  it('keeps 天气场景 single-select and hides weather query hint', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareRuleFormPage mode="create" recordId="天气关怀" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('天气场景');
    expect(html).toContain('单选');
    expect(html).not.toContain('系统每天 06:00、15:00、21:00 查询天气');
    expect(html).not.toContain('各场景可独立设置阈值');
  });

  it('keeps 工作强度 trigger single-select and shows T+1 as field extra', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareRuleFormPage mode="create" recordId="工作强度关怀" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('触发条件');
    expect(html).toContain('单选');
    expect(html).toContain('T+1 考勤更新后');
    expect(html).not.toContain('同一员工每周最多关怀一次');
    expect(html).not.toContain('可同时开启多个条件');
    expect(html).not.toContain('ant-alert');
  });

  it('shows weekly care cap only for 每周超时', () => {
    const html = renderToStaticMarkup(
      <App>
        <CareRuleFormPage mode="edit" recordId="r7" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).not.toContain('同一员工每周最多关怀一次');
    expect(html).not.toContain('每周工时');
  });
});
