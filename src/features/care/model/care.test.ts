import { describe, expect, it } from 'vitest';
import {
  defaultCreateType,
  displayRuleStatus,
  emptyRuleDraft,
  isDeferredCreateType,
  sceneSelectOptions,
  festivalRadioOptions,
  solarTermRadioOptions,
  filterEmployees,
  colleagueBlessingsFor,
  filterRecords,
  filterRules,
  dateLabel,
  occasionLabel,
  pushTimeLabel,
  templateInUse,
  usedAnniversaryYears,
  usedOccasions,
  usedUniqueScenes,
  validateRuleDraft,
  insertCardVariable,
  cardVariablesForType,
  cardBlessingPlain,
  highlightCardVariableHtml,
  EMPLOYEE_NAME_TOKEN,
  WEATHER_SCENES,
  WARNING_LEVELS,
  CARE_POSTERS,
  initialEmojis,
  initialEmployees,
  movedEmojis,
  orderedEmojis,
  initialRecords,
  initialRules,
  initialTemplates,
} from './care';

function posterBox(src: string) {
  const match = decodeURIComponent(src).match(/width="(\d+)"[^>]*height="(\d+)"/);
  return { width: Number(match?.[1]), height: Number(match?.[2]) };
}

describe('emoji order', () => {
  it('moves an emoji up or down by swapping sort', () => {
    expect(orderedEmojis(initialEmojis).map((item) => item.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5', 'e6']);
    expect(orderedEmojis(movedEmojis(initialEmojis, 'e2', 'up')).map((item) => item.id)).toEqual(['e2', 'e1', 'e3', 'e4', 'e5', 'e6']);
    expect(movedEmojis(initialEmojis, 'e1', 'up')).toBe(initialEmojis);
    expect(movedEmojis(initialEmojis, 'e6', 'down')).toBe(initialEmojis);
  });
});

describe('CARE_POSTERS', () => {
  it('uses portrait greeting-card artwork', () => {
    for (const src of Object.values(CARE_POSTERS)) {
      const box = posterBox(src);
      expect(box.height).toBeGreaterThan(box.width);
    }
    for (const item of initialTemplates) {
      const box = posterBox(item.coverImage);
      expect(box.height).toBeGreaterThan(box.width);
    }
  });

  it('uses landscape artwork for 祝福消息推送 and 提醒消息推送', () => {
    for (const item of initialTemplates) {
      const push = posterBox(item.employeeCover);
      expect(push.width).toBeGreaterThan(push.height);
      if (item.colleagueCover) {
        const colleague = posterBox(item.colleagueCover);
        expect(colleague.width).toBeGreaterThan(colleague.height);
      }
    }
  });
});

describe('displayRuleStatus', () => {
  it('marks one-off other rule expired after fixed date', () => {
    const rule = { ...emptyRuleDraft('其他'), validity: '一次性' as const, fixedDate: '2026-07-15', status: '执行中' as const };
    expect(displayRuleStatus(rule, '2026-09-16')).toBe('已过期');
    expect(displayRuleStatus(rule, '2026-07-15')).toBe('执行中');
  });
});

describe('filterEmployees', () => {
  it('filters incomplete birthday', () => {
    const rows = filterEmployees(initialEmployees, { name: '', info: 'incompleteBirthday' });
    expect(rows.map((item) => item.name)).toEqual(['孙可', '何嘉']);
  });
});

describe('filterRules', () => {
  it('matches theme keyword', () => {
    expect(filterRules(initialRules, { name: '中秋', status: 'all', category: '固定日期关怀' }).map((item) => item.id)).toEqual(['r4']);
    expect(filterRules(initialRules, { name: '', status: 'all', category: '个人关怀' }).map((item) => item.id)).toEqual(['r1', 'r2', 'r3']);
    expect(filterRules(initialRules, { name: '', status: 'all', category: '事件关怀' }).map((item) => item.id)).toEqual(['r6', 'r7']);
  });
});

describe('filterRecords', () => {
  it('filters user care by source', () => {
    expect(filterRecords(initialRecords, { source: '用户关怀', ruleName: '', name: '', sender: '', department: '', points: '', pushDate: '', status: 'all' })).toHaveLength(3);
  });
});

describe('colleagueBlessingsFor', () => {
  it('counts blessings for a system record and sorts newest first', () => {
    const rows = colleagueBlessingsFor('c1');
    expect(rows.map((item) => item.sender)).toEqual(['王悦', '林晓']);
    expect(colleagueBlessingsFor('c6')).toEqual([]);
  });
});

describe('validateRuleDraft', () => {
  it('blocks duplicate anniversary year', () => {
    const draft = { ...emptyRuleDraft('周年庆关怀'), name: '两年', anniversaryYear: 1, templateKeys: ['t3'] };
    expect(validateRuleDraft(draft, initialRules)).toContain('周年数');
  });

  it('blocks a second 生日关怀 or 入党关怀', () => {
    expect(validateRuleDraft({ ...emptyRuleDraft('生日关怀'), name: '生日2', templateKeys: ['t1'] }, initialRules)).toContain('仅允许创建一个');
    expect(validateRuleDraft({ ...emptyRuleDraft('入党关怀'), name: '入党2', templateKeys: ['t4'] }, initialRules)).toContain('仅允许创建一个');
    expect(usedUniqueScenes(initialRules).has('生日关怀')).toBe(true);
    expect(usedUniqueScenes(initialRules, 'r1').has('生日关怀')).toBe(false);
  });

  it('blocks duplicate festival', () => {
    const draft = { ...emptyRuleDraft('节日关怀'), name: '中秋', occasion: ['中秋节'], templateKeys: ['t5'] };
    expect(validateRuleDraft(draft, initialRules)).toContain('节日');
    expect(validateRuleDraft({ ...emptyRuleDraft('节日关怀'), name: '端午', occasion: ['端午节', '春节'], templateKeys: ['t5'] }, initialRules)).toContain('一个具体节日');
  });

  it('requires one solar term and blocks duplicates', () => {
    expect(validateRuleDraft({ ...emptyRuleDraft('节气关怀'), name: '冬至', occasion: [], templateKeys: ['t6'] }, initialRules)).toContain('一个具体节气');
    expect(validateRuleDraft({ ...emptyRuleDraft('节气关怀'), name: '冬至', occasion: ['冬至', '夏至'], templateKeys: ['t6'] }, initialRules)).toContain('一个具体节气');
    const rules = [...initialRules, { ...emptyRuleDraft('节气关怀'), id: 'rx', name: '冬至关怀', occasion: ['冬至'], templateKeys: ['t6'] }];
    expect(validateRuleDraft({ ...emptyRuleDraft('节气关怀'), name: '再冬至', occasion: ['冬至'], templateKeys: ['t6'] }, rules)).toContain('节气');
    expect(validateRuleDraft({ ...emptyRuleDraft('节气关怀'), name: '夏至', occasion: ['夏至'], templateKeys: ['t6'] }, rules)).toBeNull();
  });

  it('requires one weather scene', () => {
    const draft = { ...emptyRuleDraft('天气关怀'), name: '天气', templateKeys: ['t9'], weatherScenes: [] };
    expect(validateRuleDraft(draft, initialRules)).toContain('一个天气场景');
    expect(
      validateRuleDraft(
        { ...emptyRuleDraft('天气关怀'), name: '天气', templateKeys: ['t9'], weatherScenes: ['暴雨预警', '暴雪预警'] },
        initialRules,
      ),
    ).toContain('一个天气场景');
  });

  it('requires one work intensity trigger', () => {
    const draft = { ...emptyRuleDraft('工作强度关怀'), name: '加班', templateKeys: ['t10'], workIntensityScenes: [] };
    expect(validateRuleDraft(draft, initialRules)).toContain('一个触发条件');
    expect(
      validateRuleDraft(
        { ...emptyRuleDraft('工作强度关怀'), name: '加班', templateKeys: ['t10'], workIntensityScenes: ['单日超时', '下班过晚'] },
        initialRules,
      ),
    ).toContain('一个触发条件');
  });
});

describe('weather warning levels', () => {
  it('uses four 预警 grades and 沙尘预警 scene', () => {
    expect(WARNING_LEVELS).toEqual(['蓝色预警', '黄色预警', '橙色预警', '红色预警']);
    expect([...WEATHER_SCENES]).toContain('沙尘预警');
    expect([...WEATHER_SCENES]).not.toContain('沙尘暴预警');
  });
});

describe('used helpers', () => {
  it('collects anniversary years and occasions', () => {
    expect([...usedAnniversaryYears(initialRules)]).toEqual([1]);
    expect(usedOccasions(initialRules, '节日关怀').has('中秋节')).toBe(true);
    expect(templateInUse(initialRules, 't1')?.id).toBe('r1');
  });
});

describe('unique scene options', () => {
  it('disables configured 生日关怀 and 入党关怀 on create', () => {
    const personal = sceneSelectOptions(initialRules).find((group) => group.label === '个人关怀');
    const birthday = personal?.options.find((item) => item.value === '生日关怀');
    const party = personal?.options.find((item) => item.value === '入党关怀');
    const anniversary = personal?.options.find((item) => item.value === '周年庆关怀');
    expect(birthday).toMatchObject({ disabled: true, label: '生日关怀（已配置）' });
    expect(party).toMatchObject({ disabled: true, label: '入党关怀（已配置）' });
    expect(anniversary?.disabled).toBeFalsy();
    expect(defaultCreateType('个人关怀', initialRules)).toBe('周年庆关怀');
  });

  it('hides 节气关怀 from create scene options', () => {
    const fixed = sceneSelectOptions(initialRules, undefined, { hideDeferred: true }).find((group) => group.label === '固定日期关怀');
    expect(fixed?.options.map((item) => item.value)).toEqual(['节日关怀', '其他']);
    expect(isDeferredCreateType('节气关怀')).toBe(true);
    const editing = sceneSelectOptions(initialRules).find((group) => group.label === '固定日期关怀');
    expect(editing?.options.map((item) => item.value)).toContain('节气关怀');
  });

  it('keeps current unique scene enabled while editing', () => {
    const personal = sceneSelectOptions(initialRules, 'r1').find((group) => group.label === '个人关怀');
    expect(personal?.options.find((item) => item.value === '生日关怀')?.disabled).toBeFalsy();
    expect(personal?.options.find((item) => item.value === '入党关怀')?.disabled).toBe(true);
  });
});

describe('festivalRadioOptions', () => {
  it('groups festivals with calendar dates and marks configured ones', () => {
    const groups = festivalRadioOptions(initialRules);
    expect(groups.map((item) => item.label)).toEqual(['中国节日', '全球主流节日']);
    expect(groups[0].options.map((item) => item.value)).toEqual([
      '元旦',
      '春节',
      '元宵节',
      '妇女节',
      '清明节',
      '劳动节',
      '端午节',
      '建党节',
      '建军节',
      '七夕节',
      '中元节',
      '教师节',
      '中秋节',
      '国庆节',
      '重阳节',
    ]);
    expect(groups[1].options.map((item) => item.value)).toEqual([
      '情人节',
      '母亲节',
      '父亲节',
      '万圣节',
      '感恩节',
      '平安夜',
      '圣诞节',
      '跨年夜',
    ]);
    const midAutumn = groups[0].options.find((item) => item.value === '中秋节');
    expect(midAutumn).toMatchObject({ disabled: true, label: '中秋节（已配置）', hint: '农历八月十五' });
    expect(groups[0].options.find((item) => item.value === '春节')).toMatchObject({ hint: '农历正月初一' });
    expect(groups[0].options.find((item) => item.value === '元旦')).toMatchObject({ hint: '1月1日' });
    expect(groups[0].options.find((item) => item.value === '清明节')).toMatchObject({ hint: '4月4日-4月6日' });
    expect(groups[1].options.find((item) => item.value === '母亲节')).toMatchObject({ hint: '5月第二个星期日' });
    expect(groups[0].options.find((item) => item.value === '除夕')).toBeUndefined();
    expect(groups[1].options.find((item) => item.value === '复活节')).toBeUndefined();
    expect(festivalRadioOptions(initialRules, 'r4')[0].options.find((item) => item.value === '中秋节')?.disabled).toBeFalsy();
  });
});

describe('solarTermRadioOptions', () => {
  it('lists 24 terms with approximate solar dates and marks configured ones', () => {
    const options = solarTermRadioOptions(initialRules);
    expect(options.map((item) => item.value)).toHaveLength(24);
    expect(options[0]).toMatchObject({ value: '立春', hint: '2月3日-2月5日' });
    expect(options.find((item) => item.value === '冬至')).toMatchObject({ hint: '12月21日-12月23日', disabled: false });
    const withWinter = [
      ...initialRules,
      { ...emptyRuleDraft('节气关怀'), id: 'rx', name: '冬至关怀', occasion: ['冬至'], templateKeys: ['t6'] },
    ];
    expect(solarTermRadioOptions(withWinter).find((item) => item.value === '冬至')).toMatchObject({
      disabled: true,
      label: '冬至（已配置）',
    });
    expect(solarTermRadioOptions(withWinter, 'rx').find((item) => item.value === '冬至')?.disabled).toBeFalsy();
  });
});

describe('occasionLabel', () => {
  it('shows selected scene, not mixed date', () => {
    expect(occasionLabel(initialRules.find((item) => item.id === 'r6')!)).toContain('暴雨预警');
    expect(occasionLabel(initialRules.find((item) => item.id === 'r2')!)).toBe('1周年');
    expect(occasionLabel(initialRules.find((item) => item.id === 'r4')!)).toBe('中秋节');
    expect(occasionLabel(initialRules.find((item) => item.id === 'r5')!)).toBe('防暑降温');
    expect(occasionLabel(initialRules.find((item) => item.id === 'r1')!)).toBe('—');
  });
});

describe('dateLabel', () => {
  it('uses fixed date and stays empty for personal care', () => {
    expect(dateLabel(initialRules.find((item) => item.id === 'r5')!)).toBe('07-15');
    expect(dateLabel(initialRules.find((item) => item.id === 'r4')!)).toBe('—');
    expect(dateLabel(initialRules.find((item) => item.id === 'r1')!)).toBe('—');
  });
});

describe('pushTimeLabel', () => {
  it('prefixes 前一天 or 当天 for non-event rules', () => {
    expect(pushTimeLabel(initialRules.find((item) => item.id === 'r1')!)).toBe('当天 09:00:00');
    expect(pushTimeLabel({ ...initialRules.find((item) => item.id === 'r4')!, pushOffset: '前一天' })).toBe('前一天 09:30:00');
    expect(pushTimeLabel(initialRules.find((item) => item.id === 'r6')!)).toBe('每日 06:00、15:00、21:00');
  });
});

describe('card variables', () => {
  it('offers 员工姓名 for all care scenes', () => {
    const nameVar = [{ token: EMPLOYEE_NAME_TOKEN, label: '员工姓名' }];
    expect(cardVariablesForType('生日关怀')).toEqual(nameVar);
    expect(cardVariablesForType('周年庆关怀')).toEqual(nameVar);
    expect(cardVariablesForType('入党关怀')).toEqual(nameVar);
    expect(cardVariablesForType('节日关怀')).toEqual(nameVar);
    expect(cardVariablesForType('节气关怀')).toEqual(nameVar);
    expect(cardVariablesForType('其他')).toEqual(nameVar);
    expect(cardVariablesForType('天气关怀')).toEqual(nameVar);
    expect(cardVariablesForType('工作强度关怀')).toEqual(nameVar);
  });

  it('inserts token at the caret so copy position can change', () => {
    expect(insertCardVariable('生日快乐', 0, 0, EMPLOYEE_NAME_TOKEN)).toEqual({
      text: '【员工姓名】生日快乐',
      cursor: EMPLOYEE_NAME_TOKEN.length,
    });
    expect(insertCardVariable('生日快乐', 2, 2, EMPLOYEE_NAME_TOKEN)).toEqual({
      text: '生日【员工姓名】快乐',
      cursor: 2 + EMPLOYEE_NAME_TOKEN.length,
    });
  });

  it('strips html for empty check and highlights 员工姓名 token', () => {
    expect(cardBlessingPlain('<div><br></div>')).toBe('');
    expect(cardBlessingPlain('<b>生日快乐</b>')).toBe('生日快乐');
    expect(highlightCardVariableHtml('<b>祝【员工姓名】快乐</b>')).toContain('care-card-var');
    expect(highlightCardVariableHtml('<b>祝【员工姓名】快乐</b>')).toContain('【员工姓名】');
  });
});
