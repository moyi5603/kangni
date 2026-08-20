import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActivityDeleteConfirm } from './ActivityDeleteConfirm';
import { H5DeleteSheet } from '../h5/H5DeleteSheet';
import { PcDeleteModal } from '../pc/PcDeleteModal';

const noop = () => undefined;

describe('activity delete confirm', () => {
  it('renders title, cascade copy, and actions', () => {
    const html = renderToStaticMarkup(<ActivityDeleteConfirm onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('删除评论');
    expect(html).toContain('删除后将同时删除其下回复，且无法恢复。');
    expect(html).toContain('确认删除');
    expect(html).toContain('取消');
  });

  it('wraps confirm in an H5 sheet dialog', () => {
    const html = renderToStaticMarkup(<H5DeleteSheet onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('c-sheet');
    expect(html).toContain('aria-label="删除评论"');
    expect(html).toContain('确认删除');
  });

  it('wraps confirm in a PC modal dialog', () => {
    const html = renderToStaticMarkup(<PcDeleteModal onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('c-modal');
    expect(html).toContain('aria-label="删除评论"');
    expect(html).toContain('确认删除');
  });
});
