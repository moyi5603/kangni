import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExamDetailPage } from './ExamDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('ExamDetailPage', () => {
  it('shows grouped exam fields aligned with the edit form', () => {
    const html = renderPage(
      <ExamDetailPage recordId="5" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('项目管理考试');
    expect(html).toContain('详情');
    expect(html).toContain('基本信息');
    expect(html).toContain('考试名称');
    expect(html).toContain('考试分类');
    expect(html).toContain('考试时间');
    expect(html).toContain('考试时长');
    expect(html).toContain('获得积分');
    expect(html).toContain('关联证书');
    expect(html).toContain('试题配置');
    expect(html).toContain('选择试卷');
    expect(html).toContain('Java 初级能力卷');
    expect(html).toContain('分数与次数控制');
    expect(html).toContain('总分数');
    expect(html).toContain('及格分数');
    expect(html).toContain('考试次数');
    expect(html).toContain('标签与适用人群');
    expect(html).toContain('考试标签');
    expect(html).toContain('适用岗位/人群');
    expect(html).toContain('考试说明');
    expect(html).toContain('aria-label="编辑 项目管理考试"');
    expect(html).not.toContain('title="考试详情"');
    expect(html).not.toContain('分类名称');
    expect(html).not.toContain('考试总时长(分)');
    expect(html).not.toContain('关联试卷');
    expect(html).toContain('考试记录');
    expect(html).toContain('考试排行');
    expect(html).toContain('参考人数');
    expect(html).toContain('考试人次');
    expect(html).toContain('及格人数');
    expect(html).toContain('及格率');
    expect(html).toContain('平均分');
    expect(html).toContain('最高分');
  });

  it('lists attempt records with filters and export', () => {
    const html = renderPage(
      <ExamDetailPage recordId="5" tab="records" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('考试记录');
    expect(html).toContain('姓名');
    expect(html).toContain('手机号');
    expect(html).toContain('部门');
    expect(html).toContain('展开');
    expect(html).toContain('考试结果');
    expect(html).toContain('获得分数');
    expect(html).toContain('答对题数');
    expect(html).toContain('答错题数');
    expect(html).toContain('获得积分');
    expect(html).toContain('答题开始时间');
    expect(html).toContain('答题结束时间');
    expect(html).toContain('张伟');
    expect(html).toContain('导出');
    expect(html).toContain('参考人数');
    expect(html).not.toContain('基本信息');
  });

  it('lists ranking rows with filters and export', () => {
    const html = renderPage(
      <ExamDetailPage recordId="5" tab="ranking" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('考试排行');
    expect(html).toContain('排名');
    expect(html).toContain('考试成绩');
    expect(html).toContain('考试次数');
    expect(html).toContain('累计考试用时');
    expect(html).toContain('0时17分30秒');
    expect(html).toContain('导出');
    expect(html).not.toContain('基本信息');
  });

  it('shows empty records when nobody took the exam', () => {
    const html = renderPage(
      <ExamDetailPage recordId="3" tab="records" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('暂无考试记录');
  });

  it('shows empty state when the exam is missing', () => {
    const html = renderPage(
      <ExamDetailPage recordId="999999" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('考试不存在或已删除');
    expect(html).toContain('返回考试管理');
  });
});
