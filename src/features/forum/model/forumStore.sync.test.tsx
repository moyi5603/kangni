import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from 'antd';
import { draftFromBoard, filterTopics } from './forum';
import {
  __resetForumStoreForTests,
  addClientTopicComment,
  addMute,
  getForumBoard,
  getForumBoards,
  getForumTopic,
  getForumTopics,
  publishClientTopic,
  releaseMute,
  saveForumBoard,
  setForumBoardStatus,
} from './forumStore';
import { H5ForumBoard } from '../../c-end/forum/h5/H5ForumBoard';
import { H5ForumTopic } from '../../c-end/forum/h5/H5ForumTopic';
import { ForumTopicDetailPage } from '../pages/ForumTopicDetailPage';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('forum store H5/admin sync', () => {
  it('renames boardName on topics when the board is renamed', () => {
    const board = getForumBoard(1)!;
    const result = saveForumBoard({ ...draftFromBoard(board), name: '闲置市集' }, 1);
    expect(result.ok).toBe(true);
    expect(getForumTopic(1)?.boardName).toBe('闲置市集');
    expect(getForumTopic(4)?.boardName).toBe('闲置市集');
    const html = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(html).toContain('闲置市集');
    expect(html).toContain('人体工学椅');
    expect(html).toContain('闲置27英寸显示器');
  });

  it('blocks client comments while 周敏 is muted and writes after release', () => {
    expect(addMute({ user: '周敏', department: '市场品牌部', reason: '测试禁言' })).toEqual({ ok: true });
    const before = getForumTopic(4)!.comments.length;
    expect(addClientTopicComment(4, '禁言时不该写入')).toEqual({ ok: false, error: '你已被禁言' });
    expect(getForumTopic(4)!.comments).toHaveLength(before);

    releaseMute(3);
    expect(addClientTopicComment(4, 'H5联动回复')).toEqual({ ok: true });
    const last = getForumTopic(4)!.comments.at(-1);
    expect(last).toMatchObject({ author: '周敏', content: 'H5联动回复' });

    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).toContain('H5联动回复');
    const admin = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="forum" recordId="4" onBack={() => undefined} />
      </App>,
    );
    expect(admin).toContain('周敏');
    expect(admin).toContain('H5联动回复');
  });

  it('shows H5 published topics in admin topic filter', () => {
    const created = publishClientTopic({
      boardName: '二手论坛',
      title: 'H5联动新帖',
      content: '可自提',
      images: [],
      tags: ['求购'],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const rows = filterTopics(getForumTopics(), getForumBoards(), { kind: 'forum', boardName: '二手论坛' });
    expect(rows.some((item) => item.id === created.id && item.title === 'H5联动新帖')).toBe(true);
  });

  it('hides disabled boards on H5', () => {
    setForumBoardStatus(1, 'disabled');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).toContain('论坛不存在或已停用');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).not.toContain('人体工学椅');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('帖子不存在');
  });
});
