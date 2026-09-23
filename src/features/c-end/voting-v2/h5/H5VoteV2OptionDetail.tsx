import { useState } from 'react';
import dayjs from 'dayjs';
import { goH5Back, type CEndSurface } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { DEMO_VOTE_USER } from '../../voting/model/clientVote';
import { VoteV2CastSuccessDialog } from '../../../voting-v2/components/VoteV2CastSuccessDialog';
import {
  canConfirmVoteV2Selection,
  canSeeVoteV2,
  formatVoteV2CurrentVotes,
  formatVoteV2GapToPrev,
  formatVoteV2MultiSelectHint,
  formatVoteV2MultiSelectSummary,
  formatVoteV2RankLabel,
  voteV2ActionButtonLabel,
  voteV2CastUiFeedback,
  voteV2ContestantStanding,
  voteV2SampleNo,
  voteV2ThemeSolid,
} from '../../../voting-v2/model/voteV2';
import {
  clearVoteV2Selection,
  toggleVoteV2CampaignSelection,
  useVoteV2Selection,
} from '../../../voting-v2/model/voteV2SelectionStore';
import { castVoteV2, castVoteV2Many, useVoteV2, useVoteV2Contestants } from '../../../voting-v2/model/voteV2Store';
import { VoteShell } from '../../voting/VoteShell';

