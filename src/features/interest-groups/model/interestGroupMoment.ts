import { commentCount, type MomentRecord } from '../../activities/model/moment';

export const INTEREST_GROUP_MOMENT_MOCK_VERSION = 2;

export type InterestGroupMoment = Omit<MomentRecord, 'activityId'> & {
  groupId: number;
  activityId?: number;
};

export function interestGroupMomentCommentTotal(item: InterestGroupMoment): number {
  return commentCount(item);
}

export const initialInterestGroupMoments: InterestGroupMoment[] = [
  {
    id: 1,
    groupId: 1,
    activityId: 102,
    author: '江野',
    content: '初夏漫步打卡，夕阳刚好。',
    type: '图文类型',
    imageUrls: ['/activities/share.jpg'],
    status: '已通过',
    createdAt: '2026-06-02 19:30:00',
    updatedAt: '2026-06-02 19:30:00',
    likedBy: ['张悦', '周棠'],
    comments: [
      {
        id: 11,
        author: '周棠',
        content: '这张光线很好。',
        createdAt: '2026-06-02 20:10:00',
        replies: [{ id: 111, author: '江野', content: '江边风大，拍了好几张。', createdAt: '2026-06-02 20:18:00' }],
      },
    ],
  },
  {
    id: 2,
    groupId: 2,
    activityId: 201,
    author: '苏曼',
    content: '营地日出，值回早起。',
    type: '图文类型',
    imageUrls: ['/activities/onboarding.jpg', '/activities/share.jpg'],
    status: '待审核',
    createdAt: '2026-06-03 06:45:00',
    updatedAt: '2026-06-03 06:45:00',
    likedBy: [],
    comments: [],
  },
  {
    id: 3,
    groupId: 4,
    activityId: 401,
    author: '沈星',
    content: '昨晚狼人杀高光局。',
    type: '视频',
    imageUrls: [],
    videoUrl: '/activities/open-day.jpg',
    status: '已驳回',
    rejectReason: '画面模糊，请补清晰成片',
    createdAt: '2026-06-07 22:10:00',
    updatedAt: '2026-06-08 09:00:00',
    likedBy: [],
    comments: [],
  },
];
