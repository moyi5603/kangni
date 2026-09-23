import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_INCENTIVE_SETTINGS, validateCommendationReason } from '../model/incentive';
import {
  getIncentiveSettings,
  getRecognitions,
  __resetIncentiveStoreForTests,
} from '../model/incentiveStore';
import { IncentiveRecordListPage, RecognitionFields } from './IncentiveRecordListPage';

describe('IncentiveRecordListPage', () => {
  beforeEach(() => {
    __resetIncentiveStoreForTests();
  });

  it('renders heading, seed ids and publish action', () => {
    const html = renderToStaticMarkup(
      <App>
        <IncentiveRecordListPage />
      </App>,
    );
    expect(html).toContain('发放记录');
    expect(html).toContain('发布公司表彰');
    expect(html).toContain('认可对象');
    expect(html).toContain('请输入发起人');
    expect(html).toContain('系统');
    expect(html).toMatch(/RK20/);
    expect(html).not.toContain('集团管理员');
    expect(html).not.toContain('单位管理员');
    expect(html).toContain('表彰理由 / 认可理由');
    expect(html).not.toContain('图片 / 附件');
    expect(html).not.toContain('客户感谢信.png');
    expect(html).not.toContain('下载');
    expect(html).not.toContain('事实描述');
    expect(html).toContain('异常');
    expect(html).toContain('正常');
  });

  it('renders prototype-aligned detail fields', () => {
    const record = getRecognitions().find((item) => item.id === 'RK20260826004');
    expect(record).toBeTruthy();
    const html = renderToStaticMarkup(
      <App>
        <RecognitionFields
          record={record!}
          displayed="已发放"
          personalReviewEnabled
          rules={DEFAULT_INCENTIVE_SETTINGS.rules}
          onOpenRelated={() => {}}
        />
      </App>,
    );
    expect(html).toContain('主动补位');
    expect(html).toContain('同事认可 · +20 积分');
    expect(html).toContain('处理记录');
    expect(html).toContain('提交个人认可');
    expect(html).toContain('同事认可已完成审核');
    expect(html).toContain('积分已发放');
    expect(html).toContain('提示');
    expect(html).toContain('关联单号：');
    expect(html).toContain('RK20260826002');
    expect(html).toContain('陈佳 · 轨道交通事业部');
    expect(html).toContain('认可理由');
    expect(html).toContain('>附件<');
    expect(html).toContain('download="现场照片.jpg"');
    expect(html).toContain('aria-label="下载 现场照片.jpg"');
    expect(html).not.toContain('>图片<');
    expect(html).not.toContain('alt="现场照片.jpg"');
    expect(html).not.toContain('事实描述');
    expect(html).not.toContain('表彰理由');
    expect(html).not.toContain('所属部门');
    const company = getRecognitions().find((item) => item.type === '公司表彰');
    const companyHtml = renderToStaticMarkup(
      <App>
        <RecognitionFields
          record={company!}
          displayed="已发放"
          personalReviewEnabled
          rules={DEFAULT_INCENTIVE_SETTINGS.rules}
          onOpenRelated={() => {}}
        />
      </App>,
    );
    expect(companyHtml).toContain('表彰理由');
    expect(companyHtml).not.toContain('>图片<');
    expect(companyHtml).toContain('>附件<');
    expect(companyHtml).toContain('download="客户感谢信.png"');
    expect(companyHtml).toContain('aria-label="下载 客户感谢信.png"');
    expect(companyHtml).toContain('download="交付确认函.pdf"');
    expect(companyHtml).toContain('aria-label="下载 交付确认函.pdf"');
    expect(companyHtml).not.toContain('认可理由');
    expect(companyHtml).not.toContain('事实描述');
  });

  it('shows 待审核 or 审核 when personal review is enabled', () => {
    expect(getIncentiveSettings().personalReviewEnabled).toBe(true);
    const html = renderToStaticMarkup(
      <App>
        <IncentiveRecordListPage />
      </App>,
    );
    expect(html.includes('待审核') || html.includes('审核')).toBe(true);
  });

  it('uses settings minimum length for commendation reason', () => {
    const min = getIncentiveSettings().minimumReasonLength;
    expect(validateCommendationReason('两个', min).ok).toBe(false);
    expect(validateCommendationReason('发生场景—具体行为—产生结果足够长', min).ok).toBe(true);
    const before = getRecognitions().length;
    expect(before).toBeGreaterThan(0);
  });
});
