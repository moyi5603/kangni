import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  goCEndPortal,
  toVoteDetailHash,
  toVoteRecordsHash,
  toVoteResultsHash,
  type CEndSurface,
} from '../../../../app/navigation';
import { IconBack } from '../../activities/components/Icons';
import { getVoteResponses, useVotes } from '../../../voting/model/voteStore';
import type { VoteStatus } from '../../../voting/model/voting';
import {
  DEMO_VOTE_USER,
  formatVoteCardTime,
  listCardCta,
  listVisibleOrdinaryVotes,
  remainingQuota,
  todayKey,
} from '../model/clientVote';
import { VoteShell } from '../VoteShell';

const LIST_TABS: VoteStatus[] = ['进行中', '未开始', '已结束'];

export function H5VoteList({ surface = 'h5' }: { surface?: CEndSurface }) {
  useVotes();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const dayKey = todayKey(now);
  const [tab, setTab] = useState<VoteStatus>('进行中');
  const rows = useMemo(() => listVisibleOrdinaryVotes(tab, now), [tab, now]);
  const body = (
    <section className={surface === 'pc' ? 'c-pc-section c-pc-vote-catalog' : 'c-h5-section c-h5-catalog'}>
      {surface === 'pc' ? (
        <div className="c-pc-section-head">
          <h2 className="c-section-title">发现投票</h2>
          <a className="c-pc-vote-mine" href={toVoteRecordsHash(surface)}>
            我的记录
          </a>
        </div>
      ) : null}
      <div className="c-tabs" role="group" aria-label="投票状态">
        {LIST_TABS.map((item) => {
          const active = item === tab;
          return (
            <button
              key={item}
              className={`c-tab${active ? ' is-active' : ''}`}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <p className="c-empty">暂无投票</p>
      ) : (
        <ul className={surface === 'pc' ? 'c-pc-vote-grid' : 'c-h5-list'} aria-label="投票列表">
          {rows.map((campaign) => {
            const remaining = remainingQuota(campaign, DEMO_VOTE_USER.id, dayKey, getVoteResponses(campaign.id));
            const cta = listCardCta(tab, remaining, campaign.quota, campaign.quotaMode);
            return (
              <li key={campaign.id}>
                <a
                  className="c-h5-vote-card"
                  href={cta === '查看票数' ? toVoteResultsHash(surface, campaign.id) : toVoteDetailHash(surface, campaign.id)}
                >
                  <h2 className="c-h5-vote-title">{campaign.name}</h2>
                  <p className="c-h5-vote-time">
                    {formatVoteCardTime(campaign.startAt)} ~ {formatVoteCardTime(campaign.endAt)}
                  </p>
                  <span className="c-h5-vote-cta">{cta}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  if (surface === 'pc') {
    return (
      <VoteShell surface="pc" title="投票">
        {body}
      </VoteShell>
    );
  }

  return (
    <VoteShell
      header={
        <header className="c-h5-top">
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={goCEndPortal}>
            <IconBack />
          </button>
          <h1 className="c-h5-title">投票</h1>
          <a className="c-h5-vote-mine" href={toVoteRecordsHash(surface)}>
            我的记录
          </a>
        </header>
      }
    >
      {body}
    </VoteShell>
  );
}
