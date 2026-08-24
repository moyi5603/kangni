import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { setPendingAiActivityDraft } from '../model/interestGroupActivityPlan';
import { InterestGroupActivityFormPage } from './InterestGroupActivityFormPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupActivityFormPage', () => {
  beforeEach(() => {
    setPendingAiActivityDraft(null);
  });

  it('renders create form with save action and AI write', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage mode="create" onBack={() => undefined} onSaved={() => undefined} />,
    );
    expect(html).toContain('新建活动');
    expect(html).toContain('保存活动');
    expect(html).toContain('AI 帮写');
    expect(html).not.toContain('AI 策划');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
  });

  it('prefills group when recordId is group id', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="create"
        recordId="1"
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
    );
    expect(html).toContain('城市夜跑团');
  });

  it('renders edit form with existing title and readonly type', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="edit"
        recordId="101"
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
    );
    expect(html).toContain('编辑活动');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('保存修改');
  });

  it('renders AI draft as editable publish form', () => {
    const html = renderPage(
      <InterestGroupActivityFormPage
        mode="create"
        presentation="ai"
        draft={{
          coverUrl: '/activities/basketball.jpg',
          title: '云端晨行 · 登顶看日出',
          groupId: 2,
          categoryKey: 'sport',
          type: 'series',
          seriesSignupMode: 'all',
          sessions: [{ startAt: '2026-06-15 04:30', endAt: '2026-06-15 14:00' }],
          deadlineMode: 'none',
          location: '云栖谷停车场',
          capacity: 24,
          detailHtml: '<p>日出</p>',
        }}
        onBack={() => undefined}
        onSaved={() => undefined}
        onRegenerate={() => undefined}
      />,
    );
    expect(html).toContain('AI 活动策划');
    expect(html).toContain('方案已生成');
    expect(html).toContain('确认并保存活动');
    expect(html).toContain('重新生成');
    expect(html).toContain('云端晨行');
    expect(html).toContain('支持 jpg / png');
    expect(html).not.toContain('重新生成封面');
    expect(html).not.toContain('AI 已生成');
    expect(html).toContain('上传封面');
    expect(html).not.toContain('/activities/basketball.jpg');
  });
});
