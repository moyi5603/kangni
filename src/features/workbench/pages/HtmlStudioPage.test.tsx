import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HtmlStudioPage } from './HtmlStudioPage';

describe('HtmlStudioPage', () => {
  it('embeds H5 studio html 1:1 in an iframe', () => {
    const html = renderToStaticMarkup(
      <HtmlStudioPage src="/decoration/h5.html" title="H5装修" />,
    );
    expect(html).toContain('iframe');
    expect(html).toMatch(/src="\/decoration\/h5\.html\?rev=/);
    expect(html).toContain('title="H5装修"');
    expect(html).toContain('html-studio-frame');
  });

  it('embeds PC studio html 1:1 in an iframe', () => {
    const html = renderToStaticMarkup(
      <HtmlStudioPage src="/decoration/pc.html" title="PC装修" />,
    );
    expect(html).toMatch(/src="\/decoration\/pc\.html\?rev=/);
    expect(html).toContain('title="PC装修"');
  });
});
