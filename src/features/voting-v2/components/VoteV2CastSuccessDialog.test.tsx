import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VoteV2CastSuccessDialog } from './VoteV2CastSuccessDialog';

describe('VoteV2CastSuccessDialog', () => {
  it('explains success and remaining daily votes', () => {
    const html = renderToStaticMarkup(
      <VoteV2CastSuccessDialog hint="今日还可投2票" themeColor="#e54242" onClose={() => undefined} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('投票成功');
    expect(html).toContain('今日还可投2票');
    expect(html).toContain('确定');
  });
});
