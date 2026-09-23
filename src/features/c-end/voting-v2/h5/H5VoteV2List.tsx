import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  goH5Back,
  toVoteV2HomeHash,
  toVoteV2RecordsHash,
  type CEndSurface,
} from '../../../../app/navigation';
import { canSeeVoteV2, resolveVoteV2Status, type VoteV2Status } from '../../../voting-v2/model/voteV2';
import { useVoteV2Campaigns } from '../../../voting-v2/model/voteV2Store';
import { useVoteV2Decoration } from '../../../voting-v2/model/voteV2DecorationStore';
import { decoPcColsClass, normalizeDecoColumnCount, type DecoListStyle } from '../../../../shared/decoration/decoTypes';
import { DEMO_VOTE_USER } from '../../voting/model/clientVote';
import { VoteStatusTabs } from '../../voting/VoteStatusTabs';
import { VoteShell } from '../../voting/VoteShell';
import { HomeBanner } from '../../activities/components/HomeBanner';
import { usePreviewList } from '../../portal/emptyPreview';
import { VoteV2ListCard, type VoteV2ListLayout } from './VoteV2ListCard';

const TABS: VoteV2Status[] = ['进行中', '未开始', '已结束'];

function toVoteLayout(style: DecoListStyle | undefined): VoteV2ListLayout {
  if (style === 'large-image' || style === 'two-col' || style === 'left-text' || style === 'scroll') return style;
  return 'left-image';
}

export function H5VoteV2List({ surface = 'h5' }: { surface?: CEndSurface }) {
  const campaigns = usePreviewList(useVoteV2Campaigns());
  const layout = useVoteV2Decoration(surface === 'pc' ? 'pc' : 'mobile');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const [tab, setTab] = useState<VoteV2Status>('进行中');
  const [query, setQuery] = useState('');
  const banners = layout.blocks.filter((item) => item.type === 'banner');
  const search = layout.blocks.find((item) => item.type === 'search');
  const voteBlock = layout.blocks.find((item) => item.type === 'vote');
  const cardLayout = toVoteLayout(voteBlock?.listStyle);
  const rows = useMemo(() => {
    const keyword = query.trim();
    return campaigns
      .filter((item) => resolveVoteV2Status(item, now) === tab && canSeeVoteV2(item, DEMO_VOTE_USER.id))
      .filter((item) => !keyword || item.name.includes(keyword))
      .slice(0, voteBlock?.latestCount ?? 99);
  }, [campaigns, now, tab, query, voteBlock?.latestCount]);
  const colsClass =
    surface === 'pc'
      ? ` ${decoPcColsClass(normalizeDecoColumnCount(voteBlock?.listStyle ?? cardLayout, 'pc', voteBlock?.columnCount, 'vote'))}`
      : '';
  const listClass = `${surface === 'pc' ? 'c-pc-vote-grid' : 'c-h5-list'} is-${cardLayout}${colsClass}`;
  const bannerNodes = banners.map((block) => (
    <HomeBanner key={block.id} block={block} surface={surface === 'pc' ? 'pc' : 'h5'} />
  ));
  const body = (
    <section className={surface === 'pc' ? 'c-pc-section c-pc-vote-catalog' : 'c-h5-section c-h5-catalog'}>
      {search ? (
        <input
          className={surface === 'pc' ? 'c-pc-catalog-search' : 'c-h5-catalog-search'}
          type="search"
          value={query}
          placeholder={search.placeholder}
          aria-label={search.placeholder}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      {surface === 'pc' ? (
        <div className="c-pc-section-head">
          {voteBlock?.titleBar ? <h2 className="c-section-title">{voteBlock.title}</h2> : <h2 className="c-section-title">发现投票</h2>}
        </div>
      ) : voteBlock?.titleBar ? (
        <h2 className="c-section-title">{voteBlock.title}</h2>
      ) : null}
      <VoteStatusTabs
        tabs={TABS}
        value={tab}
        onChange={(next) => setTab(next as VoteV2Status)}
        recordsHref={toVoteV2RecordsHash(surface)}
        ariaLabel="活动状态"
      />
      {rows.length === 0 ? (
        <p className="c-empty">暂无活动</p>
      ) : (
        <ul className={listClass} aria-label="评选活动">
          {rows.map((campaign) => (
            <li key={campaign.id}>
              <VoteV2ListCard
                href={toVoteV2HomeHash(surface, campaign.id)}
                coverUrl={campaign.coverUrl}
                title={campaign.name}
                startAt={campaign.startAt}
                endAt={campaign.endAt}
                status={tab}
                layout={cardLayout}
                showTitle={voteBlock?.showTitle !== false}
                showTime={voteBlock?.showTime !== false}
                showStatus={voteBlock?.showStatus !== false}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  if (surface === 'pc') {
    return (
      <VoteShell surface="pc" className="is-vote-v2" title={layout.pageTitle}>
        {bannerNodes}
        {body}
      </VoteShell>
    );
  }

  return (
    <VoteShell title={layout.pageTitle} onBack={goH5Back}>
      {bannerNodes}
      {body}
    </VoteShell>
  );
}
