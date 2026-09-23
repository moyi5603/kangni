import {
  goAdminWorkbench,
  toCEndHash,
  toH5InterestGroupsHash,
  toPcInterestGroupsHash,
  toH5ForumBoardHash,
  toPcForumBoardHash,
  toH5ForumMineHash,
  toH5MailboxHash,
  toPcMailboxHash,
  toH5VoteV2ListHash,
  toPcVoteV2ListHash,
  toH5IncentiveHash,
  toPcIncentiveHash,
  toPcProfileHash,
  withCEndEmpty,
} from '../../../app/navigation';
import { resetCEndPreviewDecorations } from './resetCEndPreviewDecorations';
import './styles.css';

const entries = [
  { title: '活动 PC', hint: '员工活动 · 宽屏门户', href: toCEndHash('pc') },
  { title: '活动 H5', hint: '员工活动 · 手机', href: toCEndHash('h5') },
  { title: '投票 PC', hint: '评选投票 · 宽屏门户', href: toPcVoteV2ListHash() },
  { title: '投票 H5', hint: '评选投票 · 手机', href: toH5VoteV2ListHash() },
  { title: '兴趣圈 PC', hint: '兴趣圈 · 宽屏门户', href: toPcInterestGroupsHash() },
  { title: '兴趣圈 H5', hint: '兴趣圈 · 手机', href: toH5InterestGroupsHash() },
  { title: '信箱 H5', hint: '建言信箱 · 手机', href: toH5MailboxHash() },
  { title: '信箱 PC', hint: '建言信箱 · 宽屏门户', href: toPcMailboxHash() },
  { title: '即时激励 H5', hint: '勋章积分 · 手机', href: toH5IncentiveHash() },
  { title: '即时激励 PC', hint: '勋章积分 · 宽屏门户', href: toPcIncentiveHash() },
  { title: '论坛 H5', hint: '论坛专区 · 手机', href: toH5ForumBoardHash(1) },
  { title: '论坛 PC', hint: '论坛专区 · 宽屏门户', href: toPcForumBoardHash(1) },
  { title: '我的帖子 H5', hint: '我的帖子 · 手机', href: toH5ForumMineHash() },
  { title: '个人中心 PC', hint: '员工档案 · 宽屏门户', href: toPcProfileHash() },
] as const;

const emptyEntries = entries
  .filter((entry) => entry.title !== '个人中心 PC')
  .map((entry) => ({
    title: `${entry.title} 空数据`,
    hint: `${entry.hint} · 空态`,
    href: withCEndEmpty(entry.href),
  }));

function PortalGrid({ items }: { items: ReadonlyArray<{ title: string; hint: string; href: string }> }) {
  return (
    <ul className="c-portal-grid">
      {items.map((entry) => (
        <li key={entry.href}>
          <a className="c-portal-card" href={entry.href}>
            <span className="c-portal-card-title">{entry.title}</span>
            <span className="c-portal-card-hint">{entry.hint}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CEndPortal() {
  return (
    <div className="c-portal">
      <header className="c-portal-header">
        <div className="c-portal-brand">
          <span className="c-portal-mark" aria-hidden="true" />
          <span className="c-portal-name">康尼</span>
        </div>
        <div className="c-portal-header-actions">
          <button className="c-portal-back" type="button" aria-label="恢复默认" onClick={resetCEndPreviewDecorations}>
            恢复默认
          </button>
          <button className="c-portal-back" type="button" onClick={goAdminWorkbench}>
            返回后台
          </button>
        </div>
      </header>
      <main className="c-portal-main">
        <h1 className="c-portal-title">C 端预览</h1>
        <p className="c-portal-lead">选择要打开的员工端页面。</p>
        <h2 className="c-portal-section">正常数据</h2>
        <PortalGrid items={entries} />
        <h2 className="c-portal-section">空数据</h2>
        <PortalGrid items={emptyEntries} />
      </main>
    </div>
  );
}
