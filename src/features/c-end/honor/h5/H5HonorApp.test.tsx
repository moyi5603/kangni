import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5HonorApp } from './H5HonorApp';

describe('H5 honor employee home', () => {
  it('matches employee home screenshot copy below the H5 header', () => {
    const html = renderToStaticMarkup(<H5HonorApp />);

    expect(html).toContain('荣誉 Agent');
    expect(html).toContain('Hi，');
    expect(html).toContain('陈志远');
    expect(html).toContain('等你投票');
    expect(html).toContain('邀你提报');
    expect(html).toContain('我的提报');
    expect(html).toContain('累计获奖');
    expect(html).toContain('排名');
    expect(html).toContain('评优活动');
    expect(html).toContain('进行中的活动');
    expect(html).toContain('查看全部');
    expect(html).toContain('2025年度最佳创新项目');
    expect(html).toContain('Q2季度最佳员工');
    expect(html).toContain('投票中');
    expect(html).toContain('征集中');
    expect(html).toContain('份提名');
    expect(html).toContain('荣誉殿堂');
    expect(html).toContain('冠军');
    expect(html).not.toContain('我的获奖');
    expect(html).not.toContain('物流科技事业部');
    expect(html).not.toContain('智能体');
    expect(html).toContain('员工视角');
    expect(html).toContain('class="c-emp-date-row"');
    expect(html).toContain('class="c-emp-role"');
  });

  it('is mounted from CEndApp honor route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="honor" />);

    expect(html).toContain('荣誉 Agent');
    expect(html).toContain('class="c-h5-shell is-honor');
  });

  it('uses the standard H5 header and a home FAB', () => {
    const html = renderToStaticMarkup(<H5HonorApp />);

    expect(html).toContain('class="c-h5-top"');
    expect(html).toContain('class="c-h5-title"');
    expect(html).toContain('aria-label="返回"');
    expect(html).toContain('class="c-h5-detail-fab is-home"');
    expect(html).toContain('回主页');
    expect(html).not.toContain('返回上一页');
    expect(html).not.toContain('切管理视角');
    expect(html).not.toContain('切员工视角');
    expect(html).not.toContain('M10 2.5c-.8 0-1.5.6-1.6 1.4C6.5 4.5');
  });

  it('opens manager home from the honor-admin route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="honor-admin" />);

    expect(html).toContain('发起评优');
    expect(html).toContain('回主页');
    expect(html).toContain('管理视角');
    expect(html).toContain('class="c-h5-top"');
    expect(html).toContain('荣誉 Agent');
  });
});

describe('H5 honor manager home', () => {
  it('matches manager home screenshot copy below the H5 header', () => {
    const html = renderToStaticMarkup(<H5HonorApp initialRole="hr" />);

    expect(html).toContain('class="c-h5-top"');
    expect(html).toContain('荣誉 Agent');
    expect(html).toContain('aria-label="返回"');
    expect(html).toContain('Hi,');
    expect(html).toContain('张晓东');
    expect(html).toContain('个活动进行中');
    expect(html).toContain('已收到');
    expect(html).toContain('份提名');
    expect(html).toContain('发起评优');
    expect(html).toContain('全部活动');
    expect(html).toContain('荣誉殿堂');
    expect(html).toContain('荣誉概览');
    expect(html).toContain('近1月');
    expect(html).toContain('活动数');
    expect(html).toContain('提名数');
    expect(html).toContain('投票数');
    expect(html).toContain('进行中的活动');
    expect(html).toContain('更多');
    expect(html).toContain('2025年度最佳创新项目');
    expect(html).toContain('Q2季度最佳员工');
    expect(html).toContain('投票中');
    expect(html).toContain('征集中');
    expect(html).toContain('HR总监');
    expect(html).toContain('项目');
    expect(html).toContain('个人');
    expect(html).not.toContain('早上好');
    expect(html).not.toContain('AI 洞察');
    expect(html).not.toContain('智能体');
    expect(html).not.toContain('评优营');
    expect(html).not.toContain('切管理视角');
  });

  it('keeps the standard H5 header without screenshot chrome', () => {
    const html = renderToStaticMarkup(<H5HonorApp initialRole="hr" />);

    expect(html).toContain('class="c-h5-title"');
    expect(html).toContain('class="c-h5-detail-fab is-home"');
    expect(html).not.toContain('返回上一页');
  });
});
