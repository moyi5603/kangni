import { describe, expect, it } from 'vitest';
import {
  canAddVoteV2Contestant,
  defaultVoteV2Contestant,
  decodeVoteV2PlayerTab,
  encodeVoteV2PlayerTab,
  filterVoteV2Players,
  parseVoteV2PlayerCsv,
  parseVoteV2PlayerImportRows,
  parseVoteV2PlayerWorkbook,
  voteV2ManageTitle,
  nextVoteV2OptionNo,
  voteV2NameFromImageFile,
  canDeleteVoteV2,
  canEditVoteV2Field,
  defaultVoteV2Campaign,
  defaultVoteV2PageDisplay,
  deleteVoteV2BlockReason,
  formatVoteV2CEndRuleText,
  formatVoteV2RuleSummary,
  formatVoteV2StatVoteLabel,
  validateVoteV2Quotas,
  validateVoteV2SignupTime,
  validateVoteV2TimeOrder,
  voteV2CountdownParts,
  voteV2CountdownTargetAt,
  voteV2IntroMax,
  voteV2NameMax,
  voteV2QuotaMax,
  voteV2QuotaMin,
  voteV2ThemeColors,
  voteV2ThemeSolid,
  voteV2HomeColumnOptions,
  voteV2PcHomeColumnOptions,
  clampVoteV2HomeColumns,
  clampVoteV2PcHomeColumns,
  resolveVoteV2HomeColumns,
  voteV2ContestantNounMax,
  voteV2GroupNameMax,
  voteV2ContestantNounPresets,
  filterVoteV2PreviewSamples,
  voteV2PreviewSamples,
  voteV2SampleNo,
  countVoteV2GroupOptions,
  canCastVoteV2,
  canSeeVoteV2,
  remainingVoteV2Quota,
  detectVoteV2LiveChanges,
  countVoteV2BlockedVoters,
  voteV2LiveSaveImpact,
  formatVoteV2CastSuccessHint,
  voteV2CastUiFeedback,
  listVoteV2MyRecords,
  listVoteV2CastRecords,
  tallyVoteV2Results,
  voteV2DetailEmptyHint,
  canConfirmVoteV2Selection,
  formatVoteV2GroupOptionCount,
  formatVoteV2MultiSelectHint,
  formatVoteV2MultiSelectSummary,
  toggleVoteV2Selection,
  voteV2ActionButtonLabel,
  sumVoteV2ContestantVotes,
  voteV2ContestantStanding,
  formatVoteV2RankLabel,
  formatVoteV2CurrentVotes,
  formatVoteV2GapToPrev,
  voteV2PageDisplayItems,
  resolveVoteV2Status,
  sortVoteV2CampaignsByPin,
} from './voteV2';

const sample = defaultVoteV2Campaign({
  id: 1,
  name: '测试活动',
  startAt: '2026-09-01 09:00:00',
  endAt: '2026-09-10 18:00:00',
  createdAt: '2026-08-27 10:00:00',
  quotaPerUser: 3,
  quotaPerContestant: 1,
});

