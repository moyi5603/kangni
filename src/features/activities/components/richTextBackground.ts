const blockBgAttr = 'data-rt-block-bg';

export function readRichTextBlockBackground(html: string): string | undefined {
  const match = html.match(new RegExp(`${blockBgAttr}[^>]*style="[^"]*background:\\s*([^;"']+)`, 'i'));
  return match?.[1]?.trim();
}

export function unwrapRichTextBlockBackground(html: string): string {
  const trimmed = html.trim();
  const match = trimmed.match(new RegExp(`^<div[^>]*${blockBgAttr}[^>]*>([\\s\\S]*)<\\/div>$`, 'i'));
  return match ? match[1] : html;
}

export function applyRichTextBlockBackground(html: string, color: string | null): string {
  const inner = unwrapRichTextBlockBackground(html);
  if (!color) return inner;
  return `<div ${blockBgAttr}="1" style="background:${color}">${inner}</div>`;
}
