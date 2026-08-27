import { defaultSignupFields } from '../../activities/model/signupFields';
import type { InterestGroupActivityFormValues } from './interestGroupActivity';

export const INTEREST_GROUP_AI_PLAN_EXAMPLES = [
  '每周三下班后组织一次滨江夜跑，8 公里，分配速组',
  '周末搞一次中级难度的登山看日出，需要拼车',
  '午休时间在休闲区办一个轻松的桌游局，适合新人',
] as const;

export const INTEREST_GROUP_AI_PLAN_THINK_MS = 1700;

let pendingAiActivityDraft: InterestGroupActivityFormValues | null = null;

export function setPendingAiActivityDraft(draft: InterestGroupActivityFormValues | null) {
  pendingAiActivityDraft = draft;
}

export function takePendingAiActivityDraft(): InterestGroupActivityFormValues | null {
  const draft = pendingAiActivityDraft;
  pendingAiActivityDraft = null;
  return draft;
}

function alignForm(draft: Omit<InterestGroupActivityFormValues, keyof ReturnType<typeof formAlign>> & Partial<InterestGroupActivityFormValues>): InterestGroupActivityFormValues {
  return { ...formAlign(), ...draft };
}

function formAlign() {
  return {
    signupStartAt: '2026-05-01 09:00',
    signupEndAt: '2026-06-30 18:00',
    signupHoursBefore: 0,
    visibility: '全员' as const,
    departments: [] as string[],
    customPeople: [] as string[],
    importFileName: '',
    importedPeople: [] as string[],
    notifyOnPublish: false,
    needAudit: false,
    signupApprovalNodes: [] as InterestGroupActivityFormValues['signupApprovalNodes'],
    signupFields: defaultSignupFields(),
    signupPoints: 1,
    signupPointsEnabled: false,
  };
}

export function planInterestGroupActivity(
  prompt: string,
  options?: { groupId?: number; categoryKey?: string },
): InterestGroupActivityFormValues {
  const text = prompt.trim();
  const isHike = /登山|徒步|日出/.test(text);
  const isRun = /跑|夜跑/.test(text);
  const planned: InterestGroupActivityFormValues = isHike
    ? alignForm({
        title: '云端晨行看日出',
        groupId: 2,
        categoryKey: 'sport',
        type: 'series',
        sessions: [
          { startAt: '2026-06-15 04:30', endAt: '2026-06-15 14:00' },
          { startAt: '2026-06-29 04:30', endAt: '2026-06-29 14:00' },
        ],
        signupHoursBefore: 2,
        location: '云栖谷停车场 (统一拼车)',
        capacity: 24,
        detailHtml:
          '<p>凌晨集合拼车前往云栖谷，<b>登顶迎接第一缕阳光</b>，溪谷线下撤。</p><ul><li>全程约 9 公里、累计爬升 600m，中级强度</li><li>领队持野外急救证，提供保险与能量补给</li><li>需登山鞋，头灯由小组统一准备</li></ul>',
        coverUrl: '',
      })
    : isRun
      ? alignForm({
          title: '滨江 8K 夜跑',
          groupId: 1,
          categoryKey: 'sport',
          type: 'recurring',
          repeatWeekday: 3,
          timeStart: '19:30',
          timeEnd: '21:00',
          cycleStart: '2026-06-01',
          cycleEnd: '2026-08-31',
          signupHoursBefore: 2,
          location: '滨江园区南门集合',
          capacity: 40,
          detailHtml:
            '<p>沿滨江绿道往返 8 公里，按 <b>6′30″ / 6′00″ / 5′30″</b> 分三个配速组。</p><ul><li>出发前 10 分钟动态拉伸，跑后江边拉伸</li><li>跑完自由聚餐(AA)，零基础友好，有陪跑员</li></ul>',
          coverUrl: '',
        })
      : alignForm({
          title: '午休桌游局',
          groupId: 4,
          categoryKey: 'game',
          type: 'once',
          startAt: '2026-06-04 12:30',
          endAt: '2026-06-04 13:20',
          signupStartAt: '2026-06-01 09:00',
          signupEndAt: '2026-06-04 12:00',
          location: '休闲区 3 号桌',
          capacity: 10,
          detailHtml:
            '<p>午饭吃快点，我们一起放松一下！</p><ul><li>本期桌游，新手有教学</li><li>40 分钟一局，绝不耽误下午摸鱼</li></ul>',
          coverUrl: '',
        });

  if (options?.groupId) {
    return {
      ...planned,
      groupId: options.groupId,
      categoryKey: options.categoryKey ?? planned.categoryKey,
      coverUrl: '',
    };
  }
  return planned;
}