describe('voteV2 domain', () => {
  it('derives status from time', () => {
    expect(resolveVoteV2Status(sample, '2026-08-31 23:59:59')).toBe('未开始');
    expect(resolveVoteV2Status(sample, '2026-09-01 09:00:00')).toBe('进行中');
    expect(resolveVoteV2Status(sample, '2026-09-10 18:00:01')).toBe('已结束');
    expect(sample.backgroundEnabled).toBe(false);
    expect(sample.backgroundUrl).toBe('');
    expect(sample.groupColumns).toBe(3);
    expect(sample.showAllGroups).toBe(true);
    expect(sample.viewCount).toBe(0);
    expect(sample.visibility).toBe('全员');
    expect(sample.creator).toBe('陈产品');
    expect(sample.departments).toEqual([]);
    expect(sumVoteV2ContestantVotes([{ voteCount: 56 }, { voteCount: 48 }])).toBe(104);
  });

  it('ranks contestants and reports gap to previous', () => {
    const rows = [
      defaultVoteV2Contestant({ id: 1, campaignId: 1, name: '甲', optionNo: 1, voteCount: 10 }),
      defaultVoteV2Contestant({ id: 2, campaignId: 1, name: '乙', optionNo: 2, voteCount: 7 }),
      defaultVoteV2Contestant({ id: 3, campaignId: 1, name: '丙', optionNo: 3, voteCount: 7 }),
    ];
    expect(voteV2ContestantStanding(rows, 1)).toEqual({ id: 1, rank: 1, voteCount: 10, gapToPrev: 0 });
    expect(voteV2ContestantStanding(rows, 2)).toEqual({ id: 2, rank: 2, voteCount: 7, gapToPrev: 3 });
    expect(voteV2ContestantStanding(rows, 3)).toEqual({ id: 3, rank: 3, voteCount: 7, gapToPrev: 0 });
    expect(formatVoteV2RankLabel(2)).toBe('第2名');
    expect(formatVoteV2CurrentVotes(96, '票')).toBe('当前96票');
    expect(formatVoteV2GapToPrev(32, '票')).toBe('差32票');
  });

  it('lists solid theme chips without gradients', () => {
    expect(voteV2ThemeColors.map((item) => item.label)).toEqual([
      '蓝色',
      '青色',
      '红色',
      '橙色',
      '黄色',
      '绿色',
      '紫色',
      '粉色',
    ]);
    expect(voteV2ThemeSolid('#5282F0')).toBe('#5282F0');
    expect(sample.voteUnit).toBe('票');
    expect(sample.homeColumns).toBe(2);
    expect(sample.pcHomeColumns).toBe(3);
    expect(voteV2HomeColumnOptions).toEqual([1, 2, 3]);
    expect(voteV2PcHomeColumnOptions).toEqual([3, 4, 5]);
    expect(clampVoteV2HomeColumns(3)).toBe(3);
    expect(clampVoteV2HomeColumns('3' as unknown as number)).toBe(3);
    expect(clampVoteV2PcHomeColumns(4)).toBe(4);
    expect(clampVoteV2PcHomeColumns(5)).toBe(5);
    expect(clampVoteV2PcHomeColumns('5' as unknown as number)).toBe(5);
    expect(clampVoteV2PcHomeColumns(2)).toBe(3);
    expect(defaultVoteV2Campaign({
      id: 1,
      name: '列数',
      startAt: '2026-09-01 09:00:00',
      endAt: '2026-09-08 18:00:00',
      createdAt: '2026-08-01 09:00:00',
      homeColumns: '3' as unknown as number,
      pcHomeColumns: '4' as unknown as number,
    })).toMatchObject({ homeColumns: 3, pcHomeColumns: 4 });
    const split = defaultVoteV2Campaign({
      id: 2,
      name: '分端',
      startAt: '2026-09-01 09:00:00',
      endAt: '2026-09-08 18:00:00',
      createdAt: '2026-08-01 09:00:00',
      homeColumns: 1,
      pcHomeColumns: 5,
    });
    expect(resolveVoteV2HomeColumns(split, 'h5')).toBe(1);
    expect(resolveVoteV2HomeColumns(split, 'pc')).toBe(5);
    expect(voteV2ContestantNounPresets).toEqual(['选手', '作品']);
    expect(voteV2ContestantNounMax).toBe(4);
    expect(voteV2GroupNameMax).toBe(20);
    expect(sample.pinned).toBe(false);
  });

  it('sorts pinned campaigns first and keeps relative order', () => {
    const rows = [
      { id: 1, pinned: false },
      { id: 2, pinned: true },
      { id: 3, pinned: false },
      { id: 4, pinned: true },
    ];
    expect(sortVoteV2CampaignsByPin(rows).map((item) => item.id)).toEqual([2, 4, 1, 3]);
  });

  it('defaults page display fields all on', () => {
    expect(voteV2PageDisplayItems).toHaveLength(16);
    expect(voteV2PageDisplayItems.map((item) => item.label)).toEqual([
      '活动名称',
      '活动数据',
      '总票数',
      '活动倒计时',
      '投票时间',
      '投票规则',
      '活动介绍',
      '选项搜索',
      '选项分组',
      '选项编号',
      '选项封面',
      '选项名称',
      '选项副标题',
      '选项票数',
      '投票按钮',
      '详情按钮',
    ]);
    expect(Object.values(defaultVoteV2PageDisplay()).every(Boolean)).toBe(true);
    expect(sample.pageDisplay.search).toBe(true);
  });

  it('filters preview samples by name or number', () => {
    const rows = voteV2PreviewSamples();
    expect(voteV2SampleNo(8)).toBe('08');
    expect(filterVoteV2PreviewSamples(rows, '').map((item) => item.name)).toHaveLength(8);
    expect(filterVoteV2PreviewSamples(rows, '示例3').map((item) => item.name)).toEqual(['示例3']);
    expect(filterVoteV2PreviewSamples(rows, '08').map((item) => item.id)).toEqual([8]);
    expect(filterVoteV2PreviewSamples(rows, '8').map((item) => item.id)).toEqual([8]);
  });

  it('counts contestants per group', () => {
    expect(countVoteV2GroupOptions([{ groupId: 1 }, { groupId: 1 }, { groupId: 2 }, {}], 1)).toBe(2);
    expect(countVoteV2GroupOptions([{ groupId: 1 }], 9)).toBe(0);
    expect(formatVoteV2GroupOptionCount(2)).toBe('2 个选项');
  });

  it('summarizes rules', () => {
    expect(formatVoteV2RuleSummary(sample)).toBe('每天 · 单选 · 每人 3 票 · 同一选手 1 票');
    expect(formatVoteV2CEndRuleText({ ...sample, ruleHint: '' }, '选手')).toBe('每人每天可投3票');
    expect(
      formatVoteV2CEndRuleText(
        { ...sample, period: '每天', selectMode: '多选', ruleHint: '', quotaPerUser: 2, minSelect: 1, maxSelect: 2 },
        '选手',
      ),
    ).toBe('每人每天可投2次，最少选择1个选项，最多选择2个选项后提交投票');
    expect(
      formatVoteV2CEndRuleText({ ...sample, period: '总共', selectMode: '单选', ruleHint: '', quotaPerUser: 3 }, '选手'),
    ).toBe('每人可投3票');
    expect(
      formatVoteV2CEndRuleText(
        { ...sample, period: '总共', selectMode: '多选', ruleHint: '', quotaPerUser: 3, minSelect: 2, maxSelect: 4 },
        '作品',
      ),
    ).toBe('每人可投3次，最少选择2个选项，最多选择4个选项后提交投票');
    expect(formatVoteV2StatVoteLabel('赞')).toBe('总赞数');
    expect(formatVoteV2StatVoteLabel('票')).toBe('总票数');
  });

  it('labels multi-select as 选择 and formats the confirm bar', () => {
    expect(voteV2ActionButtonLabel('多选', '点赞')).toBe('选择');
    expect(voteV2ActionButtonLabel('多选', '点赞', true)).toBe('取消');
    expect(voteV2ActionButtonLabel('单选', '点赞')).toBe('点赞');
    expect(voteV2ActionButtonLabel('单选', '点赞', true)).toBe('点赞');
    expect(formatVoteV2MultiSelectSummary(2, '赞')).toBe('已选2赞');
    expect(formatVoteV2MultiSelectHint(1, 2, '赞', '点赞')).toBe('请选择1-2赞进行点赞');
    expect(canConfirmVoteV2Selection(0, 1, 2)).toBe(false);
    expect(canConfirmVoteV2Selection(1, 1, 2)).toBe(true);
    expect(canConfirmVoteV2Selection(2, 1, 2)).toBe(true);
    expect(canConfirmVoteV2Selection(3, 1, 2)).toBe(false);
    expect(canConfirmVoteV2Selection(1, 2, 3)).toBe(false);
  });

  it('toggles multi-select ids and blocks over max', () => {
    expect(toggleVoteV2Selection([], 1, 2)).toEqual({ ids: [1] });
    expect(toggleVoteV2Selection([1], 1, 2)).toEqual({ ids: [] });
    expect(toggleVoteV2Selection([1], 2, 2)).toEqual({ ids: [1, 2] });
    expect(toggleVoteV2Selection([1, 2], 3, 2)).toEqual({ ids: [1, 2], blocked: 'max' });
  });

  it('splits countdown toward start or end', () => {
    expect(voteV2CountdownTargetAt(sample.startAt, sample.endAt, '2026-08-31 12:00:00')).toBe(sample.startAt);
    expect(voteV2CountdownTargetAt(sample.startAt, sample.endAt, '2026-09-02 12:00:00')).toBe(sample.endAt);
    expect(voteV2CountdownParts('2026-09-11 12:00:00', '2026-09-01 12:00:00')).toEqual({
      days: 10,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    expect(voteV2CountdownParts('2026-09-01 12:00:00', '2026-09-11 12:00:00')).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('rejects inverted time and quota overflow', () => {
    expect(validateVoteV2TimeOrder('2026-09-10 18:00:00', '2026-09-01 09:00:00')).toBe(false);
    expect(validateVoteV2TimeOrder(sample.startAt, sample.endAt)).toBe(true);
    expect(validateVoteV2Quotas(1, 2)).toBe('同一选项可投次数不能大于每人可投票数');
    expect(validateVoteV2Quotas(0, 1)).toBe(`每人票数须为 ${voteV2QuotaMin}～${voteV2QuotaMax}`);
    expect(validateVoteV2Quotas(3, 1)).toBeUndefined();
  });

  it('locks delete and fields by status', () => {
    expect(canDeleteVoteV2('未开始')).toBe(true);
    expect(deleteVoteV2BlockReason('进行中')).toBe('进行中的活动不能删除');
    expect(deleteVoteV2BlockReason('已结束')).toBe('已结束的活动不能删除');
    expect(canEditVoteV2Field('未开始', 'name')).toBe(true);
    expect(canEditVoteV2Field('进行中', 'name')).toBe(false);
    expect(canEditVoteV2Field('进行中', 'startAt')).toBe(false);
    expect(canEditVoteV2Field('进行中', 'intro')).toBe(true);
    expect(canEditVoteV2Field('进行中', 'period')).toBe(true);
    expect(canEditVoteV2Field('进行中', 'visibility')).toBe(false);
    expect(canEditVoteV2Field('已结束', 'intro')).toBe(false);
    expect(detectVoteV2LiveChanges(sample, { ...sample, quotaPerUser: 1 })).toEqual(['配额']);
    expect(detectVoteV2LiveChanges(sample, { ...sample, selectMode: '多选' })).toEqual(['单多选']);
    expect(detectVoteV2LiveChanges(sample, { ...sample, themeColor: '#e54242', homeColumns: 3, pcHomeColumns: 5 })).toEqual(['样式']);
    expect(
      detectVoteV2LiveChanges(sample, {
        ...sample,
        groupingEnabled: true,
        groups: [{ id: 1, name: '生产组' }],
      }),
    ).toEqual(['分组']);
    expect(voteV2NameMax).toBe(50);
    expect(voteV2IntroMax).toBe(2000);
  });

  it('blocks signup after vote end and contestants before persist', () => {
    expect(validateVoteV2SignupTime('2026-09-11 00:00:00', sample.endAt, true)).toBe('报名结束时间不能大于活动结束时间');
    expect(validateVoteV2SignupTime(sample.endAt, sample.endAt, true)).toBeUndefined();
    expect(canAddVoteV2Contestant(false)).toBe(false);
    expect(canAddVoteV2Contestant(true)).toBe(true);
  });

  it('defaults option no and filters by title, subtitle and number', () => {
    const a = defaultVoteV2Contestant({ id: 1, campaignId: 1, name: '张工', subtitle: '安全标兵', optionNo: 2, groupId: 2 });
    const b = defaultVoteV2Contestant({ id: 12, campaignId: 1, name: '李班', optionNo: 5 });
    expect(a.optionNo).toBe(2);
    expect(a.subtitle).toBe('安全标兵');
    expect(nextVoteV2OptionNo([a, b])).toBe(6);
    expect(filterVoteV2Players([a, b], { keyword: '张', groupKey: 'all' }).map((item) => item.name)).toEqual(['张工']);
    expect(filterVoteV2Players([a, b], { keyword: '5', groupKey: 'all' }).map((item) => item.id)).toEqual([12]);
    expect(filterVoteV2Players([a, b], { keyword: '标兵', groupKey: 'all' }).map((item) => item.name)).toEqual(['张工']);
    expect(filterVoteV2Players([a, b], { keyword: '', groupKey: 'none' }).map((item) => item.name)).toEqual(['李班']);
  });

  it('imports names from files and csv', () => {
    expect(voteV2NameFromImageFile('张工.jpg')).toBe('张工');
    expect(voteV2NameFromImageFile('.png')).toBeUndefined();
    const groups = ['生产组', '职能组'];
    const parsed = parseVoteV2PlayerCsv(
      '序号,选项标题,选项副标题,分组,描述\n3,王新,简介副,生产组,简介\n,王缺号,副,,\n4,,副,生产组,\n5,赵野,副,外部组,描',
      groups,
    );
    expect(parsed.ok).toEqual([
      { optionNo: 3, name: '王新', subtitle: '简介副', groupName: '生产组', description: '简介' },
    ]);
    expect(parsed.errors).toEqual([
      '第 3 行缺少序号',
      '第 4 行缺少选项标题',
      '第 5 行分组「外部组」不在当前投票的分组选项中',
    ]);
  });

  it('rejects player import tables with wrong headers or unknown groups', () => {
    const groups = ['生产组'];
    const header = parseVoteV2PlayerImportRows(
      [
        ['编号', '选项标题', '选项副标题', '分组', '描述'],
        ['1', '甲', '', '生产组', ''],
      ],
      groups,
    );
    expect(header.ok).toEqual([]);
    expect(header.errors).toEqual(['表头须为：序号、选项标题、选项副标题、分组、描述']);

    const blankGroup = parseVoteV2PlayerImportRows(
      [
        ['序号', '选项标题', '选项副标题', '分组', '描述'],
        [1, '乙', '副', '', '说明'],
      ],
      groups,
    );
    expect(blankGroup.ok).toEqual([{ optionNo: 1, name: '乙', subtitle: '副', groupName: '', description: '说明' }]);
    expect(blankGroup.errors).toEqual([]);
  });

  it('parses an xlsx workbook with the option import headers', async () => {
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.aoa_to_sheet([
      ['序号', '选项标题', '选项副标题', '分组', '描述'],
      [8, '钱工', '标兵', '职能组', '简介'],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '选项');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const parsed = parseVoteV2PlayerWorkbook(buffer, ['职能组']);
    expect(parsed).toEqual({
      ok: [{ optionNo: 8, name: '钱工', subtitle: '标兵', groupName: '职能组', description: '简介' }],
      errors: [],
    });
  });

  it('encodes player list tab and uses 选项管理 title', () => {
    expect(voteV2ManageTitle()).toBe('选项管理');
    const query = { keyword: '甲', groupKey: 1 as const, page: 2, pageSize: 10 };
    expect(decodeVoteV2PlayerTab(encodeVoteV2PlayerTab(query))).toEqual(query);
    expect(decodeVoteV2PlayerTab(undefined)).toEqual({
      keyword: '',
      groupKey: 'all',
      page: 1,
      pageSize: 10,
    });
  });

  it('blocks casts outside voting window, when locked, or over quota', () => {
    const row = defaultVoteV2Contestant({ id: 9, campaignId: 1, name: '甲' });
    expect(canCastVoteV2(sample, row, [], 'u1', '2026-08-31 10:00:00')).toBe('活动未在投票期');
    expect(canCastVoteV2(sample, { ...row, locked: true }, [], 'u1', '2026-09-02 10:00:00')).toBe('该选项已锁定');
    expect(canCastVoteV2(sample, row, [], 'u1', '2026-09-02 10:00:00')).toBeUndefined();
    const usedUp = [
      { campaignId: 1, contestantId: 9, userId: 'u1', at: '2026-09-02 10:00:00' },
      { campaignId: 1, contestantId: 8, userId: 'u1', at: '2026-09-02 11:00:00' },
      { campaignId: 1, contestantId: 7, userId: 'u1', at: '2026-09-02 12:00:00' },
    ];
    expect(canCastVoteV2(sample, row, usedUp, 'u1', '2026-09-02 13:00:00')).toBe('已达投票上限');
    expect(
      canCastVoteV2(
        sample,
        row,
        [{ campaignId: 1, contestantId: 9, userId: 'u1', at: '2026-09-02 10:00:00' }],
        'u1',
        '2026-09-02 11:00:00',
      ),
    ).toBe('该选项已达可投次数');
    const byDept = { ...sample, visibility: '按部门' as const, departments: ['生产中心'] };
    expect(canSeeVoteV2(byDept, '张悦')).toBe(false);
    expect(canSeeVoteV2({ ...sample, visibility: '按部门', departments: ['研发中心'] }, '张悦')).toBe(true);
    expect(canCastVoteV2(byDept, row, [], '张悦', '2026-09-02 10:00:00')).toBe('不在参与范围内');
  });

  it('formats remaining quota after a successful single vote', () => {
    expect(remainingVoteV2Quota(sample, [], 'u1', '2026-09-02 10:00:00')).toBe(3);
    expect(
      remainingVoteV2Quota(
        sample,
        [{ campaignId: 1, contestantId: 9, userId: 'u1', at: '2026-09-02 10:00:00' }],
        'u1',
        '2026-09-02 11:00:00',
      ),
    ).toBe(2);
    expect(formatVoteV2CastSuccessHint(2, '票')).toBe('今日还可投2票');
    expect(formatVoteV2CastSuccessHint(0, '赞')).toBe('今日还可投0赞');
    expect(voteV2CastUiFeedback({ ok: true, remaining: 2 }, '票')).toEqual({ dialogHint: '今日还可投2票' });
    expect(voteV2CastUiFeedback({ ok: true, remaining: 0 }, '赞')).toEqual({ dialogHint: '今日还可投0赞' });
    expect(voteV2CastUiFeedback({ ok: false, reason: '已达投票上限' }, '票')).toEqual({ toast: '已达投票上限' });
  });

  it('keeps historical casts when live rules change and blocks over-quota users going forward', () => {
    const row = defaultVoteV2Contestant({ id: 9, campaignId: 1, name: '甲' });
    const casts = [
      { campaignId: 1, contestantId: 9, userId: 'u1', at: '2026-09-02 10:00:00' },
      { campaignId: 1, contestantId: 8, userId: 'u1', at: '2026-09-02 11:00:00' },
      { campaignId: 1, contestantId: 7, userId: 'u2', at: '2026-09-02 12:00:00' },
    ];
    const tightened = { ...sample, quotaPerUser: 1, quotaPerContestant: 1 };
    const now = '2026-09-02 13:00:00';
    expect(countVoteV2BlockedVoters(tightened, casts, now)).toBe(2);
    expect(canCastVoteV2(tightened, row, casts, 'u1', now)).toBe('已达投票上限');
    expect(canCastVoteV2(tightened, row, casts, 'u3', now)).toBeUndefined();
    expect(
      voteV2LiveSaveImpact({
        status: '进行中',
        before: sample,
        after: { ...tightened, themeColor: '#e54242', groupingEnabled: true, groups: [{ id: 1, name: '甲组' }] },
        casts,
        now,
      }),
    ).toEqual({
      title: '确认保存「测试活动」的进行中修改？',
      lines: [
        '本次修改：配额、样式、分组。',
        '已产生 3 条投票：不重算票数，后续继续累加。',
        '2 人按新规则已达或超额，不能继续投；其余人按新规则可继续投。',
        '样式仅影响展示与文案，不改历史票数。',
        '分组仅影响选项归类与展示，不改历史票数。',
      ],
    });
    expect(voteV2LiveSaveImpact({ status: '未开始', before: sample, after: tightened, casts, now })).toBeUndefined();
    expect(voteV2LiveSaveImpact({ status: '进行中', before: sample, after: tightened, casts: [], now })).toBeUndefined();
    expect(voteV2LiveSaveImpact({ status: '进行中', before: sample, after: sample, casts, now })).toBeUndefined();
  });

  it('groups own casts into unique campaigns, newest first', () => {
    const other = defaultVoteV2Campaign({
      id: 2,
      name: '食堂本周菜品',
      startAt: '2026-09-01 08:00:00',
      endAt: '2026-09-10 20:00:00',
    });
    const rows = listVoteV2MyRecords(
      [sample, other],
      [
        { campaignId: 1, contestantId: 9, userId: 'u1', at: '2026-09-02 10:00:00' },
        { campaignId: 2, contestantId: 1, userId: 'u1', at: '2026-09-03 09:00:00' },
        { campaignId: 1, contestantId: 8, userId: 'u1', at: '2026-09-02 12:00:00' },
        { campaignId: 2, contestantId: 1, userId: 'u2', at: '2026-09-04 09:00:00' },
      ],
      'u1',
    );
    expect(rows.map((item) => item.campaign.name)).toEqual(['食堂本周菜品', '测试活动']);
    expect(rows[0]?.lastAt).toBe('2026-09-03 09:00:00');
    expect(rows[1]?.used).toBe(2);
  });

  it('ranks contestants with competition ranking and percent of total votes', () => {
    const rows = tallyVoteV2Results([
      defaultVoteV2Contestant({ id: 1, campaignId: 1, name: '甲', optionNo: 1, voteCount: 2 }),
      defaultVoteV2Contestant({ id: 2, campaignId: 1, name: '乙', optionNo: 2, voteCount: 2 }),
      defaultVoteV2Contestant({ id: 3, campaignId: 1, name: '丙', optionNo: 3, voteCount: 0 }),
    ]);
    expect(rows.map((row) => ({ id: row.id, rank: row.rank, voteCount: row.voteCount, percent: row.percent }))).toEqual([
      { id: 1, rank: 1, voteCount: 2, percent: 50 },
      { id: 2, rank: 1, voteCount: 2, percent: 50 },
      { id: 3, rank: 3, voteCount: 0, percent: 0 },
    ]);
  });

  it('leaves percent empty when nobody has votes yet', () => {
    const rows = tallyVoteV2Results([
      defaultVoteV2Contestant({ id: 1, campaignId: 1, name: '甲', optionNo: 1, voteCount: 0 }),
      defaultVoteV2Contestant({ id: 2, campaignId: 1, name: '乙', optionNo: 2, voteCount: 0 }),
    ]);
    expect(rows.every((row) => row.percent === null && row.voteCount === 0 && row.rank === 1)).toBe(true);
  });

  it('lists cast records newest first with option titles', () => {
    const contestants = [
      defaultVoteV2Contestant({ id: 9, campaignId: 1, name: '甲', optionNo: 1 }),
      defaultVoteV2Contestant({ id: 8, campaignId: 1, name: '乙', optionNo: 2 }),
    ];
    const rows = listVoteV2CastRecords(
      [
        { campaignId: 1, contestantId: 9, userId: '张悦', at: '2026-09-02 10:00:00' },
        { campaignId: 2, contestantId: 1, userId: '李明', at: '2026-09-03 09:00:00' },
        { campaignId: 1, contestantId: 8, userId: '李明', at: '2026-09-02 12:00:00' },
        { campaignId: 1, contestantId: 9, userId: '李明', at: '2026-09-02 12:00:00' },
      ],
      contestants,
      1,
    );
    expect(
      rows.map((item) => ({
        userId: item.userId,
        department: item.department,
        optionName: item.optionName,
        at: item.at,
        contestantIds: item.contestantIds,
      })),
    ).toEqual([
      {
        userId: '李明',
        department: '前端组',
        optionName: '甲、乙',
        at: '2026-09-02 12:00:00',
        contestantIds: [9, 8],
      },
      {
        userId: '张悦',
        department: '前端组',
        optionName: '甲',
        at: '2026-09-02 10:00:00',
        contestantIds: [9],
      },
    ]);
  });

  it('picks empty copy by status and whether any row exists', () => {
    expect(voteV2DetailEmptyHint('未开始', false)).toBe('尚未开始，暂无投票');
    expect(voteV2DetailEmptyHint('进行中', false)).toBe('暂无投票');
    expect(voteV2DetailEmptyHint('已结束', false)).toBe('暂无投票');
    expect(voteV2DetailEmptyHint('未开始', true)).toBeUndefined();
  });
});

function bSeed() {
  return defaultVoteV2Contestant({ id: 2, campaignId: 1, name: '李班', subtitle: '班组', optionNo: 2, voteCount: 8 });
}
