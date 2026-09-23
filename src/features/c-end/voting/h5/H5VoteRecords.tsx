import { goH5Back, toVoteDetailHash, type CEndSurface } from '../../../../app/navigation';
import { getVote, getVoteOptions, getVoteResponses, getVotes, useVotes } from '../../../voting/model/voteStore';
import { voteQuotaRecordIndexLabel } from '../../../voting/model/voting';
import { VoteV2ListCard } from '../../voting-v2/h5/VoteV2ListCard';
import { DEMO_VOTE_USER, formatVoteCardTime } from '../model/clientVote';
import { VoteShell } from '../VoteShell';

function voteRecordCover(campaignId: number): string {
  const option = getVoteOptions(campaignId)[0];
  return option?.imageUrl || option?.workCover || '';
}

export function H5VoteRecords({ surface = 'h5' }: { surface?: CEndSurface }) {
  useVotes();
  const rows = getVotes()
    .flatMap((campaign) => getVoteResponses(campaign.id).map((item) => ({ campaign, item })))
    .filter((row) => row.item.voterId === DEMO_VOTE_USER.id)
    .sort((left, right) => right.item.submittedAt.localeCompare(left.item.submittedAt));

  return (
    <VoteShell surface={surface} title="我的投票记录" onBack={goH5Back}>
      {rows.length === 0 ? (
        <p className="c-empty">暂无投票记录</p>
      ) : (
        <ul className={surface === 'pc' ? 'c-pc-vote-grid is-left-image' : 'c-h5-list is-left-image'} aria-label="我的投票记录">
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
                <VoteV2ListCard
                  layout="left-image"
                  href={toVoteDetailHash(surface, campaign.id)}
                  coverUrl={voteRecordCover(campaign.id)}
                  title={campaign.name}
                  time={formatVoteCardTime(row.item.submittedAt)}
                  cta={voteQuotaRecordIndexLabel(campaign.quotaMode, index + 1, campaign.quota)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </VoteShell>
  );
}
