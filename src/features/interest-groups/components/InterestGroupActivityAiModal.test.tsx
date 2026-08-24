import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupActivityAiForm } from './InterestGroupActivityAiModal';

function FormHarness() {
  const [form] = Form.useForm<{ prompt: string }>();
  return <InterestGroupActivityAiForm form={form} />;
}

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupActivityAiForm', () => {
  it('uses labeled horizontal fields instead of placeholder-only composer', () => {
    const html = renderPage(<FormHarness />);
    expect(html).toContain('想法');
    expect(html).toContain('示例');
    expect(html).toContain('每周三下班后组织一次滨江夜跑');
    expect(html).toContain('登山看日出');
    expect(html).toContain('桌游局');
    expect(html).toContain('ig-ai-example');
  });
});
