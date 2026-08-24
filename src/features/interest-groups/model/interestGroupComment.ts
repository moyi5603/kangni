export const INTEREST_GROUP_COMMENT_MOCK_VERSION = 2;

export type InterestGroupComment = {
  id: number;
  activityId: number;
  createdAt: string;
  content: string;
  author: string;
  parentId?: number;
  likedBy: string[];
};

export const initialInterestGroupComments: InterestGroupComment[] = [
  {
    id: 1,
    activityId: 101,
    author: '周棠',
    content: '这周四能安排配速 6 分组的陪跑吗？',
    likedBy: ['许墨', '张悦', '江野'],
    createdAt: '2026-06-10 09:12:00',
  },
  {
    id: 5,
    activityId: 101,
    parentId: 1,
    author: '张悦',
    content: '可以，周四配速组再开一条。',
    likedBy: ['周棠'],
    createdAt: '2026-06-10 09:40:00',
  },
  {
    id: 2,
    activityId: 101,
    author: '许墨',
    content: '跑完江边拉伸别忘啦～',
    likedBy: ['周棠', '江野', '张悦', '李明', '孙新', '陈航', '顾乔', '许墨'],
    createdAt: '2026-06-10 11:40:00',
  },
  {
    id: 3,
    activityId: 201,
    author: '顾乔',
    content: '连营徒步需要自备睡袋吗？',
    likedBy: ['苏曼'],
    createdAt: '2026-06-08 16:05:00',
  },
  {
    id: 4,
    activityId: 301,
    author: '陈航',
    content: '本期共读书目已更新在公告里。',
    likedBy: ['王芳', '赵人事', '周棠', '许墨', '江野'],
    createdAt: '2026-06-09 20:18:00',
  },
];
