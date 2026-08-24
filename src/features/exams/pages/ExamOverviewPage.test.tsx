import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExamOverviewPage } from './ExamOverviewPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('ExamOverviewPage', () => {
  it('shows inventory metrics and working tables instead of a placeholder', () => {
    const html = renderPage(<ExamOverviewPage onNavigate={() => undefined} />);

    expect(html).toContain('概览');
    expect(html).toContain('考试总数');
    expect(html).toContain('已发布');
    expect(html).toContain('试题数');
    expect(html).toContain('习题数');
    expect(html).toContain('试卷数');
    expect(html).toContain('参考人数');
    expect(html).toContain('考试人次');
    expect(html).toContain('及格率');
    expect(html).toContain('进行中的考试');
    expect(html).toContain('项目管理考试');
    expect(html).toContain('待发布考试');
    expect(html).toContain('入职测评');
    expect(html).toContain('即将结束');
    expect(html).toContain('发布率');
    expect(html).toContain('考试状态分布');
    expect(html).not.toContain('本页先占位');
    expect(html).not.toContain('成绩分布');
    expect(html).not.toContain('试题结构');
    expect(html).not.toContain('证书覆盖率');
    expect(html).not.toContain('答题结果');
    expect(html).not.toContain('近期考试记录');
    expect(html).not.toContain('部门排行');
    expect(html).not.toContain('人均场次');
    expect(html).not.toContain('平均用时');
    expect(html).not.toContain('最低分');
    expect(html).not.toContain('启用试题');
    expect(html).not.toContain('平均分');
    expect(html).not.toContain('最高分');
    expect(html).not.toContain('分类分布');
    expect(html).not.toContain('试卷使用');
  });
});
