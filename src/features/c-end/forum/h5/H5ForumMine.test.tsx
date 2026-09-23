import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetForumStoreForTests } from '../../../forum/model/forumStore';
import { H5ForumMine } from './H5ForumMine';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('forum H5 mine', () => {
  it('opens my posts from a dedicated portal route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="forum-mine" />);
    expect(html).toContain('>我的帖子<');
    expect(html).toContain('人体工学椅');
    expect(html).toContain('低糖早餐');
    expect(html).toContain('晚班通勤');
    expect(html).toContain('二手论坛');
    expect(html).toContain('建议论坛');
    expect(html).not.toContain('显示器转让');
    expect(html).not.toContain('跨部门重点项目协同');
    expect(html).toContain('href="#/c/h5/forum-topic/1"');
    expect(html).toContain('aria-label="更多操作"');
    expect(html).not.toContain('c-forum-hero');
    expect(html).not.toContain('立即发布');
    expect(html).not.toContain('>置顶<');
    expect(html).not.toContain('c-forum-user');
    expect(html).not.toContain('需要你回复');
    expect(html).toContain('c-forum-mine-post');
    expect(html.indexOf('人体工学椅')).toBeLessThan(html.indexOf('低糖早餐'));
    expect(html.indexOf('低糖早餐')).toBeLessThan(html.indexOf('晚班通勤'));
    expect(html).toContain('class="c-forum-post-excerpt"');
    expect(html).toContain('椅子使用约一年');
  });

  it('renders the mine list without board search tabs', () => {
    const html = renderToStaticMarkup(<H5ForumMine />);
    expect(html).toContain('c-h5-shell is-forum');
    expect(html).not.toContain('aria-label="搜索帖子"');
    expect(html).not.toContain('aria-label="帖子分类"');
  });
});
