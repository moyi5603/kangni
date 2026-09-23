import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ContestGateResult } from './ContestGateResult';

describe('ContestGateResult', () => {
  it('mirrors exam result chrome for a passed gate', () => {
    const html = renderToStaticMarkup(
      <ContestGateResult
        gateIndex={0}
        passed
        durationSeconds={12}
        correctCount={4}
        accuracy={80}
        userId="王磊"
        onBack={() => undefined}
      />,
    );
    expect(html).toContain('class="c-h5-shell is-exam is-result');
    expect(html).toContain('闯关结果');
    expect(html).toContain('已通过');
    expect(html).toContain('答对');
    expect(html).toContain('<small>题过关</small>');
    expect(html).toContain('正确率');
    expect(html).toContain('80%');
    expect(html).not.toContain('得分');
    expect(html).not.toContain('总分');
    expect(html).not.toContain('及格分');
    expect(html).not.toContain('<small>分</small>');
    expect(html).toContain('答题时长');
    expect(html).toContain('12秒');
    expect(html).toContain('第1关');
    expect(html).toContain('王磊');
    expect(html).toContain('返回地图');
  });
});
