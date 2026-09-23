import { useEffect, useState } from 'react';
import { BellOutlined, BulbOutlined, ClockCircleOutlined, HourglassOutlined, SearchOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import {
  canConfirmVoteV2Selection,
  formatVoteV2CEndRuleText,
  formatVoteV2MultiSelectHint,
  formatVoteV2MultiSelectSummary,
  formatVoteV2StatVoteLabel,
  toggleVoteV2Selection,
  voteV2ActionButtonLabel,
  voteV2CountdownParts,
  voteV2CountdownTargetAt,
  clampVoteV2HomeColumns,
  clampVoteV2PcHomeColumns,
  filterVoteV2PreviewSamples,
  voteV2PreviewSamples,
  mergeVoteV2PageDisplay,
  voteV2SampleNo,
  voteV2ThemeSolid,
  type VoteV2Contestant,
  type VoteV2Group,
  type VoteV2PageDisplay,
  type VoteV2Period,
  type VoteV2SelectMode,
} from '../model/voteV2';
import {
  clearVoteV2Selection,
  toggleVoteV2CampaignSelection,
  useVoteV2Selection,
} from '../model/voteV2SelectionStore';

type Props = {
  name: string;
  intro: string;
  startAt?: string;
  endAt?: string;
  coverUrl: string;
  backgroundEnabled?: boolean;
  backgroundUrl?: string;
  themeColor: string;
  contestantNoun: string;
  voteButtonNoun: string;
  voteUnit?: string;
  homeColumns?: number;
  surface?: 'h5' | 'pc';
  groupingEnabled: boolean;
  showAllGroups?: boolean;
  groups: Array<VoteV2Group & { optionCount?: number }>;
  period: VoteV2Period;
  selectMode: VoteV2SelectMode;
  minSelect?: number;
  maxSelect?: number;
  ruleHint?: string;
  nowAt?: string;
  searchQuery?: string;
  contestants?: VoteV2Contestant[];
  viewCount?: number;
  quotaPerUser?: number;
  pageDisplay?: Partial<VoteV2PageDisplay>;
  framed?: boolean;
  selectionCampaignId?: number;
  onVote?: (item: VoteV2Contestant) => void;
  onConfirmVotes?: (items: VoteV2Contestant[]) => boolean | void;
  detailHref?: (item: VoteV2Contestant) => string;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function VoteV2PhonePreview({
  name,
  intro,
  startAt,
  endAt,
  coverUrl,
  backgroundEnabled = false,
  backgroundUrl = '',
  themeColor,
  contestantNoun,
  voteButtonNoun,
  voteUnit = '票',
  homeColumns = 2,
  surface = 'h5',
  groupingEnabled,
  showAllGroups = true,
  groups,
  period,
  selectMode,
  quotaPerUser = 1,
  minSelect = 1,
  maxSelect,
  ruleHint = '',
  nowAt,
  searchQuery = '',
  contestants,
  viewCount = 0,
  pageDisplay,
  framed = true,
  selectionCampaignId,
  onVote,
  onConfirmVotes,
  detailHref,
}: Props) {
  const tabGroups =
    groupingEnabled && groups.length > 0
      ? groups
      : [
          { id: 1, name: '分组1' },
          { id: 2, name: '分组2' },
        ];
  const [tick, setTick] = useState(nowAt ?? nowStamp());
  const [draft, setDraft] = useState(searchQuery);
  const [applied, setApplied] = useState(searchQuery);
  const [groupTab, setGroupTab] = useState<'all' | number>(() =>
    showAllGroups ? 'all' : (tabGroups[0]?.id ?? 'all'),
  );
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>([]);
  const sharedSelectedIds = useVoteV2Selection(selectionCampaignId ?? -1);
  const selectedIds = selectionCampaignId != null ? sharedSelectedIds : localSelectedIds;
  useEffect(() => {
    setDraft(searchQuery);
    setApplied(searchQuery);
  }, [searchQuery]);
  const firstGroupId = tabGroups[0]?.id;
  useEffect(() => {
    if (showAllGroups) return;
    if (groupTab === 'all') setGroupTab(firstGroupId ?? 1);
  }, [showAllGroups, groupTab, firstGroupId]);
  useEffect(() => {
    if (nowAt) {
      setTick(nowAt);
      return;
    }
    const id = window.setInterval(() => setTick(nowStamp()), 1000);
    return () => window.clearInterval(id);
  }, [nowAt]);

  const show = mergeVoteV2PageDisplay(pageDisplay);
  const previewList = contestants !== undefined ? contestants : voteV2PreviewSamples();
  const searched = filterVoteV2PreviewSamples(previewList, applied);
  const visibleList =
    groupingEnabled && typeof groupTab === 'number'
      ? searched.filter((item) => item.groupId === groupTab)
      : searched;
  const cols = surface === 'pc' ? clampVoteV2PcHomeColumns(homeColumns) : clampVoteV2HomeColumns(homeColumns);
  const totalVotes = previewList.reduce((sum, item) => sum + item.voteCount, 0);
  const startLabel = startAt || '未设置';
  const endLabel = endAt || '未设置';
  const parts =
    startAt && endAt
      ? voteV2CountdownParts(voteV2CountdownTargetAt(startAt, endAt, tick), tick)
      : { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const resolvedMax = maxSelect ?? (selectMode === '多选' ? quotaPerUser : 1);
  const isMulti = selectMode === '多选';
  const selectedCount = selectedIds.length;
  const showSelectBar = isMulti && selectedCount > 0;
  const canConfirm = canConfirmVoteV2Selection(selectedCount, minSelect, resolvedMax);
  const ruleText = formatVoteV2CEndRuleText(
    {
      period,
      selectMode,
      quotaPerUser,
      minSelect,
      maxSelect: resolvedMax,
      ruleHint,
    },
    contestantNoun,
  );
  const showInfo = show.countdown || show.voteTime || show.voteRules;
  const showDetail = show.detailButton;
  const showActions = show.voteButton || showDetail;
  const searchHint = `请输入${contestantNoun}名称、编号`;
  const themeStyle = {
    ['--vote-v2-theme' as string]: themeColor,
    ['--vote-v2-theme-solid' as string]: voteV2ThemeSolid(themeColor),
  };
  const home = (
        <>
        {backgroundEnabled && backgroundUrl ? (
          <img className="vote-v2-phone-bg" src={backgroundUrl} alt="" />
        ) : null}
        {coverUrl ? <img className="vote-v2-phone-cover" src={coverUrl} alt="" /> : <div className="vote-v2-phone-cover is-empty">活动封面</div>}
        <div className="vote-v2-phone-body">
          {show.activityName ? <h3 className="vote-v2-phone-title">{name || '活动名称'}</h3> : null}
          {show.activityStats ? (
            <div className="vote-v2-phone-stats" data-stat-cols={show.totalVotes ? 3 : 2}>
              <div>
                <strong>{previewList.length}</strong>
                <span>{contestantNoun}数</span>
              </div>
              {show.totalVotes ? (
                <div>
                  <strong>{totalVotes}</strong>
                  <span>{formatVoteV2StatVoteLabel(voteUnit)}</span>
                </div>
              ) : null}
              <div>
                <strong>{viewCount}</strong>
                <span>浏览量</span>
              </div>
            </div>
          ) : null}
          {showInfo ? (
            <div className="vote-v2-phone-info">
              {show.countdown ? (
                <p className="vote-v2-phone-countdown">
                  <HourglassOutlined /> 活动倒计时:
                  <em>{pad2(parts.days)}</em>天<em>{pad2(parts.hours)}</em>时<em>{pad2(parts.minutes)}</em>分<em>{pad2(parts.seconds)}</em>秒
                </p>
              ) : null}
              {show.voteTime ? (
                <>
                  <p>
                    <ClockCircleOutlined /> {voteButtonNoun}开始：{startLabel}
                  </p>
                  <p>
                    <ClockCircleOutlined /> {voteButtonNoun}结束：{endLabel}
                  </p>
                </>
              ) : null}
              {show.voteRules ? (
                <p>
                  <BulbOutlined /> {voteButtonNoun}规则：{ruleText}
                </p>
              ) : null}
            </div>
          ) : null}
          {show.intro ? (
            <div className="vote-v2-phone-intro-card">
              <p>
                <BellOutlined /> {voteButtonNoun}介绍：
              </p>
              {intro ? (
                <div className="vote-v2-phone-info-intro rich-text-preview" dangerouslySetInnerHTML={{ __html: intro }} />
              ) : (
                <p className="vote-v2-phone-info-intro">活动介绍</p>
              )}
            </div>
          ) : null}
          {show.search ? (
            <form
              className="vote-v2-phone-search"
              onSubmit={(event) => {
                event.preventDefault();
                setApplied(draft);
              }}
            >
              <SearchOutlined />
              <input
                type="search"
                aria-label={searchHint}
                placeholder={searchHint}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button type="submit" className="vote-v2-phone-search-btn">
                搜索
              </button>
            </form>
          ) : null}
          {show.groups ? (
            <div className="vote-v2-phone-group-tabs" role="tablist" aria-label="分组">
              {showAllGroups ? (
                <button
                  type="button"
                  className={`vote-v2-phone-group-tab${groupTab === 'all' ? ' is-active' : ''}`}
                  onClick={() => setGroupTab('all')}
                >
                  全部分组
                </button>
              ) : null}
              {tabGroups.map((group) => (
                <button
                  key={group.id || group.name}
                  type="button"
                  className={`vote-v2-phone-group-tab${groupTab === group.id ? ' is-active' : ''}`}
                  onClick={() => setGroupTab(group.id)}
                >
                  {group.name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="vote-v2-phone-list" data-cols={cols}>
            {visibleList.map((item) => (
              <div className={`vote-v2-phone-card${isMulti && selectedIds.includes(item.id) ? ' is-selected' : ''}`} key={item.id}>
                {show.contestantCover || show.contestantNo ? (
                  <div className="vote-v2-phone-card-media">
                    {show.contestantCover ? (
                      <div className="vote-v2-phone-card-img is-portrait">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}
                      </div>
                    ) : null}
                    {show.contestantNo ? <span className="vote-v2-phone-card-no">{voteV2SampleNo(item.optionNo)}</span> : null}
                  </div>
                ) : null}
                <div className="vote-v2-phone-card-body">
                  {show.contestantName ? <strong>{item.name}</strong> : null}
                  {show.contestantSubtitle && item.subtitle ? <span className="vote-v2-phone-card-sub">{item.subtitle}</span> : null}
                  {show.contestantVotes ? (
                    <em>
                      {item.voteCount} {voteUnit}
                    </em>
                  ) : null}
                  {showActions ? (
                    <div className={`vote-v2-phone-card-actions${cols > 1 ? ' is-stack' : ''}`}>
                      {show.voteButton ? (
                        <button
                          type="button"
                          className={`vote-v2-phone-card-vote${isMulti && selectedIds.includes(item.id) ? ' is-selected' : ''}`}
                          style={{ background: themeColor }}
                          disabled={item.locked}
                          aria-pressed={isMulti ? selectedIds.includes(item.id) : undefined}
                          onClick={() => {
                            if (isMulti) {
                              if (selectionCampaignId != null) {
                                toggleVoteV2CampaignSelection(selectionCampaignId, item.id, resolvedMax);
                              } else {
                                setLocalSelectedIds((prev) => toggleVoteV2Selection(prev, item.id, resolvedMax).ids);
                              }
                              return;
                            }
                            onVote?.(item);
                          }}
                        >
                          {voteV2ActionButtonLabel(selectMode, voteButtonNoun, selectedIds.includes(item.id))}
                        </button>
                      ) : null}
                      {showDetail ? (
                        detailHref ? (
                          <a className="vote-v2-phone-card-detail" href={detailHref(item)}>
                            详情
                          </a>
                        ) : (
                          <button type="button" className="vote-v2-phone-card-detail">
                            详情
                          </button>
                        )
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        {showSelectBar ? (
          <div className="vote-v2-phone-select-bar" role="region" aria-label="已选选项">
            <div className="vote-v2-phone-select-copy">
              <strong>{formatVoteV2MultiSelectSummary(selectedCount, voteUnit)}</strong>
              <span>{formatVoteV2MultiSelectHint(minSelect, resolvedMax, voteUnit, voteButtonNoun)}</span>
            </div>
            <div className="vote-v2-phone-select-actions">
              <button
                type="button"
                className="vote-v2-phone-select-cancel"
                onClick={() => {
                  if (selectionCampaignId != null) clearVoteV2Selection(selectionCampaignId);
                  else setLocalSelectedIds([]);
                }}
              >
                取消选择
              </button>
              <button
                type="button"
                className="vote-v2-phone-select-confirm"
                style={{ background: themeColor }}
                disabled={!canConfirm}
                onClick={() => {
                  const picked = previewList.filter((row) => selectedIds.includes(row.id));
                  const ok = onConfirmVotes?.(picked);
                  if (ok !== false) {
                    if (selectionCampaignId != null) clearVoteV2Selection(selectionCampaignId);
                    else setLocalSelectedIds([]);
                  }
                }}
              >
                {voteButtonNoun}
              </button>
            </div>
          </div>
        ) : null}
        </>
  );
  if (!framed) {
    return (
      <div className={`c-vote-v2-h5${showSelectBar ? ' has-select-bar' : ''}`} style={themeStyle}>
        {home}
      </div>
    );
  }
  return (
    <aside className="vote-v2-preview">
      <Typography.Paragraph type="secondary" className="vote-v2-preview-hint">
        以下为模拟效果，以手机实物效果为准
      </Typography.Paragraph>
      <div className={`vote-v2-phone${showSelectBar ? ' has-select-bar' : ''}`} data-device="390x844" style={themeStyle}>
        {home}
      </div>
    </aside>
  );
}
