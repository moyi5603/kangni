import { goVoteList, toVoteDetailHash, type CEndSurface } from '../../../../app/navigation';
import { getVote, getVoteResponses, getVotes, useVotes } from '../../../voting/model/voteStore';
import { voteQuotaRecordIndexLabel } from '../../../voting/model/voting';
import { DEMO_VOTE_USER, formatVoteCardTime } from '../model/clientVote';
import { VoteShell } from '../VoteShell';

export function H5VoteRecords({ surface = 'h5' }: { surface?: CEndSurface }) {
  useVotes();
  const rows = getVotes()
    .flatMap((campaign) => getVoteResponses(campaign.id).map((item) => ({ campaign, item })))
    .filter((row) => row.item.voterId === DEMO_VOTE_USER.id)
    .sort((left, right) => right.item.submittedAt.localeCompare(left.item.submittedAt));

  return (
    <VoteShell surface={surface} title="我的投票记录" onBack={() => goVoteList(surface)}>
      {rows.length === 0 ? (
        <p className="c-empty">暂无投票记录</p>
      ) : (
        <ul className={surface === 'pc' ? 'c-pc-vote-grid' : 'c-h5-list'} aria-label="我的投票记录">
          {rows.map((row) => {
            const campaign = getVote(row.item.campaignId) ?? row.campaign;
            const pool = getVoteResponses(campaign.id).filter((item) => {
              if (item.voterId !== DEMO_VOTE_USER.id) return false;
              return campaign.quotaMode === '每天' ? item.dayKey === row.item.dayKey : true;
            });
            const index = pool
              .slice()
              .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))
              .findIndex((item) => item.id === row.item.id);
            return (
              <li key={row.item.id}>
                <a className="c-h5-vote-card" href={toVoteDetailHash(surface, campaign.id)}>
                  <h2 className="c-h5-vote-title">{campaign.name}</h2>
                  <p className="c-h5-vote-time">{formatVoteCardTime(row.item.submittedAt)}</p>
                  <span className="c-h5-vote-cta">
                    {voteQuotaRecordIndexLabel(campaign.quotaMode, index + 1, campaign.quota)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </VoteShell>
  );
}
