import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { patchDecoBlock } from '../../activities/model/activityDecoration';
import {
  getActivityDecoration,
  resetActivityDecoration,
  saveActivityDecoration,
} from '../../activities/model/activityDecorationStore';
import { patchDecoBlock as patchSharedDecoBlock } from '../../../shared/decoration/decoTypes';
import { getIgDecoration, resetIgDecoration, saveIgDecoration } from '../../interest-groups/model/igDecorationStore';
import {
  getVoteV2Decoration,
  resetVoteV2Decoration,
  saveVoteV2Decoration,
} from '../../voting-v2/model/voteV2DecorationStore';
import { CEndPortal } from './CEndPortal';
import { resetCEndPreviewDecorations } from './resetCEndPreviewDecorations';

afterEach(() => {
  resetActivityDecoration();
  resetIgDecoration();
  resetVoteV2Decoration();
});

describe('C-end portal', () => {
  it('uses four portal cards per row', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'styles.css'), 'utf8');
    expect(css).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))');
  });

  it('lists activity, vote, and interest-group entries without course, exam, or honor', () => {
    const html = renderToStaticMarkup(<CEndPortal />);

    expect(html).toContain('C 端预览');
    expect(html).toContain('恢复默认');
    expect(html).toContain('aria-label="恢复默认"');
    expect(html).toContain('>活动 PC<');
    expect(html).toContain('href="#/c/pc"');
    expect(html).toContain('>活动 H5<');
    expect(html).toContain('href="#/c/h5"');
    expect(html).not.toContain('>课程 PC<');
    expect(html).not.toContain('href="#/c/course"');
    expect(html).not.toContain('>课程 H5<');
    expect(html).not.toContain('href="#/c/h5/courses"');
    expect(html).not.toContain('>考试 PC<');
    expect(html).not.toContain('href="#/c/exam"');
    expect(html).not.toContain('>考试 H5<');
    expect(html).not.toContain('href="#/c/h5/exams"');
    expect(html).toContain('>投票 H5<');
    expect(html).toContain('href="#/c/h5/votes-v2"');
    expect(html).toContain('评选投票 · 手机');
    expect(html).toContain('>投票 PC<');
    expect(html).toContain('href="#/c/pc/votes-v2"');
    expect(html).toContain('评选投票 · 宽屏门户');
    expect(html).not.toContain('投票-废弃');
    expect(html).not.toContain('href="#/c/h5/votes"');
    expect(html).not.toContain('href="#/c/pc/votes"');
    expect(html).not.toContain('普通投票 · 手机');
    expect(html).not.toContain('普通投票 · 宽屏门户');
    expect(html).toContain('>兴趣圈 H5<');
    expect(html).toContain('href="#/c/h5/interest-groups"');
    expect(html).toContain('兴趣圈 · 手机');
    expect(html).toContain('>兴趣圈 PC<');
    expect(html).toContain('href="#/c/pc/interest-groups"');
    expect(html).toContain('兴趣圈 · 宽屏门户');
    expect(html).not.toContain('评优 H5');
    expect(html).not.toContain('href="#/c/h5/honor"');
    expect(html).not.toContain('href="#/c/h5/honor-admin"');
    expect(html).not.toContain('>打卡 H5<');
    expect(html).not.toContain('href="#/c/h5/daily-checkin"');
    expect(html).not.toContain('每日打卡 · 手机');
    expect(html).not.toContain('>技能大赛 H5<');
    expect(html).not.toContain('href="#/c/h5/skills-contest"');
    expect(html).not.toContain('闯关赛 · 手机');
    expect(html).toContain('>论坛 H5<');
    expect(html).toContain('href="#/c/h5/forum/1"');
    expect(html).toContain('论坛专区 · 手机');
    expect(html).toContain('>论坛 PC<');
    expect(html).toContain('href="#/c/pc/forum/1"');
    expect(html).toContain('论坛专区 · 宽屏门户');
    expect(html).toContain('>我的帖子 H5<');
    expect(html).toContain('href="#/c/h5/forum-mine"');
    expect(html).toContain('我的帖子 · 手机');
    expect(html).not.toContain('>我的帖子 PC<');
    expect(html).not.toContain('href="#/c/pc/forum-mine"');
    expect(html).not.toContain('我的帖子 · 宽屏门户');
    expect(html).toContain('>信箱 H5<');
    expect(html).toContain('href="#/c/h5/mailbox"');
    expect(html).toContain('建言信箱 · 手机');
    expect(html).toContain('>信箱 PC<');
    expect(html).toContain('href="#/c/pc/mailbox"');
    expect(html).toContain('>即时激励 H5<');
    expect(html).toContain('href="#/c/h5/incentive"');
    expect(html).toContain('勋章积分 · 手机');
    expect(html).toContain('>即时激励 PC<');
    expect(html).toContain('href="#/c/pc/incentive"');
    expect(html).toContain('勋章积分 · 宽屏门户');
    expect(html).toContain('>个人中心 PC<');
    expect(html).toContain('href="#/c/pc/profile"');
    expect(html).toContain('员工档案 · 宽屏门户');
    expect(html.indexOf('>即时激励 PC<')).toBeLessThan(html.indexOf('>论坛 H5<'));
    expect(html.indexOf('>论坛 H5<')).toBeLessThan(html.indexOf('>论坛 PC<'));
    expect(html.indexOf('>论坛 PC<')).toBeLessThan(html.indexOf('>我的帖子 H5<'));
    expect(html.indexOf('>我的帖子 H5<')).toBeLessThan(html.indexOf('>个人中心 PC<'));
    expect(html).toContain('建言信箱 · 宽屏门户');
    expect(html).toContain('正常数据');
    expect(html).toContain('空数据');
    expect(html).toContain('>活动 H5 空数据<');
    expect(html).toContain('href="#/c/h5?empty=1"');
    expect(html).toContain('>活动 PC 空数据<');
    expect(html).toContain('href="#/c/pc?empty=1"');
    expect(html).toContain('>投票 H5 空数据<');
    expect(html).toContain('href="#/c/h5/votes-v2?empty=1"');
    expect(html).toContain('>投票 PC 空数据<');
    expect(html).toContain('href="#/c/pc/votes-v2?empty=1"');
    expect(html).toContain('>兴趣圈 H5 空数据<');
    expect(html).toContain('href="#/c/h5/interest-groups?empty=1"');
    expect(html).toContain('>兴趣圈 PC 空数据<');
    expect(html).toContain('href="#/c/pc/interest-groups?empty=1"');
    expect(html).not.toContain('>打卡 H5 空数据<');
    expect(html).not.toContain('href="#/c/h5/daily-checkin?empty=1"');
    expect(html).not.toContain('>技能大赛 H5 空数据<');
    expect(html).not.toContain('href="#/c/h5/skills-contest?empty=1"');
    expect(html).toContain('>论坛 H5 空数据<');
    expect(html).toContain('href="#/c/h5/forum/1?empty=1"');
    expect(html).toContain('>论坛 PC 空数据<');
    expect(html).toContain('href="#/c/pc/forum/1?empty=1"');
    expect(html).toContain('>我的帖子 H5 空数据<');
    expect(html).toContain('href="#/c/h5/forum-mine?empty=1"');
    expect(html).not.toContain('>我的帖子 PC 空数据<');
    expect(html).not.toContain('href="#/c/pc/forum-mine?empty=1"');
    expect(html).toContain('>信箱 H5 空数据<');
    expect(html).toContain('href="#/c/h5/mailbox?empty=1"');
    expect(html).toContain('>信箱 PC 空数据<');
    expect(html).toContain('href="#/c/pc/mailbox?empty=1"');
    expect(html).toContain('>即时激励 H5 空数据<');
    expect(html).toContain('href="#/c/h5/incentive?empty=1"');
    expect(html).toContain('>即时激励 PC 空数据<');
    expect(html).toContain('href="#/c/pc/incentive?empty=1"');
    expect(html).not.toContain('>个人中心 PC 空数据<');
    expect(html).not.toContain('href="#/c/pc/profile?empty=1"');
    expect(html).toContain('返回后台');
  });

  it('restores vote, activity, and interest-group home layouts to defaults', () => {
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'left-text' }),
    );
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-moments', { listStyle: 'left-image', columnCount: 2 }),
    );
    saveIgDecoration('mobile', patchSharedDecoBlock(getIgDecoration('mobile'), 'deco-groups', { listStyle: 'two-col' }));
    saveIgDecoration('pc', patchSharedDecoBlock(getIgDecoration('pc'), 'deco-activity', { columnCount: 1 }));
    saveVoteV2Decoration(
      'mobile',
      patchSharedDecoBlock(getVoteV2Decoration('mobile'), 'deco-vote', { listStyle: 'two-col' }),
    );
    saveVoteV2Decoration(
      'pc',
      patchSharedDecoBlock(getVoteV2Decoration('pc'), 'deco-vote', { listStyle: 'large-image', columnCount: 4 }),
    );

    resetCEndPreviewDecorations();

    expect(getActivityDecoration('mobile').blocks.find((item) => item.type === 'activity')?.listStyle).toBe('large-image');
    expect(getActivityDecoration('mobile').blocks.find((item) => item.type === 'moments')?.listStyle).toBe('scroll');
    expect(getActivityDecoration('pc').blocks.find((item) => item.type === 'activity')?.columnCount).toBe(3);
    expect(getActivityDecoration('pc').blocks.find((item) => item.type === 'moments')).toMatchObject({
      listStyle: 'large-image',
      columnCount: 4,
    });
    expect(getIgDecoration('mobile').blocks.some((item) => item.type === 'ai')).toBe(false);
    expect(getIgDecoration('pc').blocks.some((item) => item.type === 'ai')).toBe(false);
    expect(getIgDecoration('mobile').blocks.find((item) => item.type === 'groups')?.listStyle).toBe('scroll');
    expect(getIgDecoration('mobile').blocks.find((item) => item.type === 'activity')?.listStyle).toBe('large-image');
    expect(getIgDecoration('mobile').blocks.find((item) => item.type === 'moments')?.listStyle).toBe('scroll');
    expect(getIgDecoration('pc').blocks.find((item) => item.type === 'groups')?.columnCount).toBe(3);
    expect(getIgDecoration('pc').blocks.find((item) => item.type === 'activity')?.columnCount).toBe(3);
    expect(getIgDecoration('pc').blocks.find((item) => item.type === 'moments')?.columnCount).toBe(4);
    expect(getVoteV2Decoration('mobile').blocks.find((item) => item.type === 'vote')?.listStyle).toBe('left-image');
    expect(getVoteV2Decoration('pc').blocks.find((item) => item.type === 'vote')).toMatchObject({
      listStyle: 'left-image',
      columnCount: 2,
    });
    expect(getActivityDecoration('mobile').blocks.some((item) => item.type === 'banner')).toBe(false);
    expect(getActivityDecoration('pc').blocks.some((item) => item.type === 'banner')).toBe(false);
    expect(getIgDecoration('mobile').blocks.some((item) => item.type === 'banner')).toBe(false);
    expect(getIgDecoration('pc').blocks.some((item) => item.type === 'banner')).toBe(false);
    expect(getVoteV2Decoration('mobile').blocks.some((item) => item.type === 'banner')).toBe(false);
    expect(getVoteV2Decoration('pc').blocks.some((item) => item.type === 'banner')).toBe(false);
  });
});
