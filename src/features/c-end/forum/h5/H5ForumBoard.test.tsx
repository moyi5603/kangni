import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetForumStoreForTests, addClientTopicComment, addClientTopicReply, deleteClientTopic, deleteClientTopicComment, deleteClientTopicReply, getForumTopic, publishClientTopic, releaseMute, updateClientTopic, setTopicPin, setTopicShelf, toggleClientTopicCommentLike, toggleClientTopicReplyLike, toggleTopicFavorite, toggleTopicLike } from '../../../forum/model/forumStore';
import { H5ForumBoard } from './H5ForumBoard';
import { H5ForumCompose } from './H5ForumCompose';
import { H5ForumTopic } from './H5ForumTopic';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('forum H5', () => {
  it('opens the first board instead of a forum home list', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="forum" />);
    expect(html).toContain('二手论坛');
    expect(html).toContain('c-forum-hero');
    expect(html).not.toContain('c-forum-home-list');
    expect(html).not.toContain('c-forum-home-card');
    expect(html).not.toContain('>建议论坛<');
  });

  it('board follows screenshot structure', () => {
    const html = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(html).toContain('class="c-h5-shell is-forum');
    expect(html).toContain('二手论坛');
    expect(html).toContain('aria-label="搜索帖子"');
    expect(html.indexOf('aria-label="搜索帖子"')).toBeLessThan(html.indexOf('aria-label="帖子分类"'));
    expect(html).not.toContain('加入论坛');
    expect(html).not.toContain('aria-label="消息"');
    expect(html).not.toContain('论坛版规');
    expect(html).not.toContain('>版主<');
    expect(html).toContain('全部');
    expect(html).not.toContain('>热门<');
    expect(html).not.toContain('>精华<');
    expect(html).toContain('闲置转让');
    expect(html).toContain('最新回复');
    expect(html).toContain('最新发布');
    expect(html).toContain('立即发布');
    expect(html).toMatch(/>二手论坛<span[^>]*>\d+帖子<\/span><\/h1>/);
    expect(html.slice(html.indexOf('c-forum-hero'), html.indexOf('c-forum-sheet'))).not.toContain('评论');
    expect(html).not.toContain('全员可看');
    expect(html).toContain('园区内可自提');
    expect(html).toContain('aria-label="展开简介"');
    expect(html).toContain('class="c-forum-hero-overlay"');
    expect(html).toContain('class="c-forum-hero-desc-text"');
    expect(html).toContain('class="c-forum-hero-desc"');
    expect(html).toContain('class="c-forum-user"');
    expect(html).toContain('c-avatar');
    expect(html).toContain('周敏');
    expect(html).toContain('市场品牌部');
    expect(html.indexOf('周敏')).toBeLessThan(html.indexOf('市场品牌部'));
    expect(html).toContain('c-forum-user-date');
    expect(html).toContain('>2026-08-12<');
    expect(html.indexOf('市场品牌部')).toBeLessThan(html.indexOf('>2026-08-12<'));
    expect(html.indexOf('>2026-08-12<')).toBeLessThan(html.indexOf('九成新人体工学椅转让，可自提'));
    expect(html).toContain('class="c-forum-tag"');
    expect(html).toContain('闲置转让');
    expect(html).not.toContain('【闲置转让】');
    expect(html).toContain('九成新人体工学椅转让，可自提');
    expect(html).toContain('闲置27英寸显示器转让');
    expect(html).toContain('【匿名用户】');
    expect(html).toContain('>置顶<');
    const pinIndex = html.indexOf('>置顶<');
    expect(pinIndex).toBeGreaterThan(-1);
    expect(pinIndex).toBeLessThan(html.indexOf('九成新人体工学椅转让，可自提'));
    expect(html.indexOf('九成新人体工学椅转让，可自提')).toBeLessThan(html.indexOf('闲置27英寸显示器转让'));
    expect(html).toContain('href="#/c/h5/forum-topic/1"');
    expect(html).toContain('aria-label="点赞"');
    expect(html).toContain('aria-label="收藏"');
    expect(html).toContain('aria-label="回复 ');
    expect(html).toContain('aria-label="浏览 ');
    expect(html).toContain('src="/forum/secondhand.jpg"');
    expect(html).toContain('class="c-forum-stats"');
    expect(html).toContain('aria-label="更多操作"');
    expect(html.indexOf('aria-label="浏览 ')).toBeLessThan(html.indexOf('aria-label="更多操作"'));
    expect(html).not.toContain('推荐');
    expect(html).toContain('class="c-forum-thumbs"');
    expect(html).toContain('+4张');
    expect(html).toContain('class="c-forum-post-excerpt"');
    expect(html).toContain('椅子使用约一年');
    expect(html.indexOf('class="c-forum-thumbs"')).toBeLessThan(html.indexOf('class="c-forum-post-excerpt"'));
    expect(html.indexOf('椅子使用约一年')).toBeLessThan(html.indexOf('aria-label="点赞"'));
  });

  it('keeps the board cover at 16:9 and clamps the intro to 2 lines', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toMatch(/\.c-forum-hero\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
    expect(css).not.toMatch(/\.c-forum-hero\.is-desc-open\s*\{[^}]*aspect-ratio:\s*auto/s);
    expect(css).toMatch(/\.c-forum-hero-desc-text[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
    expect(css).toMatch(/\.c-forum-post-title[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
    expect(css).toMatch(/\.c-forum-post-excerpt[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
  });

  it('shows admin pin changes on the H5 board list', () => {
    setTopicPin(1, '');
    setTopicPin(4, 'board');
    const html = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(html.indexOf('闲置27英寸显示器转让')).toBeLessThan(html.indexOf('九成新人体工学椅转让，可自提'));
    const displayIndex = html.indexOf('闲置27英寸显示器转让');
    expect(html.slice(displayIndex - 160, displayIndex)).toContain('>置顶<');
  });

  it('mounts board from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="forum-board" forumBoardId={1} />);
    expect(html).toContain('立即发布');
    expect(html).toContain('二手论坛');
  });

  it('lets list like and favorite update counts without opening detail', () => {
    const before = getForumTopic(1)!;
    toggleTopicLike(1);
    toggleTopicFavorite(1);
    const html = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(html).toContain('aria-pressed="true"');
    expect(getForumTopic(1)?.likeCount).toBe(before.likeCount + 1);
    expect(getForumTopic(1)?.favoriteCount).toBe(before.favoriteCount + 1);
  });

  it('opens topic detail from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="forum-topic" forumTopicId={1} />);
    expect(html).toContain('class="c-forum-tag"');
    expect(html).toContain('九成新人体工学椅转让，可自提');
    expect(html).not.toContain('【闲置转让】');
    expect(html).toContain('工作日下班后在园区北门自提');
    expect(html).toContain('还在吗');
    expect(html).toContain('class="c-forum-user"');
    expect(html).toContain('社区运营');
    expect(html).toContain('c-forum-user-date');
    expect(html).toContain('>2026-08-12<');
    expect(html).toContain('>置顶<');
    expect(html).toContain('c-forum-stats is-detail');
    expect(html.indexOf('c-forum-topic-body')).toBeLessThan(html.indexOf('c-forum-stats is-detail'));
    expect(html.indexOf('c-forum-stats is-detail')).toBeLessThan(html.indexOf('c-forum-topic-comments'));
    const stats = html.slice(html.indexOf('c-forum-stats is-detail'), html.indexOf('c-forum-topic-comments'));
    expect(stats.indexOf('aria-label="点赞"')).toBeLessThan(stats.indexOf('aria-label="收藏"'));
    expect(stats.indexOf('aria-label="收藏"')).toBeLessThan(stats.indexOf('aria-label="评论 '));
    expect(stats.indexOf('aria-label="评论 ')).toBeLessThan(stats.indexOf('aria-label="浏览 '));
    expect(stats).toContain('aria-label="更多操作"');
    expect(stats.indexOf('aria-label="浏览 ')).toBeLessThan(stats.indexOf('aria-label="更多操作"'));
    const top = html.slice(html.indexOf('c-h5-top'), html.indexOf('c-h5-main'));
    expect(top).not.toContain('aria-label="编辑帖子"');
    expect(top).not.toContain('aria-label="删除帖子"');
    expect(html).toContain('aria-label="编辑帖子"');
    expect(html.indexOf('c-forum-stats is-detail')).toBeLessThan(html.indexOf('aria-label="编辑帖子"'));
    expect(html.indexOf('aria-label="编辑帖子"')).toBeLessThan(html.indexOf('c-forum-topic-comments'));
  });

  it('shows missing topic empty state', () => {
    expect(renderToStaticMarkup(<H5ForumTopic id={999} />)).toContain('帖子不存在');
  });

  it('hides unshelved and rejected topics on H5 detail', () => {
    setTopicShelf(1, 'off');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).not.toContain('人体工学椅');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('帖子不存在');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).not.toContain('c-forum-topic-body');
    expect(renderToStaticMarkup(<H5ForumTopic id={17} />)).toContain('帖子不存在');
    expect(renderToStaticMarkup(<H5ForumTopic id={17} />)).not.toContain('午间健身');
  });

  it('docks comment like favorite and lets own comments be deleted', () => {
    const html = renderToStaticMarkup(<H5ForumTopic id={1} />);
    expect(html).toContain('c-forum-topic-dock');
    expect(html).toContain('aria-label="写评论"');
    expect(html).toContain('aria-label="点赞"');
    expect(html).toContain('aria-label="收藏"');
    expect(html).toContain('aria-label="回复 周敏"');
    expect(html).toContain('aria-label="回复 唐宇"');
    expect(html).toContain('aria-label="回复 王涛"');
    expect(html.split('aria-label="删除评论"').length - 1).toBe(1);
    expect(html).not.toContain('aria-label="删除回复"');
    expect(addClientTopicComment(1, '')).toEqual({ ok: false, error: '请输入回复内容' });
    releaseMute(1);
    expect(addClientTopicComment(1, '我再问问价格')).toEqual({ ok: true });
    expect(addClientTopicReply(1, 4, '可以的', '唐宇')).toEqual({ ok: true });
    expect(deleteClientTopicComment(1, 4)).toEqual({ ok: false, error: '只能删除自己的评论' });
    expect(deleteClientTopicReply(1, 1, 2)).toEqual({ ok: false, error: '只能删除自己的回复' });
    const mine = getForumTopic(1)!.comments.find((item) => item.content === '我再问问价格')!;
    expect(deleteClientTopicComment(1, mine.id)).toEqual({ ok: true });
    const ownReply = getForumTopic(1)!.comments.find((item) => item.id === 4)!.replies.find((item) => item.author === '周敏')!;
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('aria-label="删除回复"');
    expect(deleteClientTopicReply(1, 4, ownReply.id)).toEqual({ ok: true });
    expect(getForumTopic(1)!.comments.some((item) => item.content === '我再问问价格')).toBe(false);
  });

  it('reminds assigned users to reply and pins their answer', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toMatch(/\.c-forum-need-reply-banner/);
    expect(css).toMatch(/\.c-forum-post\.is-need-reply/);
    const list = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(list).toContain('c-forum-post is-need-reply');
    expect(list).toContain('c-forum-need-reply-banner');
    expect(list).toContain('需要你回复');
    expect(list).toContain('>我来回复<');
    expect(list).not.toContain('em class="c-forum-need-reply"');
    expect(list.indexOf('c-forum-need-reply-banner')).toBeLessThan(list.indexOf('闲置27英寸显示器转让'));
    const detail = renderToStaticMarkup(<H5ForumTopic id={4} />);
    expect(detail).toContain('c-forum-need-reply-banner');
    expect(detail).toContain('c-forum-topic is-need-reply');
    expect(detail).toContain('>我来回复<');
    expect(detail).not.toContain('>置顶<');
    releaseMute(1);
    expect(addClientTopicComment(4, '我来看看成色')).toEqual({ ok: true });
    const mine = getForumTopic(4)!.comments.find((item) => item.content === '我来看看成色')!;
    expect(mine.pinned).toBe(true);
    expect(addClientTopicComment(4, '接口我再拍一张')).toEqual({ ok: true });
    expect(getForumTopic(4)!.comments.find((item) => item.content === '接口我再拍一张')?.pinned).toBeFalsy();
    const after = renderToStaticMarkup(<H5ForumTopic id={4} />);
    expect(after).not.toContain('c-forum-need-reply-banner');
    expect(after).not.toContain('is-need-reply');
    expect(after).toContain('>置顶<');
    expect(after.indexOf('>置顶<')).toBeLessThan(after.indexOf('我来看看成色'));
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).not.toContain('c-forum-need-reply-banner');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).not.toContain('is-need-reply');
  });

  it('lets comments and replies be liked', () => {
    const html = renderToStaticMarkup(<H5ForumTopic id={1} />);
    expect(html).toContain('aria-label="点赞 周敏 的评论"');
    expect(html).toContain('aria-label="点赞 王涛 的回复"');
    expect(html.indexOf('aria-label="点赞 周敏 的评论"')).toBeLessThan(html.indexOf('aria-label="回复 周敏"'));
    expect(toggleClientTopicCommentLike(1, 1)).toEqual({ ok: true });
    expect(getForumTopic(1)!.comments.find((item) => item.id === 1)?.likedBy).toContain('周敏');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('aria-pressed="true"');
    expect(toggleClientTopicCommentLike(1, 1)).toEqual({ ok: true });
    expect(getForumTopic(1)!.comments.find((item) => item.id === 1)?.likedBy).not.toContain('周敏');
    expect(toggleClientTopicReplyLike(1, 1, 2)).toEqual({ ok: true });
    expect(getForumTopic(1)!.comments.find((item) => item.id === 1)?.replies.find((item) => item.id === 2)?.likedBy).toContain('周敏');
    expect(toggleClientTopicReplyLike(1, 99, 1)).toEqual({ ok: false, error: '回复不存在' });
  });

  it('lets comments and replies attach images', () => {
    const html = renderToStaticMarkup(<H5ForumTopic id={1} />);
    expect(html).toContain('aria-label="评论传图"');
    expect(html).toContain('c-forum-dock-media');
    expect(html).not.toContain('c-forum-dock-upload');
    expect(html.indexOf('aria-label="写评论"')).toBeLessThan(html.indexOf('aria-label="评论传图"'));
    releaseMute(1);
    expect(addClientTopicComment(1, '带图评论', ['/c.jpg'])).toEqual({ ok: true });
    expect(addClientTopicReply(1, 4, '带图回复', '唐宇', ['/r.jpg'])).toEqual({ ok: true });
    expect(addClientTopicComment(1, '', [])).toEqual({ ok: false, error: '请输入回复内容' });
    expect(addClientTopicComment(1, '', ['/only.jpg'])).toEqual({ ok: true });
    const after = renderToStaticMarkup(<H5ForumTopic id={1} />);
    expect(after).toContain('c-forum-comment-photos');
    expect(after).toContain('/c.jpg');
    expect(after).toContain('/r.jpg');
    expect(after).toContain('/only.jpg');
    expect(getForumTopic(1)!.comments.find((item) => item.content === '带图评论')?.images).toEqual(['/c.jpg']);
  });

  it('opens large images from the board list and topic detail', () => {
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).toContain('aria-label="查看大图"');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('aria-label="查看大图"');
    releaseMute(1);
    expect(addClientTopicComment(1, '预览图', ['/preview.jpg'])).toEqual({ ok: true });
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('/preview.jpg');
  });

  it('pads topic detail and structures reply threads', () => {
    const html = renderToStaticMarkup(<H5ForumTopic id={1} />);
    expect(html).toContain('c-forum-topic-comments');
    expect(html).toContain('c-forum-comment-head');
    expect(html).toContain('c-forum-comment-main');
    expect(html).toContain('c-forum-comment-body');
    expect(html).toContain('c-forum-comment-replies');
    expect(html).toContain('c-forum-comment-to');
    expect(html).toContain('回复 周敏');
    expect(html).toContain('aria-label="回复排序"');
    expect(html).toContain('>热门<');
    expect(html).toContain('>正序<');
    expect(html).toContain('>倒序<');
    expect(html).not.toContain('回复 周敏：');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toMatch(/\.c-h5-shell\.is-forum \.c-h5-main\.is-detail\.c-forum-topic[\s\S]{0,80}padding:\s*16px 16px/);
  });

  it('compose collects title, content, images and optional single tag', () => {
    const html = renderToStaticMarkup(
      <H5ForumCompose open tags={['闲置转让', '求购']} onClose={() => undefined} onSubmit={() => undefined} />,
    );
    expect(html).toContain('发布帖子');
    expect(html).toContain('aria-label="填写标题"');
    expect(html).toContain('aria-label="填写内容"');
    expect(html).toContain('aria-label="上传图片"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('最多9张');
    expect(html).toContain('aria-label="帖子标签"');
    expect(html).toContain('选填');
    expect(html).toContain('闲置转让');
    expect(html).toContain('求购');
    expect(html).toContain('role="radio"');
    expect(html).not.toContain('匿名发帖');
  });

  it('offers anonymous posting when the board allows it', () => {
    const html = renderToStaticMarkup(
      <H5ForumCompose open allowAnonymous tags={['闲置转让']} onClose={() => undefined} onSubmit={() => undefined} />,
    );
    expect(html).toContain('aria-label="匿名发帖"');
    expect(html).toContain('匿名发帖');
    const created = publishClientTopic({
      boardName: '二手论坛',
      title: '匿名闲置杯',
      content: '可自提',
      images: [],
      tags: [],
      authorAnonymous: true,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(getForumTopic(created.id)?.authorAnonymous).toBe(true);
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).toContain('匿名闲置杯');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).toMatch(/c-forum-user-name">\s*我/);
    expect(addClientTopicComment(created.id, '匿名问问', [], true)).toEqual({ ok: true });
    const topic = getForumTopic(created.id)!;
    expect(topic.comments.at(-1)?.authorAnonymous).toBe(true);
    const mine = renderToStaticMarkup(<H5ForumTopic id={created.id} />);
    expect(mine).toContain('aria-label="匿名评论"');
    expect(mine).toMatch(/c-forum-user-name">\s*我/);
    expect(mine).toMatch(/c-forum-comment-name">\s*我/);
    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).toContain('【匿名用户】');
    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).toMatch(/aria-label="回复 【匿名用户】\d{4}"/);
    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).not.toContain('>方圆<');
    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).not.toContain('>唐宇<');
  });

  it('publishes a composed topic onto the board list', () => {
    expect(publishClientTopic({ boardName: '二手论坛', title: '', content: 'x', images: [], tags: [] })).toEqual({
      ok: false,
      error: '请填写标题',
    });
    expect(publishClientTopic({ boardName: '二手论坛', title: '测试闲置台灯', content: '可自提', images: ['/a.jpg'], tags: ['求购'] })).toMatchObject({
      ok: true,
    });
    const html = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(html).toContain('class="c-forum-tag"');
    expect(html).toContain('测试闲置台灯');
    expect(html).not.toContain('【求购】');
  });

  it('lets the author edit title, content, images and tag', () => {
    const created = publishClientTopic({
      boardName: '二手论坛',
      title: '可编辑原标题',
      content: '原文',
      images: ['/old.jpg'],
      tags: ['求购'],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(updateClientTopic(4, { title: '别人的帖', content: 'x', images: [] })).toEqual({ ok: false, error: '只能编辑自己的帖子' });
    expect(
      updateClientTopic(created.id, { title: '台灯改标题', content: '新正文', images: ['/new.jpg'], tags: ['闲置转让'] }),
    ).toEqual({ ok: true });
    const updated = getForumTopic(created.id)!;
    expect(updated.title).toBe('台灯改标题');
    expect(updated.content).toBe('新正文');
    expect(updated.images).toEqual(['/new.jpg']);
    expect(updated.tags).toEqual(['闲置转让']);
    const detail = renderToStaticMarkup(<H5ForumTopic id={created.id} />);
    expect(detail).toContain('aria-label="编辑帖子"');
    expect(detail).toContain('aria-label="删除帖子"');
    expect(detail).toContain('class="c-forum-tag"');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('aria-label="删除帖子"');
    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).not.toContain('aria-label="编辑帖子"');
    const list = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(list).toContain('aria-label="更多操作"');
    expect(list).toContain('c-forum-own-menu');
    expect(detail).toContain('aria-label="更多操作"');
    const detailTop = detail.slice(detail.indexOf('c-h5-top'), detail.indexOf('c-h5-main'));
    expect(detailTop).not.toContain('aria-label="编辑帖子"');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toMatch(/\.c-forum-own-menu/);
    expect(css).toMatch(/\.c-forum-edit\.is-danger/);
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).toContain('aria-label="删除帖子"');
    expect(deleteClientTopic(4)).toEqual({ ok: false, error: '只能删除自己的帖子' });
    expect(deleteClientTopic(created.id)).toEqual({ ok: true });
    expect(getForumTopic(created.id)).toBeUndefined();
    const editForm = renderToStaticMarkup(
      <H5ForumCompose
        open
        mode="edit"
        tags={['闲置转让', '求购']}
        initial={{ title: updated.title, content: updated.content, images: updated.images, tag: updated.tags[0] }}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(editForm).toContain('编辑帖子');
    expect(editForm).toContain('台灯改标题');
    expect(editForm).toContain('aria-label="帖子标签"');
  });
});
