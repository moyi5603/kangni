import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialTopics } from '../../../forum/model/forum';
import { __resetForumStoreForTests, publishClientTopic } from '../../../forum/model/forumStore';
import { H5MailboxHome, MAILBOX_H5_DIRECTIONS } from './H5MailboxHome';
import { CEndEmptyPreviewProvider } from '../../portal/emptyPreview';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('mailbox H5', () => {
  it('follows the private proposal screenshot', () => {
    const html = renderToStaticMarkup(<H5MailboxHome />);
    expect(html).toContain('class="c-h5-shell is-mailbox"');
    expect(html).not.toContain('PRIVATE PROPOSAL');
    expect(html).toContain('信箱列表');
    expect(html).not.toContain('选择建言方向');
    expect(html).not.toContain('内容仅你与对应负责人可见');
    expect(html).not.toContain('c-mailbox-hint');
    expect(html).toContain('class="c-mailbox-hero-bar"');
    expect(html).toContain('战略发展建言');
    expect(html).toContain('李明远 · 经营管理中心');
    expect(html).not.toContain('条建言');
    expect(html).not.toContain('暂无建言');
    expect(html).not.toContain('负责人 ·');
    expect(html).toContain('aria-label="提交 战略发展建言"');
    expect(html).toContain('aria-label="提交 员工体验建言"');
    expect(html).not.toContain('c-mailbox-submit');
    expect(html).not.toContain('>提交<');
    expect(html.indexOf('业务创新')).toBeLessThan(html.indexOf(MAILBOX_H5_DIRECTIONS[0]!.purpose));
    expect(html.indexOf('组织管理')).toBeLessThan(html.indexOf(MAILBOX_H5_DIRECTIONS[1]!.purpose));
    expect(html).toContain('战略发展');
    expect(html).toContain('业务创新');
    expect(html).toContain('流程优化');
    expect(html).toContain('员工体验建言');
    expect(html).toContain('周岚 · 人力资源部');
    expect(html).toContain('组织管理');
    expect(html).toContain('企业文化');
    expect(MAILBOX_H5_DIRECTIONS[0]!.purpose.length).toBeGreaterThanOrEqual(45);
    expect(MAILBOX_H5_DIRECTIONS[0]!.purpose.length).toBeLessThanOrEqual(55);
    expect(MAILBOX_H5_DIRECTIONS[1]!.purpose.length).toBeGreaterThanOrEqual(75);
    expect(MAILBOX_H5_DIRECTIONS[1]!.purpose.length).toBeLessThanOrEqual(85);
    expect(html).toContain('aria-label="展开简介"');
    expect(html).toContain('class="c-mailbox-purpose"');
    expect(html).toContain('我的建言');
    expect(html).not.toContain('周敏');
    expect(html).not.toContain('市场品牌部');
    expect(html).not.toContain('c-mailbox-avatar');
    expect(html).not.toContain('c-mailbox-dept');
    expect(html).toContain('class="c-mailbox-kind"');
    expect(html).toContain('>实名<');
    expect(html).not.toContain('实名建言');
    expect(html).not.toContain('匿名建言');
    expect(html).toContain('处理中');
    expect(html).toContain('已回复');
    expect(html).toContain('2026-08-18 14:30:00');
    expect(html).not.toContain('致李明远');
    expect(html).toContain('关于跨部门重点项目协同机制的建议');
    expect(html).toContain('建议尽快建立跨部门重点项目统一里程碑、固定协同例会以及问题升级通道');
    expect(html).toContain('class="c-mailbox-kind is-done">已回复<');
    expect(html).toContain('class="c-mailbox-kind is-wait">处理中<');
    expect(html).not.toContain('<p class="c-mailbox-purpose"');
    expect(html).not.toContain('致李明远');
    const mineCard = html.slice(html.indexOf('关于跨部门重点项目协同机制的建议'));
    expect(mineCard.indexOf('class="c-mailbox-box">战略发展建言<')).toBeLessThan(mineCard.indexOf('>实名<'));
    expect(mineCard.indexOf('class="c-mailbox-box"')).toBeLessThan(mineCard.indexOf('>实名<'));
    expect(mineCard).toContain('class="c-mailbox-kind is-wait">处理中<');
    expect(mineCard).not.toContain('c-mailbox-status');
    expect(html).toContain('建议为重点项目建立统一里程碑和固定协同机制');
    const topic = initialTopics.find((item) => item.title === '关于跨部门重点项目协同机制的建议');
    expect(html).toContain(`href="#/c/h5/mailbox/${topic!.id}"`);
    expect(html).not.toContain('href="#/c/h5/forum-topic/');
    expect(html).toContain('src="/activities/open-day.jpg"');
    expect(html).toContain('src="/activities/share.jpg"');
    expect(html).toContain('c-mailbox-item-photos');
  });

  it('shows 已有 0 条建言 on the empty preview', () => {
    const html = renderToStaticMarkup(
      <CEndEmptyPreviewProvider empty>
        <H5MailboxHome />
      </CEndEmptyPreviewProvider>,
    );
    expect(html).toContain('已有 0 条建言');
    expect(html).not.toContain('暂无建言');
    expect(html).not.toContain('关于跨部门重点项目协同机制的建议');
  });

  it('keeps the back button in flow with the title', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toMatch(/\.c-mailbox-hero-bar\s*\{[^}]*display:\s*flex/s);
    expect(css).not.toMatch(/\.c-mailbox-back\s*\{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.c-mailbox-purpose[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
    expect(css).toMatch(/\.c-mailbox-purpose\.is-open[^{]*\{[^}]*-webkit-line-clamp:\s*unset/s);
    expect(css).toMatch(/\.c-mailbox-list\s*\{[^}]*gap:\s*1[24]px/s);
    expect(css).toMatch(/\.c-mailbox-item h3[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
    expect(css).toMatch(/\.c-mailbox-excerpt[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
    expect(css).toMatch(/\.c-mailbox-purpose[^{]*\{[^}]*font-size:\s*12px/s);
    expect(css).toMatch(/\.c-mailbox-tags\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
    expect(css).toMatch(/\.c-mailbox-photo\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*4/s);
    expect(css).toMatch(/\.c-mailbox-pc \.c-mailbox-photo\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*4/s);
    expect(css).not.toMatch(/p\.c-mailbox-purpose/);
    expect(css).toMatch(/\.c-mailbox-kind\.is-wait\s*\{[^}]*background:\s*#fff4e5/s);
    expect(css).toMatch(/\.c-mailbox-kind\.is-done\s*\{[^}]*background:\s*#e7f6ee/s);
    expect(css).toMatch(/\.c-mailbox-detail-card\s*\{[^}]*border-radius:\s*22px/s);
    expect(css).toMatch(/\.c-mailbox-detail-reply\s*\{[^}]*border-radius:\s*22px/s);
    expect(css).toMatch(/\.c-mailbox-detail-reply\s*\{[^}]*background:\s*#f3faf6/s);
    expect(css).not.toMatch(/\.c-mailbox-status\s*\{[^}]*background:\s*#fff1e0/s);
  });

  it('mounts from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="mailbox" />);
    expect(html).toContain('信箱列表');
    expect(html).not.toContain('选择建言方向');
    expect(html).toContain('战略发展建言');
  });

  it('omits tag picker from 提交建言 compose', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'H5MailboxHome.tsx'), 'utf8');
    expect(src).toContain('heading="提交建言"');
    expect(src).toContain('tags={[]}');
    expect(src).not.toContain('tags={[...direction.tags]}');
    expect(src).toContain('tags: []');
    expect(src).not.toContain('tags: draft.tag ? [draft.tag] : []');
  });

  it('lists newly submitted proposals under 我的建言', () => {
    publishClientTopic({
      boardName: '经营发展',
      title: '建议缩短跨部门审批链路',
      content: '把并行评审改成一次会签。',
      images: [],
      tags: ['战略发展'],
    });
    const html = renderToStaticMarkup(<H5MailboxHome />);
    expect(html).toContain('建议缩短跨部门审批链路');
    expect(html).toContain('把并行评审改成一次会签');
    expect(html).toContain('>实名<');
  });

  it('shows 匿名 tag when the mailbox allows anonymous and the proposal is anonymous', () => {
    publishClientTopic({
      boardName: '经营发展',
      title: '匿名提交的流程建议',
      content: '希望审批节点更少。',
      images: [],
      tags: ['流程优化'],
      authorAnonymous: true,
    });
    const html = renderToStaticMarkup(<H5MailboxHome />);
    expect(html).toContain('匿名提交的流程建议');
    expect(html).toContain('>匿名<');
    expect(html).not.toContain('周敏');
    expect(html).not.toContain('市场品牌部');
  });

  it('opens mailbox proposal detail instead of 帖子不存在', () => {
    const pending = initialTopics.find((item) => item.title === '关于跨部门重点项目协同机制的建议');
    const replied = initialTopics.find((item) => item.title.includes('建议尽快建立跨部门重点项目统一里程碑'));
    expect(pending).toBeTruthy();
    expect(replied).toBeTruthy();
    const pendingHtml = renderToStaticMarkup(<CEndApp surface="h5" h5Page="mailbox-topic" forumTopicId={pending!.id} />);
    expect(pendingHtml).toContain('class="c-h5-shell is-mailbox"');
    expect(pendingHtml).toContain('建言详情');
    expect(pendingHtml).not.toContain('帖子不存在');
    expect(pendingHtml).not.toContain('写评论');
    expect(pendingHtml).toContain('c-mailbox-detail-card');
    expect(pendingHtml).toContain('class="c-mailbox-kind is-wait">处理中<');
    expect(pendingHtml).toContain('关于跨部门重点项目协同机制的建议');
    expect(pendingHtml).toContain('建议为重点项目建立统一里程碑和固定协同机制');
    expect(pendingHtml).toContain('战略发展建言');
    expect(pendingHtml).toContain('处理中');
    expect(pendingHtml).toContain('src="/activities/open-day.jpg"');
    expect(pendingHtml).toContain('c-mailbox-detail-photos');
    const repliedHtml = renderToStaticMarkup(<CEndApp surface="h5" h5Page="mailbox-topic" forumTopicId={replied!.id} />);
    expect(repliedHtml).toContain('员工体验建言');
    expect(repliedHtml).toContain('class="c-mailbox-kind is-done">已回复<');
    expect(repliedHtml).toContain('c-mailbox-detail-reply');
    expect(repliedHtml).toContain('>回复<');
    expect(repliedHtml).not.toContain('负责人回复');
    expect(repliedHtml).toContain('该建议希望把跨部门项目的节点');
    expect(repliedHtml).toContain('已收到建议，将按统一里程碑和例会机制推进');
    expect(repliedHtml).toContain('跨部门例会已排进本周节奏');
    expect(repliedHtml.split('c-mailbox-detail-reply-item').length - 1).toBeGreaterThanOrEqual(2);
    expect(repliedHtml).toContain('src="/activities/share.jpg"');
    expect(repliedHtml).toContain('src="/activities/webinar.jpg"');
  });
});
