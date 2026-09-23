import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { goH5Back, toVoteV2OptionHash, type CEndSurface } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { VoteV2CastSuccessDialog } from '../../../voting-v2/components/VoteV2CastSuccessDialog';
import { VoteV2PhonePreview } from '../../../voting-v2/components/VoteV2PhonePreview';
import { DEMO_VOTE_USER } from '../../voting/model/clientVote';
import { canSeeVoteV2, resolveVoteV2HomeColumns, voteV2CastUiFeedback } from '../../../voting-v2/model/voteV2';
import { castVoteV2, castVoteV2Many, incrementVoteV2ViewCount, useVoteV2, useVoteV2Contestants } from '../../../voting-v2/model/voteV2Store';
import { VoteShell } from '../../voting/VoteShell';

export function H5VoteV2Home({ id, surface = 'h5' }: { id: number; surface?: CEndSurface }) {
  const toast = useCEndToast();
  const [successHint, setSuccessHint] = useState<string>();
  const campaign = useVoteV2(id);
  const contestants = useVoteV2Contestants(id);
  const visible = Boolean(campaign && canSeeVoteV2(campaign, DEMO_VOTE_USER.id));
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => incrementVoteV2ViewCount(id), 0);
    return () => window.clearTimeout(timer);
  }, [id, visible]);
  const back = goH5Back;

  if (!campaign || !canSeeVoteV2(campaign, DEMO_VOTE_USER.id)) {
    return (
      <VoteShell surface={surface} className="is-vote-v2" title="评选活动" onBack={back}>
        <p className="c-empty">{campaign ? '不在参与范围内' : '活动不存在'}</p>
      </VoteShell>
    );
  }

  return (
    <VoteShell
      surface={surface}
      className="is-vote-v2"
      title={campaign.name}
      onBack={back}
    >
      <div className={surface === 'pc' ? 'c-pc-vote-v2-stage' : undefined}>
      <VoteV2PhonePreview
        framed={false}
        selectionCampaignId={campaign.id}
        name={campaign.name}
        intro={campaign.intro}
        startAt={campaign.startAt}
        endAt={campaign.endAt}
        coverUrl={campaign.coverUrl}
        backgroundEnabled={campaign.backgroundEnabled}
        backgroundUrl={campaign.backgroundUrl}
        themeColor={campaign.themeColor}
        contestantNoun={campaign.contestantNoun}
        voteButtonNoun={campaign.voteButtonNoun}
        voteUnit={campaign.voteUnit}
        homeColumns={resolveVoteV2HomeColumns(campaign, surface)}
        surface={surface}
        groupingEnabled={campaign.groupingEnabled}
        showAllGroups={campaign.showAllGroups}
        groups={campaign.groups}
        period={campaign.period}
        selectMode={campaign.selectMode}
        quotaPerUser={campaign.quotaPerUser}
        minSelect={campaign.minSelect}
        maxSelect={campaign.maxSelect}
        ruleHint={campaign.ruleHint}
        pageDisplay={campaign.pageDisplay}
        contestants={contestants}
        viewCount={campaign.viewCount}
        onVote={(item) => {
          const result = castVoteV2(campaign.id, item.id, DEMO_VOTE_USER.id, dayjs().format('YYYY-MM-DD HH:mm:ss'));
          const feedback = voteV2CastUiFeedback(result, campaign.voteUnit);
          if (feedback.dialogHint) setSuccessHint(feedback.dialogHint);
          else if (feedback.toast) toast.show(feedback.toast);
        }}
        onConfirmVotes={(items) => {
          const result = castVoteV2Many(
            campaign.id,
            items.map((item) => item.id),
            DEMO_VOTE_USER.id,
            dayjs().format('YYYY-MM-DD HH:mm:ss'),
          );
          const feedback = voteV2CastUiFeedback(result, campaign.voteUnit);
          if (feedback.dialogHint) setSuccessHint(feedback.dialogHint);
          else if (feedback.toast) {
            toast.show(feedback.toast);
            return false;
          }
        }}
        detailHref={(item) => toVoteV2OptionHash(surface, campaign.id, item.id)}
      />
      </div>
      {successHint ? (
        <VoteV2CastSuccessDialog hint={successHint} themeColor={campaign.themeColor} onClose={() => setSuccessHint(undefined)} />
      ) : null}
    </VoteShell>
  );
}
