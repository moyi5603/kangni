import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { resetEngagement, toggleFavorite } from '../model/engagementStore';
import { PcMyFavorites } from './PcMyFavorites';

describe('PC my favorites', () => {
  afterEach(() => {
    resetEngagement();
  });

  it('renders seed favorites', () => {
    const html = renderToStaticMarkup(<PcMyFavorites />);
    expect(html).toContain('我的收藏');
    expect(html).toContain('新员工入职训练营');
    expect(html).toContain('中秋员工晚会');
    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('进行中');
    expect(html).toContain('未开始');
    expect(html).not.toContain('还没有收藏活动');
  });

  it('drops a row after unfavorite', () => {
    toggleFavorite(2);
    const html = renderToStaticMarkup(<PcMyFavorites />);
    expect(html).not.toContain('新员工入职训练营');
    expect(html).toContain('中秋员工晚会');
  });

  it('shows empty state when none left', () => {
    toggleFavorite(2);
    toggleFavorite(9);
    const html = renderToStaticMarkup(<PcMyFavorites />);
    expect(html).toContain('还没有收藏活动');
    expect(html).toContain('去看看活动');
  });

  it('mounts from CEndApp favorites hash page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="favorites" />);
    expect(html).toContain('我的收藏');
    expect(html).toContain('新员工入职训练营');
  });
});
