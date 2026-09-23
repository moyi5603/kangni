import { useEffect, useState } from 'react';
import { CheckSquareOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons';
import { DecorationWorkbench } from '../../../shared/decoration/DecorationWorkbench';
import type { DecoSurface } from '../../../shared/decoration/decoTypes';
import { VoteBannerLinkPicker } from './VoteBannerLinkPicker';
import { createVoteDecoBlock, VOTE_DECO_FIELD_TOGGLES, VOTE_DECO_TYPE_LABEL, voteDecoStylesForType } from '../model/voteV2Decoration';
import { publishVoteV2Decoration, saveVoteV2Decoration, useVoteV2Decoration } from '../model/voteV2DecorationStore';

export function VoteV2DecorationPage({ surface: initialSurface = 'mobile' }: { surface?: DecoSurface }) {
  const [surface, setSurface] = useState<DecoSurface>(initialSurface);
  useEffect(() => {
    setSurface(initialSurface);
  }, [initialSurface]);
  const page = useVoteV2Decoration(surface);
  return (
    <DecorationWorkbench
      surface={surface}
      onSurfaceChange={setSurface}
      appLabel="投票"
      workbenchTitle="投票装修"
      mineLabel="我的记录"
      mime="application/x-vote-deco"
      defaultSelectedId="deco-vote"
      typeLabels={VOTE_DECO_TYPE_LABEL}
      palette={[
        { type: 'search', label: '搜索', icon: <SearchOutlined /> },
        { type: 'banner', label: '轮播图', icon: <PictureOutlined /> },
        { type: 'vote', label: '投票', icon: <CheckSquareOutlined /> },
      ]}
      chromeTabs={{
        vote: { aria: '活动状态', tabs: ['进行中', '未开始', '已结束'] },
      }}
      moreLinkOptions={[{ value: 'records', label: '我的记录' }]}
      countUnit={() => '个投票'}
      countMax={() => 99}
      stylesForType={voteDecoStylesForType}
      fieldToggles={VOTE_DECO_FIELD_TOGGLES}
      page={page}
      save={(next) => saveVoteV2Decoration(surface, next)}
      publish={() => publishVoteV2Decoration(surface)}
      createBlock={createVoteDecoBlock}
      renderBannerLink={(props) => <VoteBannerLinkPicker {...props} />}
    />
  );
}
