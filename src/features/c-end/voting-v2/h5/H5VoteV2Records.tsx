import { goH5Back, toVoteV2HomeHash, type CEndSurface } from '../../../../app/navigation';
import { DEMO_VOTE_USER, formatVoteCardTime } from '../../voting/model/clientVote';
import { listVoteV2MyRecords } from '../../../voting-v2/model/voteV2';
import { getVoteV2Casts, useVoteV2Campaigns } from '../../../voting-v2/model/voteV2Store';
import { VoteShell } from '../../voting/VoteShell';
import { VoteV2ListCard } from './VoteV2ListCard';

export function H5VoteV2Records({ surface = 'h5' }: { surface?: CEndSurface }) {
  const campaigns = useVoteV2Campaigns();
  const rows = listVoteV2MyRecords(campaigns, getVoteV2Casts(), DEMO_VOTE_USER.id);

  return (
    <VoteShell
      surface={surface}
      className="is-vote-v2"
      title="我的投票记录"
      onBack={goH5Back}
    >
      {rows.length === 0 ? (
        <p className="c-empty">暂无投票记录</p>
      ) : (
        <ul className={surface === 'pc' ? 'c-pc-vote-grid is-left-image' : 'c-h5-list is-left-image'} aria-label="我的投票记录">
          {rows.map((row) => (
            <li key={row.campaign.id}>
              <VoteV2ListCard
                layout="left-image"
                href={toVoteV2HomeHash(surface, row.campaign.id)}
                coverUrl={row.campaign.coverUrl}
                title={row.campaign.name}
                time={formatVoteCardTime(row.lastAt)}
                cta="查看"
              />
            </li>
          ))}
        </ul>
      )}
    </VoteShell>
  );
}