export function H5VoteV2OptionDetail({
  campaignId,
  optionId,
  surface = 'h5',
}: {
  campaignId: number;
  optionId: number;
  surface?: CEndSurface;
}) {
  const toast = useCEndToast();
  const [successHint, setSuccessHint] = useState<string>();
  const campaign = useVoteV2(campaignId);
  const contestants = useVoteV2Contestants(campaignId);
  const selectedIds = useVoteV2Selection(campaignId);
  const record =
    contestants.find((item) => item.id === optionId) ?? contestants.find((item) => item.optionNo === optionId);
  const standing = record ? voteV2ContestantStanding(contestants, record.id) : undefined;
  const back = goH5Back;

  if (!campaign || !record || !canSeeVoteV2(campaign, DEMO_VOTE_USER.id)) {
    return (
      <VoteShell surface={surface} className="is-vote-v2" title="选项详情" onBack={back}>
        <p className="c-empty">选项不存在</p>
      </VoteShell>
    );
  }

  const isMulti = campaign.selectMode === '多选';
  const selected = selectedIds.includes(record.id);
  const selectedCount = selectedIds.length;
  const canConfirm = canConfirmVoteV2Selection(selectedCount, campaign.minSelect, campaign.maxSelect);
  const showSelectBar = isMulti && selectedCount > 0;
  const themeVars = {
    ['--vote-v2-theme' as string]: campaign.themeColor,
    ['--vote-v2-theme-solid' as string]: voteV2ThemeSolid(campaign.themeColor),
  };

  const voteButton = (
    <button
      type="button"
      className={`c-cta${isMulti && selected ? ' is-selected' : ''}`}
      style={{ background: campaign.themeColor }}
      disabled={record.locked}
      aria-pressed={isMulti ? selected : undefined}
      onClick={() => {
        if (isMulti) {
          const result = toggleVoteV2CampaignSelection(campaign.id, record.id, campaign.maxSelect);
          if (result.blocked === 'max') {
            toast.show(formatVoteV2MultiSelectHint(campaign.minSelect, campaign.maxSelect, campaign.voteUnit, campaign.voteButtonNoun));
          }
          return;
        }
        const result = castVoteV2(campaign.id, record.id, DEMO_VOTE_USER.id, dayjs().format('YYYY-MM-DD HH:mm:ss'));
        const feedback = voteV2CastUiFeedback(result, campaign.voteUnit);
        if (feedback.dialogHint) setSuccessHint(feedback.dialogHint);
        else if (feedback.toast) toast.show(feedback.toast);
      }}
    >
      {voteV2ActionButtonLabel(campaign.selectMode, campaign.voteButtonNoun, selected)}
    </button>
  );

  const selectBar = showSelectBar ? (
    <div className="vote-v2-phone-select-bar" role="region" aria-label="已选选项" style={themeVars}>
      <div className="vote-v2-phone-select-copy">
        <strong>{formatVoteV2MultiSelectSummary(selectedCount, campaign.voteUnit)}</strong>
        <span>
          {formatVoteV2MultiSelectHint(
            campaign.minSelect,
            campaign.maxSelect,
            campaign.voteUnit,
            campaign.voteButtonNoun,
          )}
        </span>
      </div>
      <div className="vote-v2-phone-select-actions">
        <button type="button" className="vote-v2-phone-select-cancel" onClick={() => clearVoteV2Selection(campaign.id)}>
          取消选择
        </button>
        <button
          type="button"
          className="vote-v2-phone-select-confirm"
          style={{ background: campaign.themeColor }}
          disabled={!canConfirm}
          onClick={() => {
            if (!canConfirm) return;
            const result = castVoteV2Many(
              campaign.id,
              selectedIds,
              DEMO_VOTE_USER.id,
              dayjs().format('YYYY-MM-DD HH:mm:ss'),
            );
            const feedback = voteV2CastUiFeedback(result, campaign.voteUnit);
            if (feedback.dialogHint) {
              clearVoteV2Selection(campaign.id);
              setSuccessHint(feedback.dialogHint);
            } else if (feedback.toast) toast.show(feedback.toast);
          }}
        >
          {campaign.voteButtonNoun}
        </button>
      </div>
    </div>
  ) : null;

  const article = (
    <article
      className="c-vote-v2-option"
      style={themeVars}
    >
      {campaign.coverUrl ? (
        <img className="c-vote-v2-option-banner" src={campaign.coverUrl} alt="" />
      ) : (
        <div className="c-vote-v2-option-banner is-empty">活动封面</div>
      )}
      <div className="c-vote-v2-option-meta">
        <div className="c-vote-v2-option-head">
          <span className="c-vote-v2-option-no">{voteV2SampleNo(record.optionNo)}</span>
          <div className="c-vote-v2-option-titles">
            <h2>{record.name}</h2>
            {record.subtitle ? <p className="c-vote-v2-option-sub">{record.subtitle}</p> : null}
          </div>
        </div>
        {standing ? (
          <div className="c-vote-v2-option-stats">
            <div>
              <span>排名</span>
              <strong>{formatVoteV2RankLabel(standing.rank)}</strong>
            </div>
            <div>
              <span>票数</span>
              <strong>{formatVoteV2CurrentVotes(standing.voteCount, campaign.voteUnit)}</strong>
            </div>
            <div>
              <span>距上一名</span>
              <strong>{formatVoteV2GapToPrev(standing.gapToPrev, campaign.voteUnit)}</strong>
            </div>
          </div>
        ) : null}
      </div>
      <div className="c-vote-v2-option-hero c-vote-v2-option-inset">
        {record.imageUrl ? (
          <img src={record.imageUrl} alt="" />
        ) : (
          <div className="c-vote-v2-option-hero-empty">选项图片</div>
        )}
      </div>
      <div className="c-vote-v2-option-body c-vote-v2-option-inset">
        {record.description ? <div className="c-vote-v2-option-desc">{record.description}</div> : null}
      </div>
    </article>
  );

  return (
    <VoteShell
      surface={surface}
      className={`is-vote-v2${showSelectBar ? ' has-select-bar' : ''}`}
      title={record.name}
      onBack={back}
      footer={
        surface === 'h5' ? (
          <div style={themeVars}>
            {selectBar}
            <div className="c-h5-cta-bar" style={themeVars}>
              {voteButton}
            </div>
          </div>
        ) : undefined
      }
    >
      {surface === 'pc' ? (
        <div className={`c-pc-detail${showSelectBar ? ' has-select-bar' : ''}`}>
          {article}
          <aside className="c-pc-side">
            <h2 className="c-detail-name">{record.name}</h2>
            {voteButton}
            {selectBar}
          </aside>
        </div>
      ) : (
        article
      )}
      {successHint ? (
        <VoteV2CastSuccessDialog hint={successHint} themeColor={campaign.themeColor} onClose={() => setSuccessHint(undefined)} />
      ) : null}
    </VoteShell>
  );
}
