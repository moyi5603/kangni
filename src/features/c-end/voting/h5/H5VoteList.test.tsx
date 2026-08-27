import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5VoteList } from './H5VoteList';

describe('H5 vote list', () => {
  it('shows visible ordinary votes and hides honor-style copy', () => {
    const html = renderToStaticMarkup(<H5VoteList />);
    expect(html).toContain('<h1 class="c-h5-title">投票</h1>');
    expect(html).toContain('我的记录');
    expect(html).toContain('href="#/c/h5/vote-2"');
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('创新项目投票');
    expect(html).toContain('优秀员工投票');
    expect(html).toContain('去投票');
    expect(html).not.toContain('季度明星员工与作品');
    expect(html).not.toContain('工装颜色连投测试');
    expect(html).not.toContain('评优');
  });

  it('is mounted from CEndApp votes page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="votes" />);
    expect(html).toContain('<h1 class="c-h5-title">投票</h1>');
    expect(html).toContain('部门团建目的地');
  });
});
