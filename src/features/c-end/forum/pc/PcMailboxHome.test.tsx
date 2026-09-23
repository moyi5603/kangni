import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialTopics } from '../../../forum/model/forum';
import { __resetForumStoreForTests } from '../../../forum/model/forumStore';
import { PcMailboxHome } from './PcMailboxHome';
import { CEndEmptyPreviewProvider } from '../../portal/emptyPreview';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('mailbox PC', () => {
  it('renders the wide mailbox list', () => {
    const html = renderToStaticMarkup(<PcMailboxHome />);
    expect(html).toContain('c-pc-shell is-mailbox');
    expect(html).not.toContain('c-h5-shell');
    expect(html).toContain('信箱列表');
    expect(html).toContain('战略发展建言');
    expect(html).toContain('员工体验建言');
    expect(html).toContain('李明远 · 经营管理中心');
    expect(html).toContain('周岚 · 人力资源部');
    expect(html).not.toContain('条建言');
    expect(html).not.toContain('负责人 ·');
    expect(html).toContain('我的建言');
    expect(html).toContain('aria-label="提交 战略发展建言"');
    expect(html).not.toContain('c-forum-compose-tags');
    const topic = initialTopics.find((item) => item.title === '关于跨部门重点项目协同机制的建议');
    expect(html).toContain(`href="#/c/pc/mailbox/${topic!.id}"`);
    expect(html).not.toContain('href="#/c/h5/mailbox/');
    expect(html).toContain('class="c-mailbox-kind is-done">已回复<');
    expect(html).toContain('class="c-mailbox-kind is-wait">处理中<');
    expect(html).toContain('src="/activities/open-day.jpg"');
    expect(html).toContain('c-mailbox-item-photos');
  });

  it('shows 已有 0 条建言 on the empty preview', () => {
    const html = renderToStaticMarkup(
      <CEndEmptyPreviewProvider empty>
        <PcMailboxHome />
      </CEndEmptyPreviewProvider>,
    );
    expect(html).toContain('已有 0 条建言');
    expect(html).not.toContain('暂无建言');
  });

  it('shows one proposal per row', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).not.toMatch(/\.c-mailbox-pc \.c-mailbox-list\s*\{[^}]*repeat\(2/s);
    expect(css).not.toMatch(/\.c-mailbox-pc-detail\s*\{[^}]*max-width:\s*760px/s);
    expect(css).toMatch(/\.c-mailbox-pc-detail\s*\{[^}]*max-width:\s*none/s);
    expect(css).toMatch(/\.c-mailbox-pc \.c-mailbox-item-photos\s*\{[^}]*width:\s*50%/s);
  });

  it('mounts list and detail from CEndApp', () => {
    const list = renderToStaticMarkup(<CEndApp surface="pc" h5Page="mailbox" />);
    expect(list).toContain('c-pc-shell is-mailbox');
    expect(list).toContain('信箱列表');
    const replied = initialTopics.find((item) => item.title.includes('建议尽快建立跨部门重点项目统一里程碑'));
    const detail = renderToStaticMarkup(<CEndApp surface="pc" h5Page="mailbox-topic" forumTopicId={replied!.id} />);
    expect(detail).toContain('建言详情');
    expect(detail).toContain('c-mailbox-detail-card');
    expect(detail).toContain('>回复<');
    expect(detail).not.toContain('负责人回复');
    expect(detail).toContain('跨部门例会已排进本周节奏');
    expect(detail).toContain('href="#/c/pc/mailbox"');
    expect(detail).not.toContain('写评论');
  });
});
