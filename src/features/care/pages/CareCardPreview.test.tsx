import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CareCardPreview, clampCardTextPercent } from './CareCardPreview';

describe('clampCardTextPercent', () => {
  it('keeps overlay inside the card', () => {
    expect(clampCardTextPercent(-20)).toBe(8);
    expect(clampCardTextPercent(50)).toBe(50);
    expect(clampCardTextPercent(200)).toBe(92);
  });
});

describe('CareCardPreview', () => {
  it('puts copy on the image and exposes a drag handle', () => {
    const html = renderToStaticMarkup(
      <CareCardPreview
        cover="/poster.png"
        blessing="【员工姓名】，愿新的一岁心中有光"
        offset={{ x: 50, y: 72 }}
        onOffsetChange={() => {}}
      />,
    );
    expect(html).toContain('care-card-preview__img');
    expect(html).not.toContain('care-card-preview__img--crop');
    expect(html).toContain('拖动调整贺卡文案位置');
    expect(html).toContain('愿新的一岁心中有光');
    expect(html).toContain('【员工姓名】');
    expect(html).not.toContain('人力资源部');
    expect(html).not.toContain('填写落款后将在这里实时预览');
    expect(html).toContain('left:50%');
    expect(html).toContain('top:72%');
  });

  it('renders formatted 贺卡文案 html on the card', () => {
    const html = renderToStaticMarkup(
      <CareCardPreview
        cover="/poster.png"
        blessing="<b>生日快乐</b>"
        offset={{ x: 50, y: 72 }}
        onOffsetChange={() => {}}
      />,
    );
    expect(html).toContain('<b>生日快乐</b>');
  });
});
