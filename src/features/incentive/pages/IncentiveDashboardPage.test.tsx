import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_INCENTIVE_SETTINGS } from '../model/incentive';
import { recognitionRecordColumns } from '../components/recognitionRecordColumns';
import { RecognitionDetailFooter } from '../components/RecognitionDetailDrawer';
import { __resetIncentiveStoreForTests } from '../model/incentiveStore';
import { IncentiveDashboardPage } from './IncentiveDashboardPage';

describe('IncentiveDashboardPage', () => {
  beforeEach(() => {
    __resetIncentiveStoreForTests();
  });

  it('uses compact action column for overview tables', () => {
    const action = recognitionRecordColumns({
      rules: DEFAULT_INCENTIVE_SETTINGS.rules,
      displayedOf: (record) => record.status,
      onDetail: () => undefined,
      actionsWidth: 72,
    }).find((column) => column.title === '操作');
    expect(action?.width).toBe(72);
  });

  it('shows review actions for pending records in the detail drawer', () => {
    const html = renderToStaticMarkup(
      <App>
        <RecognitionDetailFooter
          showPendingReview
          onClose={() => undefined}
          onReject={() => undefined}
          onApprove={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('通过并发放');
  });

  it('renders overview kpis, charts and attention, not the old analytics blocks', () => {
    const html = renderToStaticMarkup(
      <App>
        <IncentiveDashboardPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('概览');
    expect(html).toContain('待审核');
    expect(html).toContain('已发放');
    expect(html).toContain('累计发放积分');
    expect(html).toContain('异常记录');
    expect(html).toContain('启用勋章');
    expect(html).toContain('发放状态分布');
    expect(html).toContain('勋章分布');
    expect(html).toContain('待办关注');
    expect(html).toContain('编号');
    expect(html).toContain('类型');
    expect(html).toContain('发起人');
    expect(html).toContain('认可对象');
    expect(html).toContain('部门');
    expect(html).toContain('事实描述');
    expect(html).toContain('异常标识');
    expect(html).toContain('林晓云');
    expect(html).toContain('主动补位');
    expect(html).not.toContain('待办类型');
    expect(html).not.toContain('认可编号');
    expect(html).toContain('近期发放');
    expect(html).toContain('overview-pie');
    expect(html).not.toContain('数据总览');
    expect(html).not.toContain('员工参与率');
    expect(html).not.toContain('跨部门认可占比');
    expect(html).not.toContain('勋章流向');
    expect(html).not.toContain('完整导出');
    expect(html).not.toContain('集团管理员');
    expect(html).not.toContain('单位管理员');
  });
});
